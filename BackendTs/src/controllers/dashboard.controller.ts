// src/controllers/dashboard.controller.ts

import { Request, Response } from 'express';
import IotStatistic from '../models/nosql/iot_statistic.models';
import { MasterIotInterface } from '../interface';
import { MasterIotGlobal } from "../global";
import { PipelineStage } from 'mongoose';
import logger from "../config/logger";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; // Import UTC plugin
import timezone from 'dayjs/plugin/timezone'; // Import Timezone plugin
import weekOfYear from 'dayjs/plugin/weekOfYear'; // Import weekOfYear for %U

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear); // Make sure weekOfYear is also extended

// === INTERFACES === (Giữ nguyên)
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

// Interfaces cho dữ liệu trả về (Đã xác nhận timeBucket/lastSeen là GIÂY)
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
    timeBucket: number; // Unix timestamp in SECONDS
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
    lastSeen: number; // Unix timestamp in SECONDS
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
    lastConnected: number; // Unix timestamp in SECONDS
    disconnectCount: number;
    averageLatencyMs?: number;
}

interface HourlyPerformanceMetricData {
    timeBucket: number; // Unix timestamp in SECONDS
    deviceId: string;
    avgCpuUsagePercentage?: number;
    avgRamUsageMB?: number;
    avgBatteryLevelPercentage?: number;
}

