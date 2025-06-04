import React, { useEffect, useState } from "react";
import { Button, Card, Typography, Flex, Divider } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface ConfigIotsProps {
    dataIotsDetail: any;
    dataOnEvent: any;
    settings: boolean;
}

// Định nghĩa kiểu cho titleButton
const titleButton: { [key: string]: string } = {
    "CMD_INPUT_CHANNEL1": "DIGITAL INPUT 1",
    "CMD_INPUT_CHANNEL2": "DIGITAL INPUT 2",
    "CMD_INPUT_CHANNEL3": "DIGITAL INPUT 3",
    "CMD_INPUT_CHANNEL4": "DIGITAL INPUT 4",
    "CMD_PUSH_TCP": "TCP",
    "CMD_PUSH_UDP": "UDP"
};

// Định nghĩa các button mặc định (luôn hiển thị)
const defaultButtons = [
    { CMD: "CMD_INPUT_CHANNEL1", dataName: "CMD_INPUT_CHANNEL1", data: false },
    { CMD: "CMD_INPUT_CHANNEL2", dataName: "CMD_INPUT_CHANNEL2", data: false },
    { CMD: "CMD_INPUT_CHANNEL3", dataName: "CMD_INPUT_CHANNEL3", data: false },
    { CMD: "CMD_INPUT_CHANNEL4", dataName: "CMD_INPUT_CHANNEL4", data: false },
    { CMD: "CMD_PUSH_TCP", dataName: "CMD_PUSH_TCP", data: false },
    { CMD: "CMD_PUSH_UDP", dataName: "CMD_PUSH_UDP", data: false }
];

const ViewButton: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        try {
            // Bắt đầu với các button mặc định
            let processedData = [...defaultButtons];

            // Nếu có data từ device, cập nhật trạng thái
            if (dataIotsDetail.data && Array.isArray(dataIotsDetail.data)) {
                const allowedCMDs = ["CMD_INPUT_CHANNEL1", "CMD_INPUT_CHANNEL2", "CMD_INPUT_CHANNEL3", "CMD_INPUT_CHANNEL4", "CMD_PUSH_TCP", "CMD_PUSH_UDP"];

                processedData = processedData.map(defaultItem => {
                    // Tìm data tương ứng từ device
                    const deviceData = dataIotsDetail.data.find((item: any) =>
                        allowedCMDs.includes(item.CMD) && item.CMD === defaultItem.CMD
                    );

                    // Nếu tìm thấy data từ device, cập nhật trạng thái
                    if (deviceData) {
                        return {
                            ...defaultItem,
                            data: Boolean(deviceData.data) // Đảm bảo là boolean
                        };
                    }

                    // Nếu không tìm thấy, giữ nguyên trạng thái mặc định (false)
                    return defaultItem;
                });
            }

            setData(processedData);
            console.log("Processed Data:", processedData);
        } catch (error) {
            console.error("Lỗi khi xử lý data:", error);
            // Nếu có lỗi, sử dụng data mặc định
            setData(defaultButtons);
        }
    }, [dataIotsDetail]);

    return (
        <Flex wrap="wrap" gap="large" justify="center">
            {data.map((item: any, index: number) => (
                <Card key={index} style={{ width: "400px", textAlign: "center" }}>
                    <Title level={5}>{titleButton[item.dataName] || item.dataName}</Title>
                    <Divider />
                    <Button
                        type="primary"
                        danger={!item.data}
                        style={{
                            backgroundColor: item.data ? "#52c41a" : undefined,
                            borderColor: item.data ? "#52c41a" : undefined,
                            color: "white",
                        }}
                    >
                        {item.data ? <CheckOutlined /> : <CloseOutlined />}
                    </Button>
                </Card>
            ))}
        </Flex>
    );
};

export default ViewButton;