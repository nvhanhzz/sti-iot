// src/api/dashboard.ts

import { Request, Response, Router } from 'express';
import IotStatistic from '../models/nosql/iot_statistic.models';
import { MasterIotInterface } from '../interface';
import {MasterIotGlobal} from "../global";
import { PipelineStage } from 'mongoose';
import logger from "../config/logger";

interface DashboardQuery {
    startTime?: string;
    endTime?: string;
    deviceId?: string;
    cmd?: string;
    interval?: 'hourly' | 'daily' | 'weekly';
    topLimit?: string;
    dataTypes?: string; // "summary,packetCountsOverTime,..."
}

interface OverallSummaryData {
    totalPackets: number;
    successfulPackets: number;
    missedPackets: number;
    missRatePercentage: number;
    averageResendAttempts?: number;
    totalUniqueDevices: number;
    totalUniqueCommands: number;
}

interface PacketCountOverTimeData {
    timeBucket: number; // Unix timestamp
    successfulPackets: number;
    missedPackets: number;
    missRatePercentage: number;
}

interface TopMissedDeviceData {
    deviceId: string;
    deviceName: string;
    mac: string;
    totalPackets: number;
    missedPackets: number;
    missRatePercentage: number;
    lastSeen: number; // Unix timestamp
}

interface PacketCountsByCommandData {
    cmd: string;
    totalPackets: number;
    successfulPackets: number;
    missedPackets: number;
    missRatePercentage: number;
}

interface DeviceConnectivityData {
    deviceId: string;
    deviceName: string;
    mac: string;
    isOnline: boolean;
    lastConnected: number; // Unix timestamp
    disconnectCount: number;
    averageLatencyMs?: number;
}

interface HourlyPerformanceMetricData {
    timeBucket: number; // Unix timestamp
    deviceId: string;
    avgCpuUsagePercentage?: number;
    avgRamUsageMB?: number;
    avgBatteryLevelPercentage?: number;
}

interface DashboardResponse {
    metadata: {
        requestedStartTime?: number;
        requestedEndTime?: number;
        appliedDeviceId?: string;
        appliedCmd?: string;
        appliedInterval?: 'hourly' | 'daily' | 'weekly';
        appliedTopLimit?: number;
        generatedAt: number;
    };
    overallSummary?: OverallSummaryData | { error: string }; // Có thể trả về lỗi nếu phần này thất bại
    packetCountsOverTime?: PacketCountOverTimeData[] | { error: string };
    topMissedDevices?: TopMissedDeviceData[] | { error: string };
    packetCountsByCommand?: PacketCountsByCommandData[] | { error: string };
    deviceConnectivity?: DeviceConnectivityData[] | { error: string };
    hourlyPerformanceMetrics?: HourlyPerformanceMetricData[] | { error: string };
}

// =========================================================================
// HELPER FUNCTIONS CHO TỪNG LOẠI THỐNG KÊ (Đã thêm try-catch)
// =========================================================================

// Helper để lấy map thông tin thiết bị (tên, mac)
const getDeviceMapping = (): Map<string, { deviceName: string; mac: string }> => {
    try {
        const allIots: MasterIotInterface[] = MasterIotGlobal.getAll();
        const deviceMap = new Map<string, { deviceName: string; mac: string }>();
        if (allIots && Array.isArray(allIots)) {
            allIots.forEach((device) => {
                if (device.id) {
                    deviceMap.set(device.id.toString(), {
                        deviceName: device.name || 'Unknown Device',
                        mac: device.mac || 'Unknown MAC'
                    });
                }
            });
        }
        return deviceMap;
    } catch (err) {
        logger.error("Error getting device mapping:", err);
        // Ném lỗi để hàm gọi nó có thể xử lý (hoặc trả về map rỗng nếu chấp nhận được)
        throw new Error("Failed to load device information.");
    }
};

// 1. Hàm tổng quan gói tin
async function _getOverallSummary(matchQuery: any): Promise<OverallSummaryData> {
    try {
        const result = await IotStatistic.aggregate<OverallSummaryData>([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalPackets: { $count: {} },
                    successfulPackets: { $sum: { $cond: [{ $eq: ["$isMissed", false] }, 1, 0] } },
                    missedPackets: { $sum: { $cond: [{ $eq: ["$isMissed", true] }, 1, 0] } },
                    uniqueDevices: { $addToSet: "$deviceId" },
                    uniqueCommands: { $addToSet: "$cmd" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalPackets: 1,
                    successfulPackets: 1,
                    missedPackets: 1,
                    missRatePercentage: {
                        $cond: {
                            if: { $gt: ["$totalPackets", 0] },
                            then: { $multiply: [{ $divide: ["$missedPackets", "$totalPackets"] }, 100] },
                            else: 0
                        }
                    },
                    totalUniqueDevices: { $size: "$uniqueDevices" },
                    totalUniqueCommands: { $size: "$uniqueCommands" }
                }
            }
        ]);

        return result.length > 0 ? result[0] : {
            totalPackets: 0, successfulPackets: 0, missedPackets: 0, missRatePercentage: 0,
            totalUniqueDevices: 0, totalUniqueCommands: 0
        };
    } catch (err) {
        logger.error("Error in _getOverallSummary aggregation:", err);
        throw new Error("Failed to calculate overall summary.");
    }
}

