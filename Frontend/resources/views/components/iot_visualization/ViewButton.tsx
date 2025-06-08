import React, { useEffect, useState } from "react";
import { Button, Card, Typography, Flex, Divider } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface ConfigIotsProps {
    dataIotsDetail: any;
    dataOnEvent: any; // This prop is not used in the current component, consider removing if truly not needed.
    settings: boolean; // This prop is not used in the current component, consider removing if truly not needed.
}

// Định nghĩa kiểu cho titleButton
const titleButton: { [key: string]: string } = {
    "CMD_INPUT_CHANNEL1": "DIGITAL INPUT 1",
    "CMD_INPUT_CHANNEL2": "DIGITAL INPUT 2",
    "CMD_INPUT_CHANNEL3": "DIGITAL INPUT 3",
    "CMD_INPUT_CHANNEL4": "DIGITAL INPUT 4",
    "CMD_NOTIFY_TCP": "TCP",
    "CMD_NOTIFY_UDP": "UDP"
};

// Định nghĩa các button mặc định (luôn hiển thị)
const defaultButtons = [
    { CMD: "CMD_INPUT_CHANNEL1", dataName: "CMD_INPUT_CHANNEL1", data: false },
    { CMD: "CMD_INPUT_CHANNEL2", dataName: "CMD_INPUT_CHANNEL2", data: false },
    { CMD: "CMD_INPUT_CHANNEL3", dataName: "CMD_INPUT_CHANNEL3", data: false },
    { CMD: "CMD_INPUT_CHANNEL4", dataName: "CMD_INPUT_CHANNEL4", data: false },
    { CMD: "CMD_NOTIFY_TCP", dataName: "CMD_NOTIFY_TCP", data: false },
    { CMD: "CMD_NOTIFY_UDP", dataName: "CMD_NOTIFY_UDP", data: false }
];

const ViewButton: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        try {
            let processedData = [...defaultButtons];

            if (dataIotsDetail.data && Array.isArray(dataIotsDetail.data)) {
                const allowedCMDs = ["CMD_INPUT_CHANNEL1", "CMD_INPUT_CHANNEL2", "CMD_INPUT_CHANNEL3", "CMD_INPUT_CHANNEL4", "CMD_NOTIFY_TCP", "CMD_NOTIFY_UDP"];

                processedData = processedData.map(defaultItem => {
                    const deviceData = dataIotsDetail.data.find((item: any) =>
                        allowedCMDs.includes(item.CMD) && item.CMD === defaultItem.CMD
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
        } catch (error) {
            console.error("Error processing data:", error);
            setData(defaultButtons);
        }
    }, [dataIotsDetail]);

    return (
        <Flex
            wrap="wrap"
            gap="24px" // Increased gap for better spacing between cards
            justify="center"
            align="flex-start" // Align items to the start of the cross axis
            style={{ padding: '20px', height: '350px' }} // Add some padding around the entire flex container
        >
            {data.map((item: any) => (
                <Card
                    key={item.CMD} // Use a unique key like CMD for better performance and stability
                    hoverable // Add a hover effect to cards
                    style={{
                        width: "180px", // Increased card width for more content space
                        minHeight: "120px", // Ensure consistent card height
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between", // Distribute space vertically
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)", // Subtle shadow for depth
                        borderRadius: "8px", // Slightly rounded corners
                    }}
                    bodyStyle={{ padding: '16px' }} // Adjust padding inside the card body
                >
                    <div>
                        <Title level={5} style={{ marginBottom: '8px', fontSize: '16px' }}>
                            {titleButton[item.dataName] || item.dataName}
                        </Title>
                        <Divider style={{ margin: '8px 0' }} /> {/* Compact divider */}
                    </div>
                    <Flex justify="center" align="center" style={{ flexGrow: 1 }}> {/* Center the button and let it grow */}
                        <Button
                            type="primary"
                            danger={!item.data}
                            size="large" // Make the button larger
                            icon={item.data ? <CheckOutlined /> : <CloseOutlined />}
                            style={{
                                backgroundColor: item.data ? "#52c41a" : "#ff4d4f", // Explicit danger color
                                borderColor: item.data ? "#52c41a" : "#ff4d4f",
                                color: "white",
                                width: "60px", // Fixed width for a consistent button size
                                height: "60px", // Fixed height for a consistent button size
                                borderRadius: "50%", // Make the button circular
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.3s ease", // Smooth transition for hover/active states
                            }}
                        />
                    </Flex>
                </Card>
            ))}
        </Flex>
    );
};

export default ViewButton;