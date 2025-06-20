// src/controllers/dashboard.controller.ts

import { Request, Response } from 'express';
import IotStatistic from '../models/nosql/iot_statistic.models';
import { MasterIotInterface } from '../interface';
import { MasterIotGlobal } from "../global";
import { PipelineStage } from 'mongoose';
import logger from "../config/logger";

// === INTERFACES ===
// Frontend và Backend đều dùng giây cho timestamp
interface DashboardQueryBase {
    startTime?: string; // Nhận từ FE là seconds string
    endTime?: string;   // Nhận từ FE là seconds string
    deviceId?: string;
    cmd?: string;
}

interface PacketCountsOverTimeQuery extends DashboardQueryBase {
    interval?: 'hourly' | 'daily' | 'weekly';
}

interface TopMissedDevicesQuery extends DashboardQueryBase {
    topLimit?: string;
}

interface HourlyPerformanceMetricQuery extends DashboardQueryBase {
    deviceId?: string;
}

// Interfaces cho dữ liệu trả về (cập nhật để timeBucket/lastSeen là giây, FE sẽ xử lý)
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
    timeBucket: number; // Unix timestamp in seconds for FE (FE sẽ tự nhân 1000 khi dùng Date object)
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
    lastSeen: number; // Unix timestamp in seconds for FE (FE sẽ tự nhân 1000 khi dùng Date object)
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
    lastConnected: number; // Unix timestamp in seconds for FE (FE sẽ tự nhân 1000 khi dùng Date object)
    disconnectCount: number;
    averageLatencyMs?: number;
}

interface HourlyPerformanceMetricData {
    timeBucket: number; // Unix timestamp in seconds for FE (FE sẽ tự nhân 1000 khi dùng Date object)
    deviceId: string;
    avgCpuUsagePercentage?: number;
    avgRamUsageMB?: number;
    avgBatteryLevelPercentage?: number;
}

// === HELPER FUNCTIONS ===

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
        throw new Error("Failed to load device information.");
    }
};

// Hàm tiện ích để chuẩn bị matchQuery và xử lý parse thời gian
// Giả định timestamp trong DB và từ FE đều LÀ GIÂY
const prepareMatchQuery = (query: DashboardQueryBase) => {
    let parsedStartTimeSeconds: number | undefined;
    let parsedEndTimeSeconds: number | undefined;

    if (query.startTime) {
        // NHẬN TỪ FRONTEND LÀ GIÂY, SỬ DỤNG TRỰC TIẾP
        parsedStartTimeSeconds = parseInt(query.startTime);
        if (isNaN(parsedStartTimeSeconds)) {
            throw new Error("Tham số 'startTime' không hợp lệ. Phải là Unix timestamp (giây).");
        }
    }
    if (query.endTime) {
        // NHẬN TỪ FRONTEND LÀ GIÂY, SỬ DỤNG TRỰC TIẾP
        parsedEndTimeSeconds = parseInt(query.endTime);
        if (isNaN(parsedEndTimeSeconds)) {
            throw new Error("Tham số 'endTime' không hợp lệ. Phải là Unix timestamp (giây).");
        }
    }

    if (parsedStartTimeSeconds && parsedEndTimeSeconds && parsedStartTimeSeconds >= parsedEndTimeSeconds) {
        throw new Error("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.");
    }

    const matchQuery: any = {};
    if (parsedStartTimeSeconds || parsedEndTimeSeconds) {
        matchQuery.timestamp = {};
        if (parsedStartTimeSeconds) matchQuery.timestamp.$gte = parsedStartTimeSeconds;
        if (parsedEndTimeSeconds) matchQuery.timestamp.$lte = parsedEndTimeSeconds;
    }
    if (query.deviceId) matchQuery.deviceId = query.deviceId;
    if (query.cmd) matchQuery.cmd = query.cmd;

    return matchQuery;
};

// === CÁC CONTROLLER ===

