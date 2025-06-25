import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button, Card, Typography, Divider, message, Spin, Tooltip } from "antd";
import { PoweroffOutlined } from "@ant-design/icons";
import { useSocket } from "../../../../context/SocketContext.tsx";
const { Title, Text } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const HEX_COMMANDS = {
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' },
    input1_control: { on: '03 01 07 01 EC', off: '03 01 07 00 EB' },
    input2_control: { on: '04 01 07 01 8E', off: '04 01 07 00 89' },
    input3_control: { on: '05 01 07 01 98', off: '05 01 07 00 9F' },
    input4_control: { on: '06 01 07 01 A2', off: '06 01 07 00 A5' },
} as const;

const INPUT_STATUS_REPORT_CMDS = {
    CMD_INPUT_CHANNEL1: {
        status: 'CMD_PUSH_IO_DI1_STATUS',
        pulse: 'CMD_PUSH_IO_DI1_PULSE',
        button: 'CMD_PUSH_IO_DI1_BUTTON', // Giữ nguyên
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
    dataIotsDetail: any;
    deviceMac: string;
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
        statusReportCMDs: undefined,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_NOTIFY_UDP",
        dataName: "CMD_NOTIFY_UDP",
        data: false,
        hexType: "udp" as keyof typeof HEX_COMMANDS,
        statusReportCMDs: undefined,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    }
];

interface CmdStats {
    missed: number;
    realTime: number;
}
type StatisticsData = { [buttonCmd: string]: CmdStats };

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
    console.log(dataIotsDetail);
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

        // currentDisplayedStatus sẽ là trạng thái hiện tại đang được hiển thị trên UI (từ item.data)
        const currentDisplayedStatus = item.data;
        // newStatus là trạng thái mong muốn sau khi nhấn nút
        const newStatus = !currentDisplayedStatus;

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
                    let isActive = false;
                    let activeModeLabel = '';
                    let displayValue: number | null = null;

                    let desiredReportCmdKey: 'status' | 'pulse' | 'button' | undefined;
                    // Mặc định cho chế độ Button là tìm bản ghi với payload_name "status"
                    // trong các CMD có thể là 'button' (CMD_PUSH_IO_DIx_BUTTON)
                    switch (modeDigitalInput) {
                        case 1: desiredReportCmdKey = 'status'; break;
                        case 2: desiredReportCmdKey = 'pulse'; break;
                        case 3: desiredReportCmdKey = 'button'; break; // Giữ nguyên là 'button' để tìm CMD_PUSH_IO_DIx_BUTTON
                        default: desiredReportCmdKey = undefined;
                    }

                    if (desiredReportCmdKey) {
                        const baseCmd = defaultItem.statusReportCMDs[desiredReportCmdKey];
                        let deviceDataEntry: any;

                        if (modeDigitalInput === 3 && baseCmd) { // Nếu là Button Mode, tìm bản ghi với payload_name: "status"
                            deviceDataEntry = dataIotsDetail.data.find(
                                (item: any) => item.CMD === baseCmd && item.payload_name === 'status'
                            );
                        } else if (baseCmd) { // Các chế độ khác, chỉ cần tìm theo CMD
                            deviceDataEntry = dataIotsDetail.data.find(
                                (item: any) => item.CMD === baseCmd
                            );
                        }

                        if (deviceDataEntry) {
                            switch (desiredReportCmdKey) {
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
                                case 'button': // Khi desiredReportCmdKey là 'button' (modeDigitalInput 3)
                                    // Ở đây, deviceDataEntry đã được tìm với payload_name: 'status'
                                    isActive = Boolean(deviceDataEntry.data);
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

    const aggregateButtonStatistics = useCallback((allStats: Record<string, CmdStats>): StatisticsData => {
        const aggregated: StatisticsData = {};

        defaultButtons.forEach(button => {
            let totalMissed = 0;
            let totalRealTime = 0;

            if (button.statusReportCMDs) {
                Object.values(button.statusReportCMDs).forEach(reportCmd => {
                    // Cần kiểm tra cả payload_name "status" cho chế độ button khi tính thống kê
                    // nếu bạn muốn thống kê riêng cho từng loại payload
                    // Tuy nhiên, hiện tại bạn đang sum all stats for a given button's main CMD
                    // Logic này có vẻ ổn nếu bạn muốn tổng số tin nhắn cho CMD_PUSH_IO_DIx_BUTTON
                    // bất kể payload_name.
                    if (allStats[reportCmd]) {
                        totalMissed += allStats[reportCmd].missed;
                        totalRealTime += allStats[reportCmd].realTime;
                    }
                    // Bổ sung: Nếu bạn muốn thống kê riêng cho CMD_PUSH_IO_DIx_BUTTON với payload_name 'status'
                    // thì logic này cần phức tạp hơn một chút, hiện tại nó đang bỏ qua payload_name trong thống kê.
                    // Với dữ liệu hiện tại, cả 2 bản ghi CMD_PUSH_IO_DI1_BUTTON đều được tính vào thống kê.
                });
            } else {
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
            const { deviceId: _, ...cmdLevelStats } = data;
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
        if (dataIotsDetail.id === (eventData as any).deviceId) {
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
            padding: 1
        }}>
            <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: '100%',
                flexWrap: 'wrap'
            }}>
                {data.map((item: any) => {
                    const isInputChannel = !!item.statusReportCMDs;

                    let isOn: boolean;
                    if (isInputChannel && globalModeDigitalInput === 2) {
                        isOn = pulseActiveStates[item.CMD];
                    } else if (isInputChannel && globalModeDigitalInput === 3) {
                        // Lấy trạng thái ON/OFF từ item.data đã được cập nhật từ bản ghi payload_name: 'status'
                        isOn = item.data;
                    } else {
                        isOn = item.data;
                    }

                    const loadingKeyOn = `${item.hexType}-on`;
                    const loadingKeyOff = `${item.hexType}-off`;
                    const isCurrentlyLoading = loading[loadingKeyOn] || loading[loadingKeyOff];
                    const currentCmdStats = cmdStatistics[item.CMD] || { missed: 0, realTime: 0 };

                    const isPulseMode = isInputChannel && globalModeDigitalInput === 2;
                    const isButtonMode = isInputChannel && globalModeDigitalInput === 3;

                    let buttonBackgroundColor: string;
                    let buttonShadowColor: string;

                    if (isConnected) {
                        if (isOn) {
                            buttonBackgroundColor = '#34d399';
                            buttonShadowColor = 'rgba(52, 211, 153, 0.3)';
                        } else {
                            buttonBackgroundColor = '#f472b6';
                            buttonShadowColor = 'rgba(244, 114, 182, 0.3)';
                        }
                    } else {
                        buttonBackgroundColor = '#cbd5e1';
                        buttonShadowColor = 'rgba(203, 213, 225, 0.3)';
                    }

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
                        borderColor: buttonBackgroundColor,
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

                            {item.statusReportCMDs && (item.currentActiveModeLabel || item.displayValue !== null) && (
                                <Text style={{
                                    fontSize: '10px',
                                    color: isPulseMode ? '#8b5cf6' : (isButtonMode ? '#1e40af' : '#6b7280'),
                                    fontWeight: '500',
                                    display: 'block',
                                    position: `absolute`,
                                    top: `28px`,
                                    textAlign: `center`,
                                    width: 'calc(100% - 16px)'
                                }}>
                                    {isPulseMode && item.displayValue !== null
                                        ? `${item.displayValue.toPrecision(3)} Hz`
                                        : item.currentActiveModeLabel}
                                </Text>
                            )}

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