// 2. Hàm đếm gói tin theo thời gian
async function _getPacketCountsOverTime(matchQuery: any, interval: 'hourly' | 'daily' | 'weekly'): Promise<PacketCountOverTimeData[]> {
    try {
        let groupFormat: string;
        switch (interval) {
            case 'hourly':
                groupFormat = "%Y-%m-%d %H";
                break;
            case 'daily':
                groupFormat = "%Y-%m-%d";
                break;
            case 'weekly':
                groupFormat = "%Y-%U"; // %U: Week number of the year (Sunday as the first day of the week)
                break;
            default:
                groupFormat = "%Y-%m-%d %H"; // Default
        }

        // Import PipelineStage để khai báo kiểu tường minh, khắc phục lỗi TypeScript
         // Hoặc import { PipelineStage } from 'mongoose';
        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: groupFormat,
                            date: { $toDate: "$timestamp" }
                        }
                    },
                    successfulPackets: { $sum: { $cond: [{ $eq: ["$isMissed", false] }, 1, 0] } },
                    missedPackets: { $sum: { $cond: [{ $eq: ["$isMissed", true] }, 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    timeBucketString: "$_id",
                    successfulPackets: 1,
                    missedPackets: 1,
                    missRatePercentage: {
                        $cond: {
                            if: { $gt: [{ $add: ["$successfulPackets", "$missedPackets"] }, 0] },
                            then: { $multiply: [{ $divide: ["$missedPackets", { $add: ["$successfulPackets", "$missedPackets"] }] }, 100] },
                            else: 0
                        }
                    }
                }
            },
            { $sort: { "timeBucketString": 1 } }
        ];

        const rawResults = await IotStatistic.aggregate(pipeline);

        const results = rawResults.map(item => {
            let date: Date;
            if (interval === 'weekly') {
                const [year, weekStr] = item.timeBucketString.split('-');
                const week = parseInt(weekStr);
                const d = new Date(parseInt(year), 0, 1 + (week * 7));
                date = new Date(d.setDate(d.getDate() - d.getDay())); // Chỉnh về Chủ Nhật đầu tuần
            } else {
                date = new Date(item.timeBucketString);
            }
            return {
                timeBucket: date.getTime(),
                successfulPackets: item.successfulPackets,
                missedPackets: item.missedPackets,
                missRatePercentage: parseFloat(item.missRatePercentage.toFixed(2))
            };
        });

        return results;
    } catch (err) {
        logger.error("Error in _getPacketCountsOverTime aggregation:", err);
        throw new Error("Failed to calculate packet counts over time.");
    }
}

// 3. Hàm Top N thiết bị có tỷ lệ miss cao nhất
async function _getTopMissedDevices(matchQuery: any, limit: number, deviceMap: Map<string, { deviceName: string; mac: string }>): Promise<TopMissedDeviceData[]> {
    try {
        
        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: "$deviceId",
                    totalPackets: { $count: {} },
                    missedPackets: { $sum: { $cond: [{ $eq: ["$isMissed", true] }, 1, 0] } },
                    lastSeenTimestamp: { $max: "$timestamp" } // Lấy thời gian gần nhất
                }
            },
            {
                $project: {
                    _id: 0,
                    deviceId: "$_id",
                    totalPackets: 1,
                    missedPackets: 1,
                    lastSeenTimestamp: 1,
                    missRatePercentage: {
                        $cond: {
                            if: { $gt: ["$totalPackets", 0] },
                            then: { $multiply: [{ $divide: ["$missedPackets", "$totalPackets"] }, 100] },
                            else: 0
                        }
                    }
                }
            },
            { $sort: { "missRatePercentage": -1, "missedPackets": -1 } },
            { $limit: limit }
        ];

        const topDevices = await IotStatistic.aggregate(pipeline);

        const mappedTopDevices = topDevices.map(deviceStat => {
            const deviceInfo = deviceMap.get(deviceStat.deviceId);
            return {
                deviceId: deviceStat.deviceId,
                deviceName: deviceInfo?.deviceName || 'Unknown Device',
                mac: deviceInfo?.mac || 'Unknown MAC',
                totalPackets: deviceStat.totalPackets,
                missedPackets: deviceStat.missedPackets,
                missRatePercentage: parseFloat(deviceStat.missRatePercentage.toFixed(2)),
                lastSeen: deviceStat.lastSeenTimestamp
            };
        });

        return mappedTopDevices;
    } catch (err) {
        logger.error("Error in _getTopMissedDevices aggregation:", err);
        throw new Error("Failed to calculate top missed devices.");
    }
}

