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
} as const;

interface DeviceDataEntry {
    device_id: number;
    CMD: string;
    CMD_Decriptions: string;
    dataName: string;
    payload_name: string;
    data: boolean | number;
    time: number;
}

interface DigitalInputConfig {
    status: boolean;
    modeDigitalInput: number;
}

interface DataIotsDetail {
    id: number;
    name: string;
    device_id: string;
    mac: string;
    connected: boolean;
    digitalInputConfig?: DigitalInputConfig;
    data?: DeviceDataEntry[];
}

interface ConfigIotsProps {
    dataIotsDetail: DataIotsDetail;
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

interface ButtonState {
    CMD: string;
    dataName: string;
    data: boolean;
    hexType: keyof typeof HEX_COMMANDS;
    statusReportCMDs?: typeof INPUT_STATUS_REPORT_CMDS[keyof typeof INPUT_STATUS_REPORT_CMDS];
    currentActiveModeLabel: string;
    displayValue: number | null;
    modeDigitalInput: number;
}

const initialButtons: ButtonState[] = [
    {
        CMD: "CMD_INPUT_CHANNEL1",
        dataName: "CMD_INPUT_CHANNEL1",
        data: false,
        hexType: "input1_control",
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL1,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_INPUT_CHANNEL2",
        dataName: "CMD_INPUT_CHANNEL2",
        data: false,
        hexType: "input2_control",
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL2,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_INPUT_CHANNEL3",
        dataName: "CMD_INPUT_CHANNEL3",
        data: false,
        hexType: "input3_control",
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL3,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_INPUT_CHANNEL4",
        dataName: "CMD_INPUT_CHANNEL4",
        data: false,
        hexType: "input4_control",
        statusReportCMDs: INPUT_STATUS_REPORT_CMDS.CMD_INPUT_CHANNEL4,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_NOTIFY_TCP",
        dataName: "CMD_NOTIFY_TCP",
        data: false,
        hexType: "tcp",
        statusReportCMDs: undefined,
        currentActiveModeLabel: '',
        displayValue: null,
        modeDigitalInput: 1
    },
    {
        CMD: "CMD_NOTIFY_UDP",
        dataName: "CMD_NOTIFY_UDP",
        data: false,
        hexType: "udp",
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
    console.log("ViewButton rendered with dataIotsDetail:", dataIotsDetail);
    const [data, setData] = useState<ButtonState[]>(initialButtons);
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [cmdStatistics, setCmdStatistics] = useState<StatisticsData>({});
    const [pulseActiveStates, setPulseActiveStates] = useState<{ [cmd: string]: boolean }>({});
    const pulseTimeoutRefs = useRef<{ [cmd: string]: NodeJS.Timeout }>({});
    const socket = useSocket();

    const globalModeDigitalInput = dataIotsDetail.digitalInputConfig?.modeDigitalInput;

    const sendDeviceCommand = useCallback(async (mac: string, hexCommand: string): Promise<any> => {
        try {
            console.log(`Sending command to ${mac}: ${hexCommand}`);
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
            message.success("Gửi yêu cầu điều khiển thành công");
        } catch (error) {
            console.error('Error sending command:', error);
            if (error instanceof Error) {
                message.error(`Lỗi khi gửi yêu cầu: ${error.message}`);
            } else {
                message.error("Lỗi không xác định khi gửi yêu cầu điều khiển");
            }
            throw error;
        }
    }, [onControlSuccess]);

    const handleCommand = useCallback(async (item: ButtonState) => {
        if (!isConnected) {
            message.warning("Thiết bị không kết nối.");
            return;
        }

        const currentDisplayedStatus = item.data;
        const newStatus = !currentDisplayedStatus;
        const hexCommandKey = newStatus ? 'on' : 'off';
        const hexCommand = HEX_COMMANDS[item.hexType]?.[hexCommandKey];

        if (!hexCommand) {
            console.error(`Missing hex command for type: ${item.hexType} or status: ${hexCommandKey}`);
            message.error("Lỗi: Không tìm thấy lệnh điều khiển cho trạng thái này.");
            return;
        }

        const loadingKey = `${item.hexType}-${hexCommandKey}`;

        try {
            setLoading(prev => ({ ...prev, [loadingKey]: true }));
            await sendDeviceCommand(deviceMac, hexCommand);
        } catch (error) {
            // Lỗi đã được xử lý trong sendDeviceCommand
        } finally {
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    }, [sendDeviceCommand, deviceMac, isConnected]);

    // Effect để xử lý dữ liệu từ dataIotsDetail và cập nhật trạng thái các nút
    useEffect(() => {
        console.log("ViewButton useEffect: dataIotsDetail or globalModeDigitalInput changed. Updating button states.");

        const currentDeviceData = dataIotsDetail.data || [];

        setData(prevData => {
            const updatedData = prevData.map(currentItemState => {
                let newItemState = { ...currentItemState };

                // Xác định mode hiện tại của input này (ưu tiên global, nếu không thì dùng của item)
                const mode = globalModeDigitalInput !== undefined ? globalModeDigitalInput : currentItemState.modeDigitalInput;
                newItemState.modeDigitalInput = mode;

                // Xử lý cho các kênh đầu vào (INPUT 1-4)
                if (newItemState.statusReportCMDs) {
                    let desiredReportCmdKey: 'status' | 'pulse' | 'button' | undefined;
                    let tempActiveModeLabel = '';

                    switch (mode) {
                        case 1: desiredReportCmdKey = 'status'; tempActiveModeLabel = 'Status Mode'; break;
                        case 2: desiredReportCmdKey = 'pulse'; tempActiveModeLabel = 'Pulse Mode'; break;
                        case 3: desiredReportCmdKey = 'button'; tempActiveModeLabel = 'Button Mode'; break;
                        default: desiredReportCmdKey = undefined; tempActiveModeLabel = ''; break;
                    }
                    newItemState.currentActiveModeLabel = tempActiveModeLabel;

                    if (desiredReportCmdKey) {
                        const baseCmd = newItemState.statusReportCMDs[desiredReportCmdKey];
                        let deviceDataEntry: DeviceDataEntry | undefined;

                        // Tìm bản ghi dữ liệu mới từ props
                        if (mode === 3 && baseCmd) { // Button Mode: tìm payload_name "status"
                            deviceDataEntry = currentDeviceData.find(
                                (item: DeviceDataEntry) => item.CMD === baseCmd && item.payload_name === 'status'
                            );
                        } else if (baseCmd) { // Các mode khác: chỉ cần tìm theo CMD
                            deviceDataEntry = currentDeviceData.find(
                                (item: DeviceDataEntry) => item.CMD === baseCmd
                            );
                        }

                        if (mode === 3) { // TRƯỜNG HỢP ĐẶC BIỆT: BUTTON MODE (GIỮ DATA CŨ NẾU KHÔNG CÓ TRONG PROPS)
                            if (deviceDataEntry) {
                                newItemState.data = Boolean(deviceDataEntry.data);
                            }
                            // Nếu không có deviceDataEntry, newItemState.data sẽ giữ giá trị cũ từ currentItemState.data
                            newItemState.displayValue = null;

                        } else { // CÁC TRƯỜNG HỢP CÒN LẠI: STATUS, PULSE (REPLACE DỰA VÀO PROPS)
                            if (deviceDataEntry) {
                                // Nếu có dữ liệu mới, cập nhật hoàn toàn
                                if (mode === 1) { // Status Mode
                                    newItemState.data = Boolean(deviceDataEntry.data);
                                    newItemState.displayValue = null;
                                } else if (mode === 2) { // Pulse Mode
                                    const newPulseValue = typeof deviceDataEntry.data === 'number' ? deviceDataEntry.data : null;
                                    newItemState.displayValue = newPulseValue;
                                    newItemState.data = false; // Mặc định OFF cho màu nền trong Pulse Mode (cho đến khi nhấp nháy)

                                    // **QUAN TRỌNG:** Kích hoạt hiệu ứng nhấp nháy chỉ khi có dữ liệu pulse mới và giá trị hợp lệ
                                    // Bật nháy nếu giá trị Hz mới khác NULL, nếu nó là NULL thì không nháy
                                    if (newPulseValue !== null && newPulseValue !== 0) { // Thêm điều kiện newPulseValue !== 0
                                        setPulseActiveStates(prev => {
                                            // Xóa timeout cũ của kênh này để tránh nhấp nháy chồng chéo
                                            if (pulseTimeoutRefs.current[newItemState.CMD]) {
                                                clearTimeout(pulseTimeoutRefs.current[newItemState.CMD]);
                                            }
                                            // Thiết lập timeout mới để tắt hiệu ứng nhấp nháy sau 500ms
                                            pulseTimeoutRefs.current[newItemState.CMD] = setTimeout(() => {
                                                setPulseActiveStates(p => ({ ...p, [newItemState.CMD]: false }));
                                            }, 500);
                                            // Bật trạng thái nháy cho kênh hiện tại
                                            return { ...prev, [newItemState.CMD]: true };
                                        });
                                    } else {
                                        // Nếu newPulseValue là null hoặc 0, nghĩa là không còn pulse đến cho kênh này.
                                        // Đảm bảo tắt hiệu ứng nhấp nháy và clear timeout.
                                        setPulseActiveStates(prev => ({ ...prev, [newItemState.CMD]: false }));
                                        if (pulseTimeoutRefs.current[newItemState.CMD]) {
                                            clearTimeout(pulseTimeoutRefs.current[newItemState.CMD]);
                                            delete pulseTimeoutRefs.current[newItemState.CMD]; // Xóa reference
                                        }
                                    }
                                }
                            } else {
                                // Nếu KHÔNG có dữ liệu mới trong props cho các mode này, RESET về trạng thái mặc định (replace)
                                newItemState.data = false;
                                newItemState.displayValue = null;
                                // Đảm bảo tắt nhấp nháy nếu là Pulse Mode và không có dữ liệu
                                if (mode === 2) {
                                    setPulseActiveStates(prev => ({ ...prev, [newItemState.CMD]: false }));
                                    if (pulseTimeoutRefs.current[newItemState.CMD]) {
                                        clearTimeout(pulseTimeoutRefs.current[newItemState.CMD]);
                                        delete pulseTimeoutRefs.current[newItemState.CMD];
                                    }
                                }
                            }
                        }
                    } else { // Nếu desiredReportCmdKey không tồn tại (mode không xác định), reset về mặc định
                        newItemState.data = false;
                        newItemState.displayValue = null;
                        newItemState.currentActiveModeLabel = '';
                        // Đảm bảo tắt nhấp nháy nếu là Pulse Mode
                        if (currentItemState.modeDigitalInput === 2) {
                            setPulseActiveStates(prev => ({ ...prev, [newItemState.CMD]: false }));
                            if (pulseTimeoutRefs.current[newItemState.CMD]) {
                                clearTimeout(pulseTimeoutRefs.current[newItemState.CMD]);
                                delete pulseTimeoutRefs.current[newItemState.CMD];
                            }
                        }
                    }

                } else { // Xử lý cho TCP/UDP (luôn replace)
                    const deviceData = currentDeviceData.find((item: DeviceDataEntry) =>
                        newItemState.CMD === item.CMD
                    );
                    if (deviceData) {
                        newItemState.data = Boolean(deviceData.data);
                    } else {
                        // Nếu không có trong props, reset về false
                        newItemState.data = false;
                    }
                    newItemState.displayValue = null;
                    newItemState.currentActiveModeLabel = '';
                }
                return newItemState;
            });
            return updatedData; // Trả về mảng mới để cập nhật state
        });

        // Cleanup function cho timeouts khi component unmount hoặc dependencies thay đổi
        return () => {
            Object.values(pulseTimeoutRefs.current).forEach(clearTimeout);
            pulseTimeoutRefs.current = {};
        };
    }, [dataIotsDetail, globalModeDigitalInput]);

    const aggregateButtonStatistics = useCallback((allStats: Record<string, CmdStats>): StatisticsData => {
        const aggregated: StatisticsData = {};
        initialButtons.forEach(button => {
            let totalMissed = 0;
            let totalRealTime = 0;
            if (button.statusReportCMDs) {
                Object.values(button.statusReportCMDs).forEach(reportCmd => {
                    if (allStats[reportCmd]) {
                        totalMissed += allStats[reportCmd].missed;
                        totalRealTime += allStats[reportCmd].realTime;
                    }
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

    const fetchInitialStatistics = useCallback(async (id: number) => {
        if (!id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/iots/statistics/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: { deviceId: number } & { [cmd: string]: CmdStats } = await response.json();
            const { deviceId: _, ...cmdLevelStats } = data;
            setCmdStatistics(aggregateButtonStatistics(cmdLevelStats));
        } catch (error) {
            console.error("Lỗi khi tải thống kê ban đầu:", error);
            message.error("Lỗi khi tải thống kê ban đầu.");
        }
    }, [aggregateButtonStatistics]);

    useEffect(() => {
        if (dataIotsDetail.id) {
            fetchInitialStatistics(dataIotsDetail.id);
        }
    }, [dataIotsDetail.id, fetchInitialStatistics]);

    const handleSocketEventStatistics = useCallback((eventData: { deviceId: number } & Record<string, CmdStats>) => {
        if (dataIotsDetail.id === eventData.deviceId) {
            const { deviceId: _, ...cmdLevelStats } = eventData;
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
                {data.map((item: ButtonState) => {
                    const isInputChannel = !!item.statusReportCMDs;

                    // Xác định trạng thái ON/OFF của nút để quyết định màu sắc và hiệu ứng
                    let isOn: boolean;
                    if (isInputChannel && item.modeDigitalInput === 2) {
                        // Trong Pulse Mode, 'isOn' được điều khiển bởi trạng thái nhấp nháy
                        isOn = pulseActiveStates[item.CMD] || false;
                    } else if (isInputChannel && item.modeDigitalInput === 3) {
                        // Trong Button Mode, 'isOn' là trạng thái thực của nút (true/false)
                        isOn = item.data;
                    } else {
                        // Các mode khác (Status, TCP, UDP) cũng dùng trạng thái thực
                        isOn = item.data;
                    }

                    const loadingKeyOn = `${item.hexType}-on`;
                    const loadingKeyOff = `${item.hexType}-off`;
                    const isCurrentlyLoading = loading[loadingKeyOn] || loading[loadingKeyOff];
                    const currentCmdStats = cmdStatistics[item.CMD] || { missed: 0, realTime: 0 };

                    const isPulseMode = isInputChannel && item.modeDigitalInput === 2;
                    // isButtonMode không còn cần để quyết định màu nền riêng

                    let buttonBackgroundColor: string;
                    let buttonShadowColor: string;

                    // Logic màu sắc chỉ dựa vào 'isConnected' và 'isOn' (không phân biệt mode)
                    if (isConnected) {
                        if (isOn) {
                            buttonBackgroundColor = '#34d399'; // Xanh lá cây khi ON
                            buttonShadowColor = 'rgba(52, 211, 153, 0.3)';
                        } else {
                            buttonBackgroundColor = '#f472b6'; // Hồng khi OFF
                            buttonShadowColor = 'rgba(244, 114, 182, 0.3)';
                        }
                    } else {
                        buttonBackgroundColor = '#cbd5e1'; // Xám khi không kết nối
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

                            {/* Chỉ hiển thị giá trị Hz nếu là Pulse Mode VÀ đang trong trạng thái nhấp nháy (isOn=true)
                                VÀ giá trị displayValue không phải là 0 hoặc null */}
                            {isPulseMode && isOn && item.displayValue !== null && item.displayValue !== 0 && (
                                <Text style={{
                                    fontSize: '10px',
                                    color: '#8b5cf6', // Luôn màu tím cho Hz
                                    fontWeight: '500',
                                    display: 'block',
                                    position: `absolute`,
                                    top: `28px`,
                                    textAlign: `center`,
                                    width: 'calc(100% - 16px)'
                                }}>
                                    {`${item.displayValue.toFixed(2)} Hz`}
                                </Text>
                            )}
                            {/* Nếu là Pulse Mode, đang không nháy, và displayValue là 0, thì hiển thị '0 Hz' cố định (nếu muốn) */}
                            {isPulseMode && !isOn && item.displayValue === 0 && (
                                <Text style={{
                                    fontSize: '10px',
                                    color: '#6b7280', // Màu xám hoặc màu khác cho 0 Hz cố định
                                    fontWeight: '500',
                                    display: 'block',
                                    position: `absolute`,
                                    top: `28px`,
                                    textAlign: `center`,
                                    width: 'calc(100% - 16px)'
                                }}>
                                    0.00 Hz
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
                                <Tooltip title={`Số tin nhắn thực nhận: ${currentCmdStats.realTime}`}>
                                    <Text style={{
                                        fontSize: '10px',
                                        color: '#34d399',
                                        fontWeight: 'bold',
                                        minWidth: '35px'
                                    }}>
                                        RT: {formatCount(currentCmdStats.realTime)}
                                    </Text>
                                </Tooltip>
                                <Tooltip title={`Số tin nhắn bị bỏ lỡ: ${currentCmdStats.missed}`}>
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