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

// === INTERFACES ===
interface DashboardQueryBase {
    startTime?: string; // Nhận từ FE là seconds string
    endTime?: string;   // Nhận từ FE là seconds string
    deviceId?: string;
    cmd?: string;
    page?: string;      // Trang hiện tại (string từ query params)
    limit?: string;     // Số lượng mục trên mỗi trang (string từ query params)
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
    timeBucket: number;
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
    lastSeen: number;
}

interface PacketCountsByCommandData {
    cmd: string;
    totalPackets: number;
    successfulPackets: number;
    missedPackets: number;
}

interface DeviceConnectivityData {
    deviceId: string;
    deviceName: string;
    mac: string;
    isOnline: boolean;
    lastConnected: number;
    disconnectCount: number;
    averageLatencyMs?: number;
}

interface HourlyPerformanceMetricData {
    timeBucket: number;
    deviceId: string;
    avgCpuUsagePercentage?: number;
    avgRamUsageMB?: number;
    avgBatteryLevelPercentage?: number;
}

interface FailedCommandStatistic {
    deviceId: string;
    cmd: string;
    timestamp: number; // Unix timestamp in seconds
    isMissed: boolean;
}

// === NEW INTERFACE for Error Type Summary ===
interface ErrorTypeSummaryData {
    cmd: string;
    totalPackets: number;
    successfulPackets: number;
    missedPackets: number;
    percentageOfTotalErrors: number; // Tỷ lệ gói tin của lệnh này trên TỔNG các gói tin lỗi
    successfulRateInCmd: number;     // Tỷ lệ Realtime (thành công) trong chính nhóm lệnh này
    missRateInCmd: number;           // Tỷ lệ Gửi lại (thất bại) trong chính nhóm lệnh này
}
// === END NEW INTERFACE ===


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
    if (query.cmd) matchQuery.cmd = query.cmd; // Giữ lại dòng này cho các controller khác sử dụng

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
            res.status(200).json([]); // Trả về mảng rỗng nếu không có thiết bị
            return;
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

// 1. Controller cho Tổng quan gói tin
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
            res.status(400).send({ message: `Tham số 'interval' không hợp lệ. Phải là một trong: ${validIntervals.join(', ')}.` });
            return;
        }

        let groupFormat: string;
        const targetTimezone = "Asia/Ho_Chi_Minh";

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
                            date: { $toDate: { $multiply: ["$timestamp", 1000] } },
                            timezone: targetTimezone
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

                const jan1st = dayjs.tz(`${year}-01-01`, targetTimezone);
                const firstSundayOfYear = jan1st.day() === 0 ? jan1st : jan1st.day(7);
                parsedDate = firstSundayOfYear.add(week, 'weeks');

            } else if (interval === 'hourly') {
                parsedDate = dayjs.tz(item.timeBucketString, "YYYY-MM-DD HH", targetTimezone);
            } else { // daily
                parsedDate = dayjs.tz(item.timeBucketString, "YYYY-MM-DD", targetTimezone);
            }

            if (!parsedDate.isValid()) {
                logger.error(`Failed to parse date string "${item.timeBucketString}" for interval "${interval}" in timezone ${targetTimezone}`);
                return {
                    timeBucket: null,
                    successfulPackets: item.successfulPackets,
                    missedPackets: item.missedPackets,
                    missRatePercentage: item.missRatePercentage
                };
            }

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

