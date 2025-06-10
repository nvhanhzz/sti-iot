import React, { useEffect, useState, useCallback } from "react";
import { Button, Card, Typography, Flex, Divider, message } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

// Chỉ giữ lại các HEX_COMMANDS được sử dụng
const HEX_COMMANDS = {
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' },
    input1_control: { on: '03 01 07 01 EC', off: '03 01 07 00 EB' }, // LƯU Ý: Thay bằng lệnh HEX thực tế cho INPUT 1
    input2_control: { on: '04 01 07 01 8E', off: '04 01 07 00 89' }, // LƯU Ý: Thay bằng lệnh HEX thực tế cho INPUT 2
    input3_control: { on: '05 01 07 01 98', off: '05 01 07 00 9F' }, // LƯU Ý: Thay bằng lệnh HEX thực tế cho INPUT 3
    input4_control: { on: '06 01 07 01 A2', off: '06 01 07 00 A5' }, // LƯU Ý: Thay bằng lệnh HEX thực tế cho INPUT 4
} as const;

interface ConfigIotsProps {
    dataIotsDetail: any;
    deviceMac: string;
    onControlSuccess: () => void;
    isConnected: boolean;
}

const titleButton: { [key: string]: string } = {
    "CMD_INPUT_CHANNEL1": "INPUT 1", // Rút gọn tiêu đề
    "CMD_INPUT_CHANNEL2": "INPUT 2",
    "CMD_INPUT_CHANNEL3": "INPUT 3",
    "CMD_INPUT_CHANNEL4": "INPUT 4",
    "CMD_NOTIFY_TCP": "TCP",
    "CMD_NOTIFY_UDP": "UDP"
};

const defaultButtons = [
    { CMD: "CMD_INPUT_CHANNEL1", dataName: "CMD_INPUT_CHANNEL1", data: false, hexType: "input1_control" as keyof typeof HEX_COMMANDS },
    { CMD: "CMD_INPUT_CHANNEL2", dataName: "CMD_INPUT_CHANNEL2", data: false, hexType: "input2_control" as keyof typeof HEX_COMMANDS },
    { CMD: "CMD_INPUT_CHANNEL3", dataName: "CMD_INPUT_CHANNEL3", data: false, hexType: "input3_control" as keyof typeof HEX_COMMANDS },
    { CMD: "CMD_INPUT_CHANNEL4", dataName: "CMD_INPUT_CHANNEL4", data: false, hexType: "input4_control" as keyof typeof HEX_COMMANDS },
    { CMD: "CMD_NOTIFY_TCP", dataName: "CMD_NOTIFY_TCP", data: false, hexType: "tcp" as keyof typeof HEX_COMMANDS },
    { CMD: "CMD_NOTIFY_UDP", dataName: "CMD_NOTIFY_UDP", data: false, hexType: "udp" as keyof typeof HEX_COMMANDS }
];

const ViewButton: React.FC<ConfigIotsProps> = ({ dataIotsDetail, deviceMac, onControlSuccess, isConnected }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<{[key: string]: boolean}>({});

    const sendDeviceCommand = useCallback(async (mac: string, hexCommand: string): Promise<any> => {
        try {
            const response = await fetch('http://localhost:3335/api/iots/server-publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mac: mac, hex: hexCommand })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! status: ${response.status}. Message: ${errorData.message || response.statusText}`);
            }
            onControlSuccess();
            message.success("Gửi yêu cầu thành công"); // Sửa message
        } catch (error) {
            console.error('Error sending command:', error);
            if (error instanceof Error) {
                message.error(`Lỗi khi gửi yêu cầu: ${error.message}`);
            } else {
                message.error("Lỗi khi gửi yêu cầu điều khiển");
            }
            throw error;
        }
    }, []);

    const handleCommand = useCallback(async (item: any) => {
        if (!isConnected) return;
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
            // BỎ DÒNG NÀY: setData(prevData => prevData.map(dItem => dItem.CMD === item.CMD ? { ...dItem, data: newStatus } : dItem));
        } catch (error) {
            // Error handled in sendDeviceCommand
        } finally {
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    }, [sendDeviceCommand, deviceMac]);

    useEffect(() => {
        let processedData = [...defaultButtons];
        if (dataIotsDetail.data && Array.isArray(dataIotsDetail.data)) {
            const relevantCMDs = defaultButtons.map(btn => btn.CMD);
            processedData = processedData.map(defaultItem => {
                const deviceData = dataIotsDetail.data.find((item: any) =>
                    relevantCMDs.includes(item.CMD) && item.CMD === defaultItem.CMD
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
    }, [dataIotsDetail]);

    return (
        <Flex
            wrap="wrap"
            gap="8px" // Giảm khoảng cách giữa các card để vừa 6 nút trên 1 hàng
            justify="space-around" // Căn đều các nút trong hàng
            align="flex-start"
            style={{ padding: '5px', height: '350px', overflowY: 'auto' }} // Giảm padding tổng thể và chiều cao nếu cần
        >
            {data.map((item: any) => {
                const isOn = item.data;
                const loadingKeyOn = `${item.hexType}-on`;
                const loadingKeyOff = `${item.hexType}-off`;
                const isCurrentlyLoading = loading[loadingKeyOn] || loading[loadingKeyOff];

                return (
                    <Card
                        key={item.CMD}
                        hoverable
                        style={{
                            width: "100px", // Giảm chiều rộng card để vừa 6 nút
                            minHeight: "85px", // Giảm chiều cao card
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", // Shadow nhẹ hơn nữa
                            borderRadius: "4px", // Bo tròn ít hơn
                            transition: "all 0.1s ease",
                            borderColor: isOn && isConnected ? '#86efac' : '#fca5a5',
                            borderWidth: '1px',
                        }}
                        bodyStyle={{ padding: '8px' }} // Giảm padding bên trong card
                    >
                        <div>
                            <Title level={5} style={{ marginBottom: '4px', fontSize: '12px', color: '#334155', lineHeight: '1.2' }}>
                                {titleButton[item.dataName] || item.dataName}
                            </Title>
                            <Divider style={{ margin: '4px 0' }} />
                        </div>
                        <Flex justify="center" align="center" style={{ flexGrow: 1 }}>
                            <Button
                                type="primary"
                                size="small" // Giảm kích thước button xuống "small"
                                loading={isCurrentlyLoading}
                                onClick={() => handleCommand(item)}
                                style={{
                                    backgroundColor: isOn && isConnected ? "#52c41a" : "#ff4d4f",
                                    borderColor: isOn && isConnected ? "#52c41a" : "#ff4d4f",
                                    color: "white",
                                    width: "36px", // Chiều rộng cố định nhỏ hơn
                                    height: "36px", // Chiều cao cố định nhỏ hơn
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: '16px', // Kích thước icon nhỏ hơn
                                    boxShadow: `0 1px 6px ${isOn && isConnected ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 77, 79, 0.2)'}`,
                                }}
                            >
                                {isOn ? <CheckOutlined /> : <CloseOutlined />}
                            </Button>
                        </Flex>
                    </Card>
                );
            })}
        </Flex>
    );
};

export default ViewButton;