import { useEffect, useState } from "react";
import { Button, Card, Typography, Space, message, Flex, Input, Divider } from "antd";
import { PlusOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface ConfigIotsProps {
    dataIotsDetail: any;
    dataOnEvent: any;
    settings: boolean;
}

const SettingsButton: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [data, setData] = useState<[]>([]);
    useEffect(() => {
        try {
            if (dataIotsDetail.data) {
                setData(dataIotsDetail.data);
            }
        } catch (error) {
            console.error("Lỗi khi parse JSON:", error);
        }
    }, [dataIotsDetail]);
    return (
        <Flex wrap="wrap" gap="large" justify="center">
            {data.map((item: any, index: any) => (
                <Card key={index} style={{ width: "240px", textAlign: "center" }}>
                    <Title level={5}>{item.dataName}</Title>
                    <Divider />
                    <Button
                        key={`${index}`}
                        type="primary"
                        danger={!item.data}
                        style={{
                            backgroundColor: item.data ? "#52c41a" : undefined,
                            color: item.data ? "white" : undefined,
                        }}
                    >
                        {item.data ? <CheckOutlined /> : <CloseOutlined />}
                    </Button>

                </Card>
            ))}
        </Flex>
    );
};

export default SettingsButton;