// 4. Hàm thống kê gói tin theo loại lệnh
async function _getPacketCountsByCommand(matchQuery: any): Promise<PacketCountsByCommandData[]> {
    try {
        
        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: "$cmd",
                    totalPackets: { $count: {} },
                    successfulPackets: { $sum: { $cond: [{ $eq: ["$isMissed", false] }, 1, 0] } },
                    missedPackets: { $sum: { $cond: [{ $eq: ["$isMissed", true] }, 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    cmd: "$_id",
                    totalPackets: 1,
                    successfulPackets: 1,
                    missedPackets: 1,
                    missRatePercentage: {
                        $cond: {
                            if: { $gt: ["$totalPackets", 0] },
                            then: { $multiply: [{ $divide: ["$missedPackets", "$totalPackets"] }, 100] },
                            else: 0
                        }
                    }
                }
            },
            { $sort: { "totalPackets": -1 } }
        ];

        const results = await IotStatistic.aggregate(pipeline);
        return results.map(item => ({
            ...item,
            missRatePercentage: parseFloat(item.missRatePercentage.toFixed(2))
        }));
    } catch (err) {
        logger.error("Error in _getPacketCountsByCommand aggregation:", err);
        throw new Error("Failed to calculate packet counts by command.");
    }
}

// 5. Hàm thống kê kết nối thiết bị
async function _getDeviceConnectivity(matchQuery: any, deviceMap: Map<string, { deviceName: string; mac: string }>): Promise<DeviceConnectivityData[]> {
    try {
        
        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: "$deviceId",
                    lastConnectedTimestamp: { $max: "$timestamp" },
                    // Giả định disconnectCount hoặc averageLatencyMs được tính/lưu trữ ở đâu đó
                }
            },
            {
                $project: {
                    _id: 0,
                    deviceId: "$_id",
                    lastConnectedTimestamp: 1,
                }
            }
        ];

        const results = await IotStatistic.aggregate(pipeline);

        const deviceConnectivityData: DeviceConnectivityData[] = results.map(item => {
            const deviceInfo = deviceMap.get(item.deviceId);
            return {
                deviceId: item.deviceId,
                deviceName: deviceInfo?.deviceName || 'Unknown Device',
                mac: deviceInfo?.mac || 'Unknown MAC',
                isOnline: true, // Placeholder: cần logic thực tế để xác định online/offline
                lastConnected: item.lastConnectedTimestamp,
                disconnectCount: 0, // Placeholder: cần logic thực tế để đếm số lần ngắt kết nối
                averageLatencyMs: undefined // Placeholder: cần logic thực tế nếu có trường latencyMs
            };
        });

        // Lấy các thiết bị được biết nhưng không có dữ liệu trong khoảng thời gian (có thể offline)
        const activeDeviceIds = new Set(results.map(d => d.deviceId));
        deviceMap.forEach((info, id) => {
            if (!activeDeviceIds.has(id)) {
                deviceConnectivityData.push({
                    deviceId: id,
                    deviceName: info.deviceName,
                    mac: info.mac,
                    isOnline: false, // Giả định offline nếu không có dữ liệu gần đây
                    lastConnected: 0, // hoặc một timestamp last_seen từ MasterIotGlobal
                    disconnectCount: 0, // Placeholder
                    averageLatencyMs: undefined
                });
            }
        });

        return deviceConnectivityData.sort((a, b) => (a.isOnline === b.isOnline) ? 0 : a.isOnline ? -1 : 1);
    } catch (err) {
        logger.error("Error in _getDeviceConnectivity aggregation:", err);
        throw new Error("Failed to calculate device connectivity.");
    }
}