// === HELPER FUNCTIONS === (Sửa đổi `prepareMatchQuery` nếu cần, và `getDeviceMapping`)

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
        parsedStartTimeSeconds = parseInt(query.startTime);
        if (isNaN(parsedStartTimeSeconds)) {
            throw new Error("Tham số 'startTime' không hợp lệ. Phải là Unix timestamp (giây).");
        }
    }
    if (query.endTime) {
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

interface DeviceListItem {
    id: string;
    name: string;
    mac?: string; // MAC address có thể là tùy chọn
}

export const getDeviceList = async (req: Request, res: Response) => {
    try {
        const allIots: MasterIotInterface[] = MasterIotGlobal.getAll(); // Lấy tất cả thiết bị từ MasterIotGlobal

        if (!allIots || !Array.isArray(allIots)) {
            return res.status(200).json([]); // Trả về mảng rỗng nếu không có thiết bị
        }

        // Map dữ liệu để trả về chỉ id, name và mac (nếu có)
        const deviceList: DeviceListItem[] = allIots.map(device => ({
            id: device.id ? device.id.toString() : 'Unknown ID', // Đảm bảo ID là string
            name: device.name || 'Unknown Device',
            mac: device.mac || undefined // Thêm MAC nếu cần thiết
        }));

        // Sắp xếp theo tên thiết bị hoặc ID
        deviceList.sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json(deviceList);
    } catch (error: any) {
        logger.error("Error in getDeviceList:", error.message);
        res.status(500).json({ message: error.message || "Failed to get device list." });
    }
};

// 1. Controller cho Tổng quan gói tin (Không thay đổi)
export const getOverallSummary = async (req: Request<{}, {}, {}, DashboardQueryBase>, res: Response) => {
    try {
        const matchQuery = prepareMatchQuery(req.query);

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
        const matchQuery = prepareMatchQuery(req.query);

        const validIntervals = ['hourly', 'daily', 'weekly'];
        if (!validIntervals.includes(interval)) {
            return res.status(400).send({ message: `Tham số 'interval' không hợp lệ. Phải là một trong: ${validIntervals.join(', ')}.` });
        }

        let groupFormat: string;
        // Sử dụng múi giờ +07:00 (Asia/Ho_Chi_Minh) cho aggregation
        const targetTimezone = "Asia/Ho_Chi_Minh"; // Hoặc "+07:00"

        switch (interval) {
            case 'hourly':
                groupFormat = "%Y-%m-%d %H"; // Format: "2024-06-20 15"
                break;
            case 'daily':
                groupFormat = "%Y-%m-%d"; // Format: "2024-06-20"
                break;
            case 'weekly':
                groupFormat = "%Y-%U"; // Format: "2024-25" (year-week number, Sunday start)
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
                            date: { $toDate: { $multiply: ["$timestamp", 1000] } },
                            timezone: targetTimezone // Đảm bảo output của MongoDB theo +07:00
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
            let parsedDate: dayjs.Dayjs;

            if (interval === 'weekly') {
                const [year, weekStr] = item.timeBucketString.split('-');
                const week = parseInt(weekStr);

                // Dùng dayjs.tz() để parse chuỗi ở múi giờ đích (Asia/Ho_Chi_Minh)
                // và tính toán tuần dựa trên Chủ Nhật.
                // firstDayOfYear: Jan 1st of the year, in the target timezone
                const jan1st = dayjs.tz(`${year}-01-01`, targetTimezone);
                // Find the first Sunday of the year (which could be Jan 1st or later), in the target timezone
                const firstSundayOfYear = jan1st.day() === 0 ? jan1st : jan1st.day(7);

                // Add `week` weeks to find the Sunday of the target week.
                // This aligns with MongoDB's %U which is Sunday-based and 0-indexed for the first week.
                parsedDate = firstSundayOfYear.add(week, 'weeks');

            } else if (interval === 'hourly') {
                // Parse chuỗi "YYYY-MM-DD HH" và xác định nó ở múi giờ đích
                parsedDate = dayjs.tz(item.timeBucketString, "YYYY-MM-DD HH", targetTimezone);
            } else { // daily
                // Parse chuỗi "YYYY-MM-DD" và xác định nó ở múi giờ đích
                parsedDate = dayjs.tz(item.timeBucketString, "YYYY-MM-DD", targetTimezone);
            }

            if (!parsedDate.isValid()) {
                logger.error(`Failed to parse date string "<span class="math-inline">\{item\.timeBucketString\}" for interval "</span>{interval}" in timezone ${targetTimezone}`);
                return {
                    timeBucket: null,
                    successfulPackets: item.successfulPackets,
                    missedPackets: item.missedPackets,
                    missRatePercentage: item.missRatePercentage
                };
            }

            // Trả về Unix timestamp (giây) của thời điểm đó (đã ở múi giờ +07:00)
            return {
                timeBucket: parsedDate.unix(),
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

// 3. Controller cho Top N thiết bị có tỷ lệ gửi lại cao nhất (Không thay đổi)
export const getTopMissedDevices = async (req: Request<{}, {}, {}, TopMissedDevicesQuery>, res: Response) => {
    try {
        const { topLimit = '5' } = req.query;
        const limitNumber = parseInt(topLimit);
        if (isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).send({ message: "Tham số 'topLimit' không hợp lệ. Phải là số dương." });
        }

        const matchQuery = prepareMatchQuery(req.query);
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
                lastSeen: deviceStat.lastSeenTimestamp // lastSeenTimestamp đã là giây, TRẢ VỀ TRỰC TIẾP
            };
        });

        res.status(200).json(mappedTopDevices);

    } catch (error: any) {
        logger.error("Error in getTopMissedDevices:", error.message);
        res.status(400).json({ message: error.message || "Failed to get top missed devices." });
    }
};

// 4. Controller cho thống kê gói tin theo loại lệnh (Không thay đổi)
export const getPacketCountsByCommand = async (req: Request<{}, {}, {}, DashboardQueryBase>, res: Response) => {
    try {
        const matchQuery = prepareMatchQuery(req.query);

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

// 5. Controller cho thống kê kết nối thiết bị (Không thay đổi, vẫn trả về giây)
export const getDeviceConnectivity = async (req: Request<{}, {}, {}, DashboardQueryBase>, res: Response) => {
    try {
        const matchQuery = prepareMatchQuery(req.query);
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
                lastConnected: item.lastConnectedTimestamp, // lastConnectedTimestamp đã là giây, TRẢ VỀ TRỰC TIẾP
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
                    lastConnected: 0, // hoặc một timestamp last_seen từ MasterIotGlobal (cũng là giây)
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

// 6. Controller cho hiệu suất theo giờ (Đã sửa đổi logic parsing date và lỗi typo)
export const getHourlyPerformanceMetrics = async (req: Request<{}, {}, {}, HourlyPerformanceMetricQuery>, res: Response) => {
    try {
        const matchQuery = prepareMatchQuery(req.query);

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
                        date: { $toDate: { $multiply: ["$timestamp", 1000] } },
                        timezone: "Asia/Ho_Chi_Minh" // Đảm bảo output của MongoDB theo +07:00
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
                    timeBucketString: "$_id.date", // Lấy chuỗi định dạng từ group
                    avgCpuUsagePercentage: "$avgCpu",
                    avgRamUsageMB: "$avgRam",
                    avgBatteryLevelPercentage: "$avgBattery"
                }
            },
            { $sort: { "timeBucketString": 1, "deviceId": 1 } }
        ];

        const rawResults = await IotStatistic.aggregate(pipeline);
        const mappedResults = rawResults.map(item => {
            const parsedDate = dayjs.tz(item.timeBucketString, "YYYY-MM-DD HH", "Asia/Ho_Chi_Minh"); // Parse as +07:00

            if (!parsedDate.isValid()) {
                logger.error(`Failed to parse hourly date string "${item.timeBucketString}"`);
                return {
                    timeBucket: null,
                    deviceId: item.deviceId,
                    avgCpuUsagePercentage: undefined,
                    avgRamUsageMB: undefined,
                    avgBatteryLevelPercentage: undefined,
                };
            }

            return {
                timeBucket: parsedDate.unix(), // Trả về giây
                deviceId: item.deviceId,
                avgCpuUsagePercentage: item.avgCpuUsagePercentage !== undefined && item.avgCpuUsagePercentage !== null ? parseFloat(item.avgCpuUsagePercentage.toFixed(2)) : undefined,
                avgRamUsageMB: item.avgRamUsageMB !== undefined && item.avgRamUsageMB !== null ? parseFloat(item.avgRamUsageMB.toFixed(2)) : undefined,
                avgBatteryLevelPercentage: item.avgBatteryLevelPercentage !== undefined && item.avgBatteryLevelPercentage !== null ? parseFloat(item.avgBatteryLevelPercentage.toFixed(2)) : undefined,
            };
        });

        res.status(200).json(mappedResults);

    } catch (err: any) {
        logger.error("Error in getHourlyPerformanceMetrics:", err.message);
        res.status(400).json({ message: err.message || "Failed to get hourly performance metrics." });
    }
};