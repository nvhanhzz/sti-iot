import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button, Card, Typography, Divider, message, Spin, Tooltip } from "antd";
import { PoweroffOutlined } from "@ant-design/icons";
import { useSocket } from "../../../../context/SocketContext.tsx";
const { Title, Text } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Các lệnh HEX cho điều khiển thiết bị
const HEX_COMMANDS = {
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' },
    input1_control: { on: '03 01 07 01 EC', off: '03 01 07 00 EB' },
    input2_control: { on: '04 01 07 01 8E', off: '04 01 07 00 89' },
    input3_control: { on: '05 01 07 01 98', off: '05 01 07 00 9F' },
    input4_control: { on: '06 01 07 01 A2', off: '06 01 07 00 A5' },
} as const;

// Các lệnh báo cáo trạng thái cho các kênh đầu vào
const INPUT_STATUS_REPORT_CMDS = {
    CMD_INPUT_CHANNEL1: {
        status: 'CMD_PUSH_IO_DI1_STATUS',
        pulse: 'CMD_PUSH_IO_DI1_PULSE',
        button: 'CMD_PUSH_IO_DI1_BUTTON',
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

// Interface cho props của component
interface ConfigIotsProps {
    dataIotsDetail: any;
    deviceMac: string;
    onControlSuccess: () => void;
    isConnected: boolean;
}

// Map các CMD với tiêu đề hiển thị trên nút
const titleButton: { [key: string]: string } = {
    "CMD_INPUT_CHANNEL1": "INPUT 1",
    "CMD_INPUT_CHANNEL2": "INPUT 2",
    "CMD_INPUT_CHANNEL3": "INPUT 3",
    "CMD_INPUT_CHANNEL4": "INPUT 4",
    "CMD_NOTIFY_TCP": "TCP",
    "CMD_NOTIFY_UDP": "UDP"
};

// Cấu trúc mặc định cho các nút điều khiển
const defaultButtons = [
    {
        CMD: "CMD_INPUT_CHANNEL1",
        dataName: "CMD_INPUT_CHANNEL1",
        data: false,
        hexType: "input1_control" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL1,
        currentActiveModeLabel: '',
        displayValue: null as number | null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_INPUT_CHANNEL2",
        dataName: "CMD_INPUT_CHANNEL2",
        data: false,
        hexType: "input2_control" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL2,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_INPUT_CHANNEL3",
        dataName: "CMD_INPUT_CHANNEL3",
        data: false,
        hexType: "input3_control" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL3,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_INPUT_CHANNEL4",
        dataName: "CMD_INPUT_CHANNEL4",
        data: false,
        hexType: "input4_control" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL4,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_NOTIFY_TCP",
        dataName: "CMD_NOTIFY_TCP",
        data: false,
        hexType: "tcp" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: undefined, // TCP/UDP do not have status report commands
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1 // Not applicable for TCP/UDP but kept for consistent type
    },
    {
        CMD: "CMD_NOTIFY_UDP",
        dataName: "CMD_NOTIFY_UDP",
        data: false,
        hexType: "udp" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: undefined, // TCP/UDP do not have status report commands
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1 // Not applicable for TCP/UDP but kept for consistent type
    }
];

// Interface cho thống kê lệnh
interface CmdStats {
    missed: number;
    realTime: number;
}
// Cập nhật kiểu dữ liệu cho StatisticsData để map CMD chính của button
type StatisticsData = { [buttonCmd: string]: CmdStats };

/**
 * Hàm trợ giúp để định dạng số lớn (ví dụ: 1200000 -> 1.2M)
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
    const [pulseActiveStates, setPulseActiveStates] = useState<{ [cmd: string]: boolean }>({});
    const pulseTimeoutRefs = useRef<{ [cmd: string]: NodeJS.Timeout }>({});
    const socket = useSocket();

    const globalModeDigitalInput = dataIotsDetail.digitalInputConfig?.modeDigitalInput;

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
        } catch (error) {
            // Error handled in sendDeviceCommand
        } finally {
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    }, [sendDeviceCommand, deviceMac, isConnected]);

    useEffect(() => {
        let processedData = defaultButtons.map(btn => ({ ...btn }));

        if (dataIotsDetail.data && Array.isArray(dataIotsDetail.data)) {
            const modeDigitalInput = globalModeDigitalInput;

            processedData = processedData.map(defaultItem => {
                if (defaultItem.statusReportCMDs) {
                    let isActive = defaultItem.data;
                    let activeModeLabel = '';
                    let displayValue: number | null = null;

                    let desiredModeKey: 'status' | 'pulse' | 'button' | undefined;
                    switch (modeDigitalInput) {
                        case 1: desiredModeKey = 'status'; break;
                        case 2: desiredModeKey = 'pulse'; break;
                        case 3: desiredModeKey = 'button'; break;
                        default: desiredModeKey = undefined;
                    }

                    if (desiredModeKey && defaultItem.statusReportCMDs[desiredModeKey]) {
                        const reportCmd = defaultItem.statusReportCMDs[desiredModeKey];
                        const deviceDataEntry = dataIotsDetail.data.find((item: any) => item.CMD === reportCmd);

                        if (deviceDataEntry) {
                            switch (desiredModeKey) {
                                case 'status':
                                    isActive = Boolean(deviceDataEntry.data);
                                    activeModeLabel = 'Status Mode';
                                    break;
                                case 'pulse':
                                    displayValue = typeof deviceDataEntry.data === 'number' ? deviceDataEntry.data : null;
                                    activeModeLabel = 'Pulse Mode';

                                    setPulseActiveStates(prev => {
                                        if (pulseTimeoutRefs.current[defaultItem.CMD]) {
                                            clearTimeout(pulseTimeoutRefs.current[defaultItem.CMD]);
                                        }
                                        pulseTimeoutRefs.current[defaultItem.CMD] = setTimeout(() => {
                                            setPulseActiveStates(p => ({ ...p, [defaultItem.CMD]: false }));
                                        }, 500);
                                        return { ...prev, [defaultItem.CMD]: true };
                                    });
                                    isActive = false;
                                    break;
                                case 'button':
                                    isActive = !Boolean(deviceDataEntry.data);
                                    activeModeLabel = 'Button Mode';
                                    break;
                            }
                        }
                    }

                    return {
                        ...defaultItem,
                        data: isActive,
                        currentActiveModeLabel: activeModeLabel,
                        displayValue: displayValue,
                        modeDigitalInput: modeDigitalInput
                    };
                }

                // Logic cho TCP/UDP
                const deviceData = dataIotsDetail.data.find((item: any) =>
                    defaultItem.CMD === item.CMD
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

        return () => {
            Object.values(pulseTimeoutRefs.current).forEach(clearTimeout);
            pulseTimeoutRefs.current = {};
        };
    }, [dataIotsDetail, globalModeDigitalInput]);

    // Helper function to aggregate statistics for a given button's CMD
    const aggregateButtonStatistics = useCallback((allStats: Record<string, CmdStats>): StatisticsData => {
        const aggregated: StatisticsData = {};

        defaultButtons.forEach(button => {
            let totalMissed = 0;
            let totalRealTime = 0;

            if (button.statusReportCMDs) {
                // For Input Channels, sum up stats from status, pulse, and button CMDS
                Object.values(button.statusReportCMDs).forEach(reportCmd => {
                    if (allStats[reportCmd]) {
                        totalMissed += allStats[reportCmd].missed;
                        totalRealTime += allStats[reportCmd].realTime;
                    }
                });
            } else {
                // For TCP/UDP, directly use their CMD stats
                if (allStats[button.CMD]) {
                    totalMissed = allStats[button.CMD].missed;
                    totalRealTime = allStats[button.CMD].realTime;
                }
            }
            aggregated[button.CMD] = { missed: totalMissed, realTime: totalRealTime };
        });
        return aggregated;
    }, []);

    const fetchInitialStatistics = useCallback(async (id: string) => {
        if (!id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/iots/statistics/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: { deviceId: string } & { [cmd: string]: CmdStats } = await response.json();
            const { deviceId: _, ...cmdLevelStats } = data; // Destructure to get only CMD-level stats
            setCmdStatistics(aggregateButtonStatistics(cmdLevelStats));
        } catch (error) {
            console.error("Error fetching initial statistics:", error);
            message.error("Lỗi khi tải thống kê ban đầu.");
        }
    }, [aggregateButtonStatistics]);

    useEffect(() => {
        if (dataIotsDetail.id) {
            fetchInitialStatistics(dataIotsDetail.id);
        }
    }, [dataIotsDetail.id, fetchInitialStatistics]);

    const handleSocketEventStatistics = useCallback((eventData: Record<string, Record<string, CmdStats>>) => {
        // Ensure deviceId from socket event matches the current device
        if (dataIotsDetail.id === (eventData as any).deviceId) {
            // The eventData directly contains CMD-level stats, aggregate them
            const { deviceId: _, ...cmdLevelStats } = eventData;
            // @ts-ignore
            setCmdStatistics(aggregateButtonStatistics(cmdLevelStats));
        }
    }, [dataIotsDetail.id, aggregateButtonStatistics]);

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
        <div style={{
            maxHeight: '350px',
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            padding: 0
        }}>
            <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: '100%',
            }}>
                {data.map((item: any) => {
                    const isOn = item.modeDigitalInput === 2
                        ? pulseActiveStates[item.CMD]
                        : item.data;

                    const loadingKeyOn = `${item.hexType}-on`;
                    const loadingKeyOff = `${item.hexType}-off`;
                    const isCurrentlyLoading = loading[loadingKeyOn] || loading[loadingKeyOff];
                    // Use item.CMD directly to access aggregated statistics
                    const currentCmdStats = cmdStatistics[item.CMD] || { missed: 0, realTime: 0 };

                    const isPulseMode = item.statusReportCMDs !== undefined && globalModeDigitalInput === 2;

                    // --- Logic màu sắc ĐƠN GIẢN HÓA và đồng bộ cho TẤT CẢ các card và button ---

                    let buttonBackgroundColor = '#d8b4fe'; // Màu nút khi OFF (tím nhạt)
                    let buttonShadowColor = 'rgba(216, 180, 254, 0.3)'; // Shadow khi OFF

                    if (isConnected) {
                        if (isOn) {
                            buttonBackgroundColor = '#34d399';
                            buttonShadowColor = 'rgba(52, 211, 153, 0.3)';
                        } else {
                            buttonBackgroundColor = '#f472b6'; // Màu hồng
                            buttonShadowColor = 'rgba(244, 114, 182, 0.3)';
                        }
                    } else {
                        buttonBackgroundColor = '#f472b6'; // Hồng nhạt
                        buttonShadowColor = 'rgba(244, 114, 182, 0.3)';
                    }
                    // --- Kết thúc Logic màu sắc ĐƠN GIẢN HÓA ---

                    const cardStyle = {
                        width: '130px',
                        height: '130px',
                        textAlign: 'center' as const,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        justifyContent: 'space-between',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease-in-out',
                        opacity: isConnected ? 1 : 0.7,
                        cursor: isConnected ? 'pointer' : 'not-allowed',
                        boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                        borderWidth: '1px',
                        // borderColor: cardBorderColor, // Removed as it was affecting the aesthetic in tests
                        // backgroundColor: cardBackgroundColor, // Removed as it was affecting the aesthetic in tests
                    };

                    const buttonStyle = {
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: '18px',
                        transition: "background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                        backgroundColor: buttonBackgroundColor,
                        borderColor: buttonBackgroundColor, // Border cùng màu background
                        color: "white",
                        boxShadow: `0 4px 12px ${buttonShadowColor}`,
                    };

                    return (
                        <Card
                            key={item.CMD}
                            hoverable={isConnected}
                            style={cardStyle}
                            bodyStyle={{ padding: '8px', height: '100%', display: 'flex', flexDirection: 'column' }}
                        >
                            {/* Header của Card */}
                            <div style={{ marginBottom: '4px' }}>
                                <Title level={5} style={{
                                    margin: 0,
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#334155',
                                    lineHeight: '1.2'
                                }}>
                                    {titleButton[item.dataName] || item.dataName}
                                </Title>

                                <Divider style={{ margin: '4px 0' }} />
                            </div>

                            {/* Nhãn chế độ và giá trị hiển thị chỉ cho Input Channels */}
                            {item.statusReportCMDs && (item.currentActiveModeLabel || item.displayValue !== null) && (
                                <Text style={{
                                    fontSize: '10px',
                                    color: isPulseMode ? '#8b5cf6' : '#6b7280',
                                    fontWeight: '500',
                                    display: 'block',
                                    position: `absolute`,
                                    top: `28px`,
                                    textAlign: `center`,
                                    width: 'calc(100% - 16px)'
                                }}>
                                    {item.modeDigitalInput === 2 && item.displayValue !== null
                                        ? `${item.displayValue.toPrecision(3)} Hz`
                                        : item.currentActiveModeLabel}
                                </Text>
                            )}

                            {/* Nút điều khiển */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Button
                                    type="primary"
                                    size="small"
                                    loading={isCurrentlyLoading}
                                    onClick={() => handleCommand(item)}
                                    disabled={!isConnected || isCurrentlyLoading}
                                    style={buttonStyle}
                                >
                                    {isCurrentlyLoading ? <Spin size="small" /> : <PoweroffOutlined />}
                                </Button>
                            </div>

                            {/* Thống kê */}
                            <div style={{
                                marginTop: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Tooltip title={`Real-time messages: ${currentCmdStats.realTime}`}>
                                    <Text style={{
                                        fontSize: '10px',
                                        color: '#34d399',
                                        fontWeight: 'bold',
                                        minWidth: '35px'
                                    }}>
                                        RT: {formatCount(currentCmdStats.realTime)}
                                    </Text>
                                </Tooltip>
                                <Tooltip title={`Missed messages: ${currentCmdStats.missed}`}>
                                    <Text style={{
                                        fontSize: '10px',
                                        color: '#f87171',
                                        fontWeight: 'bold',
                                        minWidth: '35px'
                                    }}>
                                        MS: {formatCount(currentCmdStats.missed)}
                                    </Text>
                                </Tooltip>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ViewButton;