// 6. Hàm hiệu suất theo giờ (nếu có dữ liệu CPU/RAM/Pin)
async function _getHourlyPerformanceMetrics(matchQuery: any): Promise<HourlyPerformanceMetricData[]> {
    try {
        // Kiểm tra xem matchQuery có lọc theo deviceId hay không
        // Biểu đồ hiệu suất theo giờ thường chỉ có ý nghĩa khi lọc cho 1 thiết bị cụ thể
        if (!matchQuery.deviceId) {
            // Không ném lỗi mà trả về mảng rỗng để API chính không bị lỗi
            return [];
        }

        
        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        deviceId: "$deviceId",
                        hour: { $dateToString: { format: "%Y-%m-%d %H", date: { $toDate: "$timestamp" } } }
                    },
                    // Đảm bảo các trường này tồn tại trong IIotStatistic và dữ liệu thực
                    avgCpu: { $avg: "$cpuUsage" },
                    avgRam: { $avg: "$ramUsage" },
                    avgBattery: { $avg: "$batteryLevel" }
                }
            },
            {
                $project: {
                    _id: 0,
                    deviceId: "$_id.deviceId",
                    timeBucket: { $toDate: "$_id.hour" },
                    avgCpuUsagePercentage: "$avgCpu",
                    avgRamUsageMB: "$avgRam",
                    avgBatteryLevelPercentage: "$avgBattery"
                }
            },
            { $sort: { "timeBucket": 1, "deviceId": 1 } }
        ];

        const results = await IotStatistic.aggregate(pipeline);
        return results.map(item => ({
            ...item,
            timeBucket: item.timeBucket.getTime(),
            avgCpuUsagePercentage: item.avgCpuUsagePercentage !== undefined && item.avgCpuUsagePercentage !== null ? parseFloat(item.avgCpuUsagePercentage.toFixed(2)) : undefined,
            avgRamUsageMB: item.avgRamUsageMB !== undefined && item.avgRamUsageMB !== null ? parseFloat(item.avgRamUsageMB.toFixed(2)) : undefined,
            avgBatteryLevelPercentage: item.avgBatteryLevelPercentage !== undefined && item.avgBatteryLevelPercentage !== null ? parseFloat(item.avgBatteryLevelPercentage.toFixed(2)) : undefined,
        }));
    } catch (err) {
        logger.error("Error in _getHourlyPerformanceMetrics aggregation:", err);
        throw new Error("Failed to calculate hourly performance metrics.");
    }
}


// =========================================================================
// API CHÍNH: getDashboardData (Đã thêm validate và try-catch toàn diện)
// =========================================================================

