// services/cmdStatisticService.ts

import IotStatistic from '../models/nosql/iot_statistic.models';

// Định nghĩa kiểu dữ liệu cho một entry thống kê
interface CmdStatEntry {
    missed: number;
    realTime: number;
}

// Cấu trúc _cmdStatistics (lưu trữ nội bộ): { "deviceId": { "cmd": { missed: number, realTime: number } } }
let _cmdStatistics: Record<string, Record<string, CmdStatEntry>> = {};

// ... (phần code cho ioInstance, setIoInstance vẫn giữ nguyên nếu bạn có dùng Socket.IO) ...


/**
 * Hàm truy vấn MongoDB và cập nhật toàn bộ biến thống kê cho TẤT CẢ CÁC THIẾT BỊ.
 * @returns {Promise<void>}
 */
export async function updateCmdStatisticsFromDB(): Promise<void> {
    try {
        console.log('Starting full cmd statistics update from DB for ALL devices...');
        const results: Array<{ _id: { deviceId: string; cmd: string; isMissed: boolean }; count: number }> = await IotStatistic.aggregate([
            {
                $group: {
                    _id: {
                        deviceId: "$deviceId",
                        cmd: "$cmd",
                        isMissed: "$isMissed"
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const newStatistics: Record<string, Record<string, CmdStatEntry>> = {};
        results.forEach(item => {
            const deviceId: string = item._id.deviceId;
            const cmd: string = item._id.cmd;
            const isMissed: boolean = item._id.isMissed;
            const count: number = item.count;

            if (!newStatistics[deviceId]) {
                newStatistics[deviceId] = {};
            }
            if (!newStatistics[deviceId][cmd]) {
                newStatistics[deviceId][cmd] = { missed: 0, realTime: 0 };
            }

            if (isMissed) {
                newStatistics[deviceId][cmd].missed += count;
            } else {
                newStatistics[deviceId][cmd].realTime += count;
            }
        });

        _cmdStatistics = newStatistics;
        console.log('Cmd Statistics updated from DB for ALL devices:', _cmdStatistics);

        // ... (phần emit qua Socket.IO nếu có, vẫn gửi toàn bộ _cmdStatistics) ...

    } catch (error) {
        console.error('Error updating cmd statistics from DB:', error);
    }
}

/**
 * Hàm cập nhật (cộng thêm 1) cho một cmd cụ thể của MỘT THIẾT BỊ cụ thể vào biến thống kê trong bộ nhớ.
 * @param deviceId - ID của thiết bị cần cập nhật.
 * @param cmdName - Tên của cmd cần cập nhật.
 * @param isMissed - True nếu là missed packet, False nếu là realtime.
 * @returns {void}
 */
export function incrementCmdStat(deviceId: string, cmdName: string, isMissed: boolean): void {
    if (!_cmdStatistics[deviceId]) {
        _cmdStatistics[deviceId] = {};
    }
    if (!_cmdStatistics[deviceId][cmdName]) {
        _cmdStatistics[deviceId][cmdName] = { missed: 0, realTime: 0 };
    }

    if (isMissed) {
        _cmdStatistics[deviceId][cmdName].missed = (_cmdStatistics[deviceId][cmdName].missed || 0) + 1;
    } else {
        _cmdStatistics[deviceId][cmdName].realTime = (_cmdStatistics[deviceId][cmdName].realTime || 0) + 1;
    }

    console.log(`Cmd '${cmdName}' stat for device '${deviceId}' '${isMissed ? 'missed' : 'realTime'}' incremented.`);

    // ... (phần emit qua Socket.IO nếu có, vẫn gửi toàn bộ _cmdStatistics) ...
}

// Định nghĩa kiểu trả về mới cho getCmdStatistics
// Nó sẽ là một object có trường 'deviceId' và các trường CMD động
type DeviceStatsOutput = { deviceId: string } & Record<string, CmdStatEntry>;

/**
 * Hàm trả về dữ liệu thống kê hiện tại cho MỘT THIẾT BỊ cụ thể.
 * JSON trả về sẽ có trường 'deviceId' ở cùng cấp độ với các CMD keys.
 * @param deviceId - ID của thiết bị để lấy thống kê.
 * @returns {DeviceStatsOutput} - Object chứa thống kê theo cmd cho device đó,
 * có thêm trường deviceId ở top-level.
 */
export function getCmdStatistics(deviceId: string): DeviceStatsOutput {
    const deviceStats = _cmdStatistics[deviceId] || {};

    // @ts-ignore
    return {
        deviceId: deviceId,
        ...deviceStats
    };
}