// 1. Controller cho Tổng quan gói tin
export const getOverallSummary = async (req: Request<{}, {}, {}, DashboardQueryBase>, res: Response) => {
    try {
        const matchQuery = prepareMatchQuery(req.query);

        const result = await IotStatistic.aggregate<OverallSummaryData>([
            { $match: matchQuery }, // matchQuery.timestamp giờ là giây
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

        const summaryData = result.length > 0 ? result[0] : {
            totalPackets: 0, successfulPackets: 0, missedPackets: 0, missRatePercentage: 0,
            totalUniqueDevices: 0, totalUniqueCommands: 0
        };

        res.status(200).json(summaryData);

    } catch (error: any) {
        logger.error("Error in getOverallSummary:", error.message);
        res.status(400).json({ message: error.message || "Failed to get overall summary." });
    }
};

// 2. Controller cho đếm gói tin theo thời gian
export const getPacketCountsOverTime = async (req: Request<{}, {}, {}, PacketCountsOverTimeQuery>, res: Response) => {
    try {
        const { interval = 'daily' } = req.query;
        const matchQuery = prepareMatchQuery(req.query); // matchQuery.timestamp giờ là giây

        const validIntervals = ['hourly', 'daily', 'weekly'];
        if (!validIntervals.includes(interval)) {
            return res.status(400).send({ message: `Tham số 'interval' không hợp lệ. Phải là một trong: ${validIntervals.join(', ')}.` });
        }

        let groupFormat: string;
        switch (interval) {
            case 'hourly':
                groupFormat = "%Y-%m-%d %H";
                break;
            case 'daily':
                groupFormat = "%Y-%m-%d";
                break;
            case 'weekly':
                groupFormat = "%Y-%U";
                break;
            default:
                groupFormat = "%Y-%m-%d %H";
        }

        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: groupFormat,
                            // $timestamp trong DB là giây, CHUYỂN THẲNG SANG DATE (MONGODB SẼ HIỂU LÀ MILISECONDS NẾU KHÔNG CÓ $multiply)
                            // ĐỂ $toDate HIỂU ĐÚNG GIÂY THÌ NÊN DÙNG $convert VỚI unit: 'seconds' HOẶC $multiply MỚI CHUYỂN
                            // Nhưng nếu dữ liệu DB thực sự là giây, và bạn muốn group theo ngày/giờ,
                            // thì MongoDB aggregation thường mong đợi mili giây cho $toDate.
                            // Cách tốt nhất là sử dụng $convert để chỉ định rõ đơn vị.

                            // CẬP NHẬT: VỚI MongoDB version 4.0+ có $toDate chuyển đổi từ int sang Date.
                            // Tuy nhiên, nó sẽ coi int là miliseconds. Để chuyển từ GIÂY, bạn PHẢI nhân 1000.
                            // Vậy nên, logic $multiply vẫn cần thiết cho aggregation để $toDate hoạt động đúng.
                            // Sau đó, đầu ra của timeBucket sẽ là milliseconds, và FE sẽ dùng trực tiếp.
                            date: { $toDate: { $multiply: ["$timestamp", 1000] } }
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
                date = new Date(d.setDate(d.getDate() - d.getDay()));
            } else {
                date = new Date(item.timeBucketString);
            }
            return {
                // date.getTime() trả về miliseconds. FE sẽ sử dụng miliseconds.
                timeBucket: date.getTime(),
                successfulPackets: item.successfulPackets,
                missedPackets: item.missedPackets,
                missRatePercentage: parseFloat(item.missRatePercentage.toFixed(2))
            };
        });

        res.status(200).json(results);

    } catch (error: any) {
        logger.error("Error in getPacketCountsOverTime:", error.message);
        res.status(400).json({ message: error.message || "Failed to get packet counts over time." });
    }
};

// 3. Controller cho Top N thiết bị có tỷ lệ gửi lại cao nhất
export const getTopMissedDevices = async (req: Request<{}, {}, {}, TopMissedDevicesQuery>, res: Response) => {
    try {
        const { topLimit = '5' } = req.query;
        const limitNumber = parseInt(topLimit);
        if (isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).send({ message: "Tham số 'topLimit' không hợp lệ. Phải là số dương." });
        }

        const matchQuery = prepareMatchQuery(req.query); // matchQuery.timestamp giờ là giây
        const deviceMap = getDeviceMapping();

        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: "$deviceId",
                    totalPackets: { $count: {} },
                    missedPackets: { $sum: { $cond: [{ $eq: ["$isMissed", true] }, 1, 0] } },
                    lastSeenTimestamp: { $max: "$timestamp" } // lastSeenTimestamp ở đây là giây từ DB
                }
            },
            {
                $project: {
                    _id: 0,
                    deviceId: "$_id",
                    totalPackets: 1,
                    missedPackets: 1,
                    lastSeenTimestamp: 1, // Đây là giây
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
            { $limit: limitNumber }
        ];

        const topDevices = await IotStatistic.aggregate(pipeline);

        const mappedTopDevices = topDevices.map(deviceStat => {
            const deviceInfo = deviceMap.get(deviceStat.deviceId);
            return {
                deviceId: deviceStat.deviceId,
                deviceName: deviceInfo?.deviceName || 'Unknown',
                mac: deviceInfo?.mac || 'Unknown',
                totalPackets: deviceStat.totalPackets,
                missedPackets: deviceStat.missedPackets,
                missRatePercentage: parseFloat(deviceStat.missRatePercentage.toFixed(2)),
                //lastSeenTimestamp đã là giây, NHÂN 1000 ĐỂ TRẢ VỀ MILISECONDS CHO FRONTEND
                lastSeen: deviceStat.lastSeenTimestamp * 1000
            };
        });

        res.status(200).json(mappedTopDevices);

    } catch (error: any) {
        logger.error("Error in getTopMissedDevices:", error.message);
        res.status(400).json({ message: error.message || "Failed to get top missed devices." });
    }
};