export const getDashboardData = async (req: Request<{}, {}, {}, DashboardQuery>, res: Response) => {
    let parsedStartTime: number | undefined;
    let parsedEndTime: number | undefined;
    let limitNumber: number;
    let requestedDataTypes: string[];

    try {
        const {
            startTime,
            endTime,
            deviceId,
            cmd,
            interval = 'daily',
            topLimit = '5',
            dataTypes
        } = req.query;

        // --- 1. Validation đầu vào ---

        // Validate topLimit
        limitNumber = parseInt(topLimit as string);
        if (isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).send({ message: "Tham số 'topLimit' không hợp lệ. Phải là số dương." });
        }

        // Validate startTime & endTime
        if (startTime) {
            parsedStartTime = parseInt(startTime as string) / 1000;
            if (isNaN(parsedStartTime)) {
                return res.status(400).send({ message: "Tham số 'startTime' không hợp lệ. Phải là Unix timestamp (ms)." });
            }
        }
        if (endTime) {
            parsedEndTime = parseInt(endTime as string) / 1000;
            if (isNaN(parsedEndTime)) {
                return res.status(400).send({ message: "Tham số 'endTime' không hợp lệ. Phải là Unix timestamp (ms)." });
            }
        }

        if (parsedStartTime && parsedEndTime && parsedStartTime >= parsedEndTime) {
            return res.status(400).send({ message: "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc." });
        }

        // Validate interval
        const validIntervals = ['hourly', 'daily', 'weekly'];
        if (!validIntervals.includes(interval)) {
            return res.status(400).send({ message: `Tham số 'interval' không hợp lệ. Phải là một trong: ${validIntervals.join(', ')}.` });
        }

        // Validate dataTypes
        const allPossibleDataTypes = [
            'summary', 'packetCountsOverTime', 'topMissedDevices',
            'packetCountsByCommand', 'deviceConnectivity', 'hourlyPerformanceMetrics'
        ];
        requestedDataTypes = dataTypes ? (dataTypes as string).split(',').map(s => s.trim()) : allPossibleDataTypes;

        for (const type of requestedDataTypes) {
            if (!allPossibleDataTypes.includes(type)) {
                return res.status(400).send({ message: `Loại dữ liệu thống kê '${type}' không hợp lệ. Các loại hợp lệ: ${allPossibleDataTypes.join(', ')}.` });
            }
        }

        // --- 2. Xây dựng baseMatchQuery ---
        let baseMatchQuery: any = {};
        if (parsedStartTime || parsedEndTime) {
            baseMatchQuery.timestamp = {};
            if (parsedStartTime) baseMatchQuery.timestamp.$gte = parsedStartTime;
            if (parsedEndTime) baseMatchQuery.timestamp.$lte = parsedEndTime;
        }
        if (deviceId) baseMatchQuery.deviceId = deviceId;
        if (cmd) baseMatchQuery.cmd = cmd;

        // --- 3. Lấy deviceMap (cần handle lỗi nếu MasterIotGlobal có vấn đề) ---
        let deviceMap: Map<string, { deviceName: string; mac: string }>;
        try {
            deviceMap = getDeviceMapping();
        } catch (err) {
            logger.error("Failed to get device mapping:", err);
            // Vẫn cho phép API tiếp tục nhưng không có thông tin deviceName/mac
            deviceMap = new Map();
        }

        // --- 4. Khởi tạo đối tượng phản hồi ---
        const responseData: DashboardResponse = {
            metadata: {
                requestedStartTime: parsedStartTime,
                requestedEndTime: parsedEndTime,
                appliedDeviceId: deviceId,
                appliedCmd: cmd,
                appliedInterval: interval,
                appliedTopLimit: limitNumber,
                generatedAt: Date.now()
            }
        };

        // --- 5. Thực hiện các truy vấn dựa trên dataTypes yêu cầu (với try-catch riêng) ---

        if (requestedDataTypes.includes('summary')) {
            try {
                responseData.overallSummary = await _getOverallSummary(baseMatchQuery);
            } catch (err: any) {
                logger.error("Error fetching overallSummary:", err.message);
                responseData.overallSummary = { error: "Không thể tải tổng quan gói tin: " + err.message };
            }
        }

        if (requestedDataTypes.includes('packetCountsOverTime')) {
            try {
                responseData.packetCountsOverTime = await _getPacketCountsOverTime(baseMatchQuery, interval);
            } catch (err: any) {
                logger.error("Error fetching packetCountsOverTime:", err.message);
                responseData.packetCountsOverTime = { error: "Không thể tải xu hướng gói tin theo thời gian: " + err.message };
            }
        }

        if (requestedDataTypes.includes('topMissedDevices')) {
            try {
                responseData.topMissedDevices = await _getTopMissedDevices(baseMatchQuery, limitNumber, deviceMap);
            } catch (err: any) {
                logger.error("Error fetching topMissedDevices:", err.message);
                responseData.topMissedDevices = { error: "Không thể tải top thiết bị bị miss: " + err.message };
            }
        }

        if (requestedDataTypes.includes('packetCountsByCommand')) {
            try {
                responseData.packetCountsByCommand = await _getPacketCountsByCommand(baseMatchQuery);
            } catch (err: any) {
                logger.error("Error fetching packetCountsByCommand:", err.message);
                responseData.packetCountsByCommand = { error: "Không thể tải gói tin theo lệnh: " + err.message };
            }
        }

        if (requestedDataTypes.includes('deviceConnectivity')) {
            try {
                responseData.deviceConnectivity = await _getDeviceConnectivity(baseMatchQuery, deviceMap);
            } catch (err: any) {
                logger.error("Error fetching deviceConnectivity:", err.message);
                responseData.deviceConnectivity = { error: "Không thể tải trạng thái kết nối thiết bị: " + err.message };
            }
        }

        if (requestedDataTypes.includes('hourlyPerformanceMetrics')) {
            try {
                responseData.hourlyPerformanceMetrics = await _getHourlyPerformanceMetrics(baseMatchQuery);
            } catch (err: any) {
                logger.error("Error fetching hourlyPerformanceMetrics:", err.message);
                responseData.hourlyPerformanceMetrics = { error: "Không thể tải hiệu suất theo giờ: " + err.message };
            }
        }

        // --- 6. Gửi phản hồi thành công ---
        res.status(200).send(responseData);

    } catch (error: any) {
        // --- Xử lý lỗi toàn cục nếu có lỗi validate hoặc lỗi không mong muốn khác ---
        logger.error("Global error in getDashboardData:", error);
        // Gửi lỗi 500 nếu là lỗi server không xác định
        // hoặc lỗi 400 nếu là lỗi validate chưa được bắt trước đó
        res.status(error.message.includes("không hợp lệ") || error.message.includes("phải nhỏ hơn") ? 400 : 500).send({
            message: "Internal Server Error"
        });
    }
};