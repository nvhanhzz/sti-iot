import React, { useEffect, useState, useCallback } from "react";
import { Button, Card, Typography, Flex, Divider, message, Spin, Tooltip } from "antd";
import { PoweroffOutlined } from "@ant-design/icons";
import { useSocket } from "../../../../context/SocketContext.tsx";
const { Title, Text } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Giữ nguyên các HEX_COMMANDS ban đầu cho luồng điều khiển (output flow)
const HEX_COMMANDS = {
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' },
    input1_control: { on: '03 01 07 01 EC', off: '03 01 07 00 EB' },
    input2_control: { on: '04 01 07 01 8E', off: '04 01 07 00 89' },
    input3_control: { on: '05 01 07 01 98', off: '05 01 07 00 9F' },
    input4_control: { on: '06 01 07 01 A2', off: '06 01 07 00 A5' },
} as const;

// Các CMD báo cáo trạng thái mới từ thiết bị (input flow)
const INPUT_STATUS_REPORT_CMDS = {
    CMD_INPUT_CHANNEL1: {
        status: 'CMD_PUSH_IO_DI1_STATUS',   // Digital Input 1 - Status mode
        pulse: 'CMD_PUSH_IO_DI1_PULSE',    // Digital Input 1 - Pulse mode (Hz)
        button: 'CMD_PUSH_IO_DI1_BUTTON',   // Digital Input 1 - Button mode
    },
    CMD_INPUT_CHANNEL2: {
        status: 'CMD_PUSH_IO_DI2_STATUS',
        pulse: 'CMD_PUSH_IO_DI2_PULSE',
        button: 'CMD_PUSH_IO_DI2_BUTTON',
    },
    CMD_INPUT_CHANNEL3: {
        status: 'CMD_PUSH_IO_DI3_STATUS',
        pulse: 'CMD_PUSH_IO_DI3_PULSE',
        button: 'CMD_PUSH_IO_DI3_BUTTON',
    },
    CMD_INPUT_CHANNEL4: {
        status: 'CMD_PUSH_IO_DI4_STATUS',
        pulse: 'CMD_PUSH_IO_DI4_PULSE',
        button: 'CMD_PUSH_IO_DI4_BUTTON',
    },
};

interface ConfigIotsProps {
    dataIotsDetail: any; // dataIotsDetail bây giờ chứa deviceId và mảng CMD trạng thái
    deviceMac: string; // Vẫn truyền deviceMac để nhất quán
    onControlSuccess: () => void;
    isConnected: boolean;
}

const titleButton: { [key: string]: string } = {
    "CMD_INPUT_CHANNEL1": "INPUT 1",
    "CMD_INPUT_CHANNEL2": "INPUT 2",
    "CMD_INPUT_CHANNEL3": "INPUT 3",
    "CMD_INPUT_CHANNEL4": "INPUT 4",
    "CMD_NOTIFY_TCP": "TCP",
    "CMD_NOTIFY_UDP": "UDP"
};

// Cập nhật defaultButtons để bao gồm thông tin về các CMD báo cáo trạng thái
const defaultButtons = [
    {
        CMD: "CMD_INPUT_CHANNEL1",
        dataName: "CMD_INPUT_CHANNEL1",
        data: false, // Trạng thái tổng thể ON/OFF, sẽ được cập nhật từ dataIotsDetail
        hexType: "input1_control" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL1, // Ánh xạ tới các CMD báo cáo
        currentActiveModeLabel: '' // Nhãn của chế độ đang hoạt động (ví dụ: "Status Mode")
    },
    {
        CMD: "CMD_INPUT_CHANNEL2",
        dataName: "CMD_INPUT_CHANNEL2",
        data: false,
        hexType: "input2_control" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL2,
        currentActiveModeLabel: ''
    },
    {
        CMD: "CMD_INPUT_CHANNEL3",
        dataName: "CMD_INPUT_CHANNEL3",
        data: false,
        hexType: "input3_control" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL3,
        currentActiveModeLabel: ''
    },
    {
        CMD: "CMD_INPUT_CHANNEL4",
        dataName: "CMD_INPUT_CHANNEL4",
        data: false,
        hexType: "input4_control" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL4,
        currentActiveModeLabel: ''
    },
    { CMD: "CMD_NOTIFY_TCP", dataName: "CMD_NOTIFY_TCP", data: false, hexType: "tcp" as keyof typeof HEX_COMMANDS },
    { CMD: "CMD_NOTIFY_UDP", dataName: "CMD_NOTIFY_UDP", data: false, hexType: "udp" as keyof typeof HEX_COMMANDS }
];

// Định nghĩa kiểu dữ liệu cho một entry thống kê
interface CmdStats {
    missed: number;
    realTime: number;
}
type StatisticsData = { [cmd: string]: CmdStats };

/**
 * Helper function to format large numbers (e.g., 1200000 -> 1.2M)
 */
const formatCount = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