// 4. Controller cho thống kê gói tin theo loại lệnh
export const getPacketCountsByCommand = async (req: Request<{}, {}, {}, DashboardQueryBase>, res: Response) => {
    try {
        const matchQuery = prepareMatchQuery(req.query); // matchQuery.timestamp giờ là giây

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
        const mappedResults = results.map(item => ({
            ...item,
            missRatePercentage: parseFloat(item.missRatePercentage.toFixed(2))
        }));

        res.status(200).json(mappedResults);

    } catch (error: any) {
        logger.error("Error in getPacketCountsByCommand:", error.message);
        res.status(400).json({ message: error.message || "Failed to get packet counts by command." });
    }
};

// 5. Controller cho thống kê kết nối thiết bị
export const getDeviceConnectivity = async (req: Request<{}, {}, {}, DashboardQueryBase>, res: Response) => {
    try {
        const matchQuery = prepareMatchQuery(req.query); // matchQuery.timestamp giờ là giây
        const deviceMap = getDeviceMapping();

        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: "$deviceId",
                    lastConnectedTimestamp: { $max: "$timestamp" }, // lastConnectedTimestamp ở đây là giây từ DB
                }
            },
            {
                $project: {
                    _id: 0,
                    deviceId: "$_id",
                    lastConnectedTimestamp: 1, // Đây là giây
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
                isOnline: true,
                // lastConnectedTimestamp đã là giây, NHÂN 1000 ĐỂ TRẢ VỀ MILISECONDS CHO FRONTEND
                lastConnected: item.lastConnectedTimestamp * 1000,
                disconnectCount: 0,
                averageLatencyMs: undefined
            };
        });

        const activeDeviceIds = new Set(results.map(d => d.deviceId));
        deviceMap.forEach((info, id) => {
            if (!activeDeviceIds.has(id)) {
                deviceConnectivityData.push({
                    deviceId: id,
                    deviceName: info.deviceName,
                    mac: info.mac,
                    isOnline: false,
                    lastConnected: 0, // hoặc một timestamp last_seen từ MasterIotGlobal (cũng nhân 1000)
                    disconnectCount: 0,
                    averageLatencyMs: undefined
                });
            }
        });

        const sortedData = deviceConnectivityData.sort((a, b) => (a.isOnline === b.isOnline) ? 0 : a.isOnline ? -1 : 1);
        res.status(200).json(sortedData);

    } catch (err: any) {
        logger.error("Error in getDeviceConnectivity:", err.message);
        res.status(400).json({ message: err.message || "Failed to get device connectivity." });
    }
};

// 6. Controller cho hiệu suất theo giờ (nếu có dữ liệu CPU/RAM/Pin)
export const getHourlyPerformanceMetrics = async (req: Request<{}, {}, {}, HourlyPerformanceMetricQuery>, res: Response) => {
    try {
        const matchQuery = prepareMatchQuery(req.query); // matchQuery.timestamp giờ là giây

        if (!matchQuery.deviceId) {
            return res.status(400).json({ message: "Vui lòng cung cấp 'deviceId' để xem hiệu suất theo giờ." });
        }

        const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        deviceId: "$deviceId",
                        // $timestamp trong DB là giây, NHÂN 1000 để $toDate xử lý thành mili giây
                        date: { $toDate: { $multiply: ["$timestamp", 1000] } }
                    },
                    avgCpu: { $avg: "$cpuUsage" },
                    avgRam: { $avg: "$ramUsage" },
                    avgBattery: { $avg: "$batteryLevel" }
                }
            },
            {
                $project: {
                    _id: 0,
                    deviceId: "$_id.deviceId",
                    timeBucket: { $toDate: "$_id.date" }, // timeBucket ở đây đã là Date object
                    avgCpuUsagePercentage: "$avgCpu",
                    avgRamUsageMB: "$avgRam",
                    avgBatteryLevelPercentage: "$avgBattery"
                }
            },
            { $sort: { "timeBucket": 1, "deviceId": 1 } }
        ];

        const results = await IotStatistic.aggregate(pipeline);
        const mappedResults = results.map(item => ({
            ...item,
            // .getTime() trả về mili giây từ Date object, phù hợp cho frontend
            timeBucket: item.timeBucket.getTime(),
            avgCpuUsagePercentage: item.avgCpuUsagePercentage !== undefined && item.avgCpuUsagePercentage !== null ? parseFloat(item.avgCpuUsagePercentage.toFixed(2)) : undefined,
            avgRamUsageMB: item.avgRamUsageMB !== undefined && item.avgRamUsageMB !== null ? parseFloat(item.avgRamUsageMB.toFixed(2)) : undefined,
            avgBatteryLevelPercentage: item.avgBatteryLevelPercentage !== undefined && item.avgBatteryLevelPercentage !== null ? parseFloat(item.avgBatteryLevelPercentage.toFixed(2)) : undefined,
        }));

        res.status(200).json(mappedResults);

    } catch (err: any) {
        logger.error("Error in getHourlyPerformanceMetrics:", err.message);
        res.status(400).json({ message: err.message || "Failed to get hourly performance metrics." });
    }
};