// 3. Controller cho Top N thiết bị có tỷ lệ gửi lại cao nhất
export const getTopMissedDevices = async (req: Request<{}, {}, {}, TopMissedDevicesQuery>, res: Response) => {
    try {
        const { topLimit = '5' } = req.query;
        const limitNumber = parseInt(topLimit);
        if (isNaN(limitNumber) || limitNumber < 1) {
            res.status(400).send({ message: "Tham số 'topLimit' không hợp lệ. Phải là số dương." });
            return;
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

// 4. Controller cho thống kê gói tin theo loại lệnh
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

/**
 * Lấy các bản ghi thông số IoT với các CMD lỗi cụ thể:
 * CMD_STATUS_WIFI_WEAK, CMD_STATUS_MQTT_LOST, CMD_STATUS_ACK_FAIL.
 * Hỗ trợ lọc theo thời gian (startTime, endTime), deviceId và phân trang.
 */
export const getFailedCommandStatistics = async (req: Request<{}, {}, {}, DashboardQueryBase>, res: Response) => {
    try {
        // Lấy các tham số phân trang từ query string
        const page = parseInt(req.query.page as string) || 1; // Mặc định là trang 1
        const limit = parseInt(req.query.limit as string) || 10; // Mặc định 10 mục mỗi trang
        const skip = (page - 1) * limit;

        // Chuẩn bị matchQuery từ các tham số thời gian và deviceId
        // Xóa thuộc tính 'cmd' và các tham số phân trang khỏi req.query
        // trước khi truyền vào prepareMatchQuery để nó không thêm chúng vào matchQuery.
        const queryParamsWithoutPaginationAndCmd = { ...req.query };
        delete queryParamsWithoutPaginationAndCmd.page;
        delete queryParamsWithoutPaginationAndCmd.limit;
        delete queryParamsWithoutPaginationAndCmd.cmd; // Xóa cmd nếu có để nó không xung đột với $in

        const baseMatchQuery = prepareMatchQuery(queryParamsWithoutPaginationAndCmd);

        // Định nghĩa các CMD lỗi cần lấy
        const errorCommands = [
            "CMD_STATUS_WIFI_WEAK",
            "CMD_STATUS_MQTT_LOST",
            "CMD_STATUS_ACK_FAIL"
        ];

        // Kết hợp matchQuery cơ bản với điều kiện lọc CMD lỗi
        const finalMatchQuery = {
            ...baseMatchQuery,
            cmd: { $in: errorCommands } // Chỉ lấy các cmd nằm trong danh sách lỗi
        };

        // Đếm tổng số tài liệu khớp với điều kiện lọc (không phân trang)
        const totalDocuments = await IotStatistic.countDocuments(finalMatchQuery);

        // Thực hiện truy vấn MongoDB với phân trang
        const results = await IotStatistic.find(
            finalMatchQuery,
            {
                deviceId: 1,
                cmd: 1,
                timestamp: 1,
                isMissed: 1,
                _id: 0
            } as any // Ép kiểu đối tượng projection thành 'any' để TypeScript không báo lỗi
        )
            .sort({ timestamp: -1, deviceId: 1 }) // Sắp xếp theo thời gian mới nhất và deviceId
            .skip(skip)   // Bỏ qua số lượng tài liệu theo trang
            .limit(limit) // Giới hạn số lượng tài liệu trả về
            .lean<FailedCommandStatistic[]>(); // Sử dụng .lean() để lấy POJO thay vì Mongoose Documents, giúp tăng hiệu suất

        res.status(200).json({
            data: results,
            pagination: {
                totalDocuments: totalDocuments,
                currentPage: page,
                limit: limit,
                totalPages: Math.ceil(totalDocuments / limit)
            }
        });

    } catch (error: any) {
        logger.error("Error in getFailedCommandStatistics:", error.message);
        res.status(400).json({ message: error.message || "Failed to get failed command statistics." });
    }
};

/**
 * Lấy thống kê tổng hợp về các loại lỗi cụ thể (WiFi Weak, MQTT Lost, ACK Fail).
 * Trả về số lượng, tỷ lệ của từng loại lỗi trên tổng lỗi, và tỷ lệ thành công/gửi lại
 * trong từng loại lỗi đó.
 * Hỗ trợ lọc theo thời gian (startTime, endTime) và deviceId.
 */
export const getErrorTypeSummary = async (req: Request<{}, {}, {}, DashboardQueryBase>, res: Response) => {
    try {
        const baseMatchQuery = prepareMatchQuery(req.query);

        const errorCommands = [
            "CMD_STATUS_WIFI_WEAK",
            "CMD_STATUS_MQTT_LOST",
            "CMD_STATUS_ACK_FAIL"
        ];

        const finalMatchQuery = {
            ...baseMatchQuery,
            cmd: { $in: errorCommands }
        };

        const pipeline: PipelineStage[] = [
            { $match: finalMatchQuery },
            {
                $facet: {
                    // Branch 1: Get overall total packets for all matching error commands
                    overallErrorStats: [
                        { $group: { _id: null, totalErrorPackets: { $sum: 1 } } }
                    ],
                    // Branch 2: Get stats for each individual error command
                    commandErrorStats: [
                        {
                            $group: {
                                _id: "$cmd",
                                totalPackets: { $sum: 1 },
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
                                // Calculate rates within each command group
                                successfulRateInCmd: {
                                    $cond: {
                                        if: { $gt: ["$totalPackets", 0] },
                                        then: { $multiply: [{ $divide: ["$successfulPackets", "$totalPackets"] }, 100] },
                                        else: 0
                                    }
                                },
                                missRateInCmd: {
                                    $cond: {
                                        if: { $gt: ["$totalPackets", 0] },
                                        then: { $multiply: [{ $divide: ["$missedPackets", "$totalPackets"] }, 100] },
                                        else: 0
                                    }
                                }
                            }
                        },
                        { $sort: { "totalPackets": -1 } } // Sort individual command stats
                    ]
                }
            },
            {
                $project: {
                    // Get totalErrorPackets from the overallErrorStats branch, default to 0 if not found
                    overallTotal: { $arrayElemAt: ["$overallErrorStats.totalErrorPackets", 0] },
                    commandStats: "$commandErrorStats"
                }
            },
            {
                // Unwind the commandStats array to process each command individually
                $unwind: "$commandStats"
            },
            {
                // Project final fields and calculate percentageOfTotalErrors
                $project: {
                    _id: 0,
                    cmd: "$commandStats.cmd",
                    totalPackets: "$commandStats.totalPackets",
                    successfulPackets: "$commandStats.successfulPackets",
                    missedPackets: "$commandStats.missedPackets",
                    successfulRateInCmd: "$commandStats.successfulRateInCmd",
                    missRateInCmd: "$commandStats.missRateInCmd",
                    percentageOfTotalErrors: {
                        $cond: {
                            if: { $gt: ["$overallTotal", 0] },
                            then: { $multiply: [{ $divide: ["$commandStats.totalPackets", "$overallTotal"] }, 100] },
                            else: 0
                        }
                    }
                }
            }
        ];

        const results = await IotStatistic.aggregate<ErrorTypeSummaryData>(pipeline).allowDiskUse(true);

        // Format percentages to 2 decimal places for cleaner output
        const formattedResults = results.map(item => ({
            ...item,
            percentageOfTotalErrors: parseFloat(item.percentageOfTotalErrors.toFixed(2)),
            successfulRateInCmd: parseFloat(item.successfulRateInCmd.toFixed(2)),
            missRateInCmd: parseFloat(item.missRateInCmd.toFixed(2))
        }));

        res.status(200).json(formattedResults);

    } catch (error: any) {
        logger.error("Error in getErrorTypeSummary:", error.message);
        res.status(400).json({ message: error.message || "Failed to get error type summary." });
    }
};