const ViewButton: React.FC<ConfigIotsProps> = ({ dataIotsDetail, deviceMac, onControlSuccess, isConnected }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [cmdStatistics, setCmdStatistics] = useState<StatisticsData>({});
    const socket = useSocket();

    const sendDeviceCommand = useCallback(async (mac: string, hexCommand: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/iots/server-publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mac: mac, hex: hexCommand })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! status: ${response.status}. Message: ${errorData.message || response.statusText}`);
            }
            onControlSuccess();
            message.success("Gửi yêu cầu thành công");
        } catch (error) {
            console.error('Error sending command:', error);
            if (error instanceof Error) {
                message.error(`Lỗi khi gửi yêu cầu: ${error.message}`);
            } else {
                message.error("Lỗi khi gửi yêu cầu điều khiển");
            }
            throw error;
        }
    }, [onControlSuccess]);

    const handleCommand = useCallback(async (item: any) => {
        if (!isConnected) {
            message.warning("Thiết bị không kết nối.");
            return;
        }
        // Luồng điều khiển (output flow) giữ nguyên: dựa vào item.data để gửi 'on'/'off'
        const currentStatus = item.data;
        const newStatus = !currentStatus;
        const hexCommandKey = newStatus ? 'on' : 'off';

        // @ts-ignore
        if (!item.hexType || !HEX_COMMANDS[item.hexType]?.[hexCommandKey]) {
            console.error(`Missing hex command for type: ${item.hexType} or status: ${hexCommandKey}`);
            message.error("Lỗi: Không tìm thấy lệnh điều khiển.");
            return;
        }

        // @ts-ignore
        const hexCommand = HEX_COMMANDS[item.hexType][hexCommandKey];
        const loadingKey = `${item.hexType}-${hexCommandKey}`;

        try {
            setLoading(prev => ({ ...prev, [loadingKey]: true }));
            await sendDeviceCommand(deviceMac, hexCommand);
            // Optimistic update: Cập nhật trạng thái UI ngay lập tức
            setData(prevData =>
                prevData.map(d =>
                    d.CMD === item.CMD
                        ? { ...d, data: newStatus, currentActiveModeLabel: newStatus ? item.currentActiveModeLabel : '' }
                        : d
                )
            );
        } catch (error) {
            // Error handled in sendDeviceCommand
            // Nếu có lỗi, bạn có thể cần rollback trạng thái UI ở đây
        } finally {
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    }, [sendDeviceCommand, deviceMac, isConnected]);

    // Luồng xử lý trạng thái đầu vào (input flow) đã được thay đổi
    useEffect(() => {
        let processedData = defaultButtons.map(btn => ({ ...btn })); // Tạo bản sao sâu

        if (dataIotsDetail.data && Array.isArray(dataIotsDetail.data)) {
            processedData = processedData.map(defaultItem => {
                // Đối với các nút Input có nhiều CMD báo cáo trạng thái
                if (defaultItem.statusReportCMDs) {
                    let isActive = false;
                    let activeModeLabel = '';

                    // Duyệt qua từng CMD báo cáo trạng thái khả thi của nút này
                    for (const modeKey in defaultItem.statusReportCMDs) {
                        // @ts-ignore: Bỏ qua lỗi TypeScript vì chúng ta biết modeKey là một khóa hợp lệ
                        const reportCmd = defaultItem.statusReportCMDs[modeKey];
                        const deviceDataEntry = dataIotsDetail.data.find((item: any) => item.CMD === reportCmd);

                        if (deviceDataEntry && Boolean(deviceDataEntry.data)) {
                            isActive = true; // Nút này được coi là "ON"
                            // Xác định nhãn của chế độ đang hoạt động
                            switch (modeKey) {
                                case 'status': activeModeLabel = 'Status Mode'; break;
                                case 'pulse': activeModeLabel = 'Pulse Mode'; break;
                                case 'button': activeModeLabel = 'Button Mode'; break;
                                default: activeModeLabel = 'Unknown Mode';
                            }
                            break; // Đã tìm thấy chế độ đang hoạt động, thoát vòng lặp
                        }
                    }

                    return {
                        ...defaultItem,
                        data: isActive, // Cập nhật trạng thái ON/OFF tổng thể của nút
                        currentActiveModeLabel: isActive ? activeModeLabel : '', // Lưu nhãn chế độ đang hoạt động
                    };
                }
                // Đối với các nút TCP/UDP (giữ nguyên cách xử lý ban đầu)
                const deviceData = dataIotsDetail.data.find((item: any) =>
                    // Đảm bảo chỉ kiểm tra các CMD liên quan đến defaultButtons
                    (defaultButtons.some(btn => btn.CMD === item.CMD)) && item.CMD === defaultItem.CMD
                );
                if (deviceData) {
                    return {
                        ...defaultItem,
                        data: Boolean(deviceData.data)
                    };
                }
                return defaultItem;
            });
        }
        setData(processedData);
    }, [dataIotsDetail]); // Phụ thuộc vào dataIotsDetail để cập nhật trạng thái

    // --- Hàm để tải thống kê ban đầu từ API Backend ---
    const fetchInitialStatistics = useCallback(async (id: string) => {
        if (!id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/iots/statistics/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: { deviceId: string } & { [cmd: string]: CmdStats } = await response.json();
            const { deviceId: _, ...cmdLevelStats } = data;
            setCmdStatistics(cmdLevelStats);
            console.log(`Initial statistics loaded for device ${id}:`, cmdLevelStats);
        } catch (error) {
            console.error("Error fetching initial statistics:", error);
            message.error("Lỗi khi tải thống kê ban đầu.");
        }
    }, []);

    useEffect(() => {
        if (dataIotsDetail.id) {
            fetchInitialStatistics(dataIotsDetail.id);
        }
    }, [dataIotsDetail.id, fetchInitialStatistics]);

    // Socket listener cho cập nhật thống kê thời gian thực
    const handleSocketEventStatistics = useCallback((eventData: Record<string, Record<string, CmdStats>>) => {
        // @ts-ignore
        if (dataIotsDetail.id === eventData.deviceId) {
            // @ts-ignore
            setCmdStatistics(eventData);
        }
    }, [dataIotsDetail.id]); // Đã sửa dependency: chỉ cần dataIotsDetail.id

    useEffect(() => {
        if (socket) {
            socket.on("server_emit_statistics", handleSocketEventStatistics);
        }

        return () => {
            if (socket) {
                socket.off("server_emit_statistics", handleSocketEventStatistics);
            }
        };
    }, [socket, handleSocketEventStatistics]);

    return (
        <Flex
            wrap="wrap"
            gap="12px"
            justify="space-around"
            align="flex-start"
            style={{ padding: '8px', height: 'auto', maxHeight: '450px', overflowY: 'auto' }}
        >
            {data.map((item: any) => {
                const isOn = item.data; // item.data bây giờ là trạng thái ON/OFF tổng thể
                const loadingKeyOn = `${item.hexType}-on`;
                const loadingKeyOff = `${item.hexType}-off`;
                const isCurrentlyLoading = loading[loadingKeyOn] || loading[loadingKeyOff];

                // Lấy số liệu thống kê cho CMD chính hiện tại từ state của component
                const currentCmdStats = cmdStatistics[item.CMD] || { missed: 0, realTime: 0 };

                return (
                    <Card
                        key={item.CMD}
                        hoverable
                        style={{
                            width: "140px",
                            minHeight: "135px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                            borderRadius: "8px",
                            transition: "all 0.2s ease-in-out",
                            borderColor: isOn && isConnected ? '#86efac' : (isConnected ? '#fca5a5' : '#e2e8f0'),
                            borderWidth: '1px',
                            opacity: isConnected ? 1 : 0.7,
                            cursor: isConnected ? 'pointer' : 'not-allowed',
                            backgroundColor: '#fff',
                        }}
                        bodyStyle={{ padding: '10px' }}
                    >
                        <div>
                            <Title level={5} style={{ marginBottom: '6px', fontSize: '13px', color: '#334155', lineHeight: '1.2' }}>
                                {titleButton[item.dataName] || item.dataName}
                            </Title>
                            {/* Hiển thị nhãn của chế độ đang hoạt động nếu nút Input đang ON */}
                            {item.statusReportCMDs && isOn && item.currentActiveModeLabel && (
                                <Text type="secondary" style={{ fontSize: '10px', display: 'block', color: '#60a5fa' }}>
                                    {item.currentActiveModeLabel}
                                </Text>
                            )}
                            <Divider style={{ margin: '6px 0' }} />
                        </div>
                        <Flex justify="center" align="center" style={{ flexGrow: 1 }}>
                            <Button
                                type="primary"
                                size="large"
                                loading={isCurrentlyLoading}
                                onClick={() => handleCommand(item)}
                                disabled={!isConnected || isCurrentlyLoading}
                                style={{
                                    backgroundColor: isOn && isConnected ? "#34d399" : "#f472b6",
                                    borderColor: isOn && isConnected ? "#34d399" : "#f472b6",
                                    color: "white",
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: '20px',
                                    boxShadow: `0 4px 12px ${isOn && isConnected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(244, 114, 182, 0.3)'}`,
                                    transition: "background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                }}
                            >
                                {isCurrentlyLoading ? <Spin size="small" /> : <PoweroffOutlined />}
                            </Button>
                        </Flex>
                        {/* Phần hiển thị thống kê tin nhắn với Tooltip */}
                        <Flex justify="space-between" align="center" style={{ marginTop: '8px', padding: '0 4px' }}>
                            <Tooltip title={`Số bản tin đã nhận theo thời gian thực: ${currentCmdStats.realTime.toString()}`}>
                                <Text style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold', minWidth: '40px' }}>
                                    RT: {formatCount(currentCmdStats.realTime)}
                                </Text>
                            </Tooltip>
                            <Tooltip title={`Số bản tin đã nhận sau khi thiết bị gửi lại: ${currentCmdStats.missed.toString()}`}>
                                <Text style={{ fontSize: '11px', color: '#f87171', fontWeight: 'bold', minWidth: '40px' }}>
                                    MS: {formatCount(currentCmdStats.missed)}
                                </Text>
                            </Tooltip>
                        </Flex>
                    </Card>
                );
            })}
        </Flex>
    );
};

export default ViewButton;