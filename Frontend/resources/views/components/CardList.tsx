import { useState } from "react";
import { Card, InputNumber, Row, Col, Slider, Button, Modal, Flex, Space } from "antd";
import { TbPlugConnectedX, TbPlugConnected } from "react-icons/tb";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import { MdSettings } from "react-icons/md";
import ViewButton from "./iot_visualization/ViewButton";
import ViewChart from "./iot_visualization/ViewChart";
import ViewTable from "./iot_visualization/ViewTable";
import ViewCount from "./iot_visualization/ViewCount";

interface DataIotsProps {
    dataIots: any[];
}

const HEX_COMMANDS = {
    output1: {
        on: '03 01 07 01 EC',
        off: '03 01 07 00 EB'
    },
    output2: {
        on: '04 01 07 01 8E',
        off: '04 01 07 00 89'
    },
    output3: {
        on: '05 01 07 01 98',
        off: '05 01 07 00 9F'
    },
    output4: {
        on: '06 01 07 01 A2',
        off: '06 01 07 00 A5'
    },
    tcp: {
        on: '15 01 00 00 93',
        off: '16 01 00 00 A9'
    },
    udp: {
        on: '17 01 00 00 BF',
        off: '18 01 00 00 6D'
    }
} as const;

const CardList: React.FC<DataIotsProps> = ({ dataIots }) => {
    const [cardCount, setCardCount] = useState<number>(5);
    const [colsPerRow, setColsPerRow] = useState<number>(2);
    const [titleFontSize, setTitleFontSize] = useState<number>(16);
    const [contentFontSize, setContentFontSize] = useState<number>(14);
    const [maxHeightSettings, setMaxHeightSettings] = useState<number>(370);
    const [minHeightSettings, setMinHeightSettings] = useState<number>(260);
    const [isSettingMode, setIsSettingMode] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [controlModalVisible, setControlModalVisible] = useState<boolean>(false);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);
    const [loading, setLoading] = useState<{[key: string]: boolean}>({});

    const handleOk = () => {
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const sendDeviceCommand = async (mac: string, hexCommand: string): Promise<any> => {
        try {
            const response = await fetch('http://localhost:3335/api/iots/server-publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mac: mac,
                    hex: hexCommand
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert("Cập nhật thành công");
        } catch (error) {
            console.error('Error sending command:', error);
            throw error;
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const openControlModal = (device: any) => {
        setSelectedDevice(device);
        setControlModalVisible(true);
    };

    const closeControlModal = () => {
        setControlModalVisible(false);
        setSelectedDevice(null);
    };

    const handleCommand = async (deviceMac: string, type: keyof typeof HEX_COMMANDS, isOn: boolean) => {
        const loadingKey = `${deviceMac}-${type}-${isOn ? 'on' : 'off'}`;

        try {
            // Set loading state
            setLoading(prev => ({ ...prev, [loadingKey]: true }));

            // Get hex command based on type and value
            const hexCommand = HEX_COMMANDS[type]?.[isOn ? 'on' : 'off'];

            if (!hexCommand) {
                console.error(`No hex command found for type: ${type}`);
                return;
            }

            console.log(`Điều khiển ${type} của thiết bị ${deviceMac}: ${isOn ? 'BẬT' : 'TẮT'}`);
            console.log(`Hex command: ${hexCommand}`);

            // Send API request
            await sendDeviceCommand(deviceMac, hexCommand);

        } catch (error) {
            console.error('Error in handleCommand:', error);
            alert(`Lỗi khi điều khiển thiết bị: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // Clear loading state
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    const renderControlRow = (label: string, type: keyof typeof HEX_COMMANDS, deviceMac: string) => {
        const onLoadingKey = `${deviceMac}-${type}-on`;
        const offLoadingKey = `${deviceMac}-${type}-off`;
        const isOnLoading = loading[onLoadingKey] || false;
        const isOffLoading = loading[offLoadingKey] || false;

        return (
            <div key={type} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <span style={{ fontWeight: 'bold', minWidth: '100px' }}>{label}:</span>
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        loading={isOnLoading}
                        disabled={isOnLoading || isOffLoading}
                        onClick={() => handleCommand(deviceMac, type, true)}
                        style={{
                            backgroundColor: '#52c41a',
                            borderColor: '#52c41a',
                        }}
                    >
                        BẬT
                    </Button>
                    <Button
                        type="primary"
                        size="small"
                        danger
                        loading={isOffLoading}
                        disabled={isOnLoading || isOffLoading}
                        onClick={() => handleCommand(deviceMac, type, false)}
                    >
                        TẮT
                    </Button>
                </Space>
            </div>
        );
    };

    return (
        <div
            style={{
                padding: 20,
                transition: "transform 0.3s",
                transform: isFullscreen ? "scale(1)" : "scale(1.0)",
                height: isFullscreen ? "100vh" : "auto",
                overflow: isFullscreen ? "hidden" : "auto",
            }}
        >
            {!isFullscreen && (
                <>
                    <Button
                        type="primary"
                        onClick={() => setIsModalVisible(true)}
                        style={{ marginBottom: 20 }}
                    >
                        Mở Cài Đặt
                    </Button>
                    <Button
                        type="default"
                        onClick={() => setIsSettingMode(!isSettingMode)}
                        style={{ marginBottom: 20, marginLeft: 10 }}
                    >
                        {isSettingMode ? "Chuyển sang Hiển Thị" : "Chuyển sang Cài Đặt"}
                    </Button>
                    <Button
                        type="default"
                        onClick={toggleFullscreen}
                        style={{ marginBottom: 20, marginLeft: 10 }}
                    >
                        {isFullscreen ? "Thoát Phóng to" : "Phóng to Màn hình"}
                    </Button>
                </>
            )}

            {/* Modal Cài Đặt */}
            <Modal
                title="Cài Đặt"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width={400}
            >
                <div style={{ marginBottom: 10 }}>
                    <label>Số lượng Card:</label>
                    <InputNumber
                        min={1}
                        max={20}
                        value={cardCount}
                        onChange={(value) => setCardCount(value ?? 1)}
                        style={{ marginLeft: 10, width: 100 }}
                    />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Số card trên 1 dòng:</label>
                    <Slider
                        min={1}
                        max={6}
                        value={colsPerRow}
                        onChange={setColsPerRow}
                        style={{ width: 200, marginLeft: 10 }}
                    />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Font Size Title:</label>
                    <Slider
                        min={10}
                        max={24}
                        value={titleFontSize}
                        onChange={setTitleFontSize}
                        style={{ width: 200, marginLeft: 10 }}
                    />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Font Size Nội Dung:</label>
                    <Slider
                        min={10}
                        max={24}
                        value={contentFontSize}
                        onChange={setContentFontSize}
                        style={{ width: 200, marginLeft: 10 }}
                    />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Độ Dài Max Của Thẻ:</label>
                    <Slider
                        min={0}
                        max={600}
                        value={maxHeightSettings}
                        onChange={setMaxHeightSettings}
                        style={{ width: 200, marginLeft: 10 }}
                    />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Độ Dài Min Của Thẻ:</label>
                    <Slider
                        min={0}
                        max={600}
                        value={minHeightSettings}
                        onChange={setMinHeightSettings}
                        style={{ width: 200, marginLeft: 10 }}
                    />
                </div>
            </Modal>

            {/* Modal Điều Khiển */}
            <Modal
                title={`Điều khiển thiết bị: ${selectedDevice?.name || ''}`}
                open={controlModalVisible}
                onCancel={closeControlModal}
                footer={[
                    <Button key="close" onClick={closeControlModal}>
                        Đóng
                    </Button>
                ]}
                width={400}
            >
                {selectedDevice && (
                    <div style={{ padding: '10px 0' }}>
                        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                            <strong>MAC: {selectedDevice.mac}</strong>
                        </div>

                        {renderControlRow('Output 1', 'output1', selectedDevice.mac)}
                        {renderControlRow('Output 2', 'output2', selectedDevice.mac)}
                        {renderControlRow('Output 3', 'output3', selectedDevice.mac)}
                        {renderControlRow('Output 4', 'output4', selectedDevice.mac)}
                        {renderControlRow('TCP', 'tcp', selectedDevice.mac)}
                        {renderControlRow('UDP', 'udp', selectedDevice.mac)}
                    </div>
                )}
            </Modal>

            <Row gutter={[16, 16]} justify="center" align="middle">
                {dataIots && dataIots.length > 0 && dataIots.slice(0, cardCount).map((item: any, index: number) => (
                    <Col key={item.id || index} span={Math.max(1, Math.floor(24 / colsPerRow))}>
                        <Card
                            bordered={true}
                            style={{
                                border: `1px ${isSettingMode ? "dashed" : "solid"} #d9d9d9`,
                                height: "100%",
                                background: !item.connected ? "#cccccc" : "white",
                            }}
                            title={
                                <div
                                    style={{
                                        fontSize: `${titleFontSize}px`,
                                        textAlign: 'center',
                                    }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{item.name}</div>
                                    <Flex wrap="wrap" justify="center" gap="middle">
                                        <Button
                                            shape="circle"
                                            size="large"
                                            icon={item.connected ? <TbPlugConnected /> : <TbPlugConnectedX />}
                                            style={{
                                                backgroundColor: item.connected ? '#52c41a' : '#ff4d4f',
                                                borderColor: item.connected ? '#52c41a' : '#ff4d4f',
                                                color: 'white',
                                            }}
                                        />
                                        <Button
                                            shape="circle"
                                            size="large"
                                            icon={<LuFileInput />}
                                            style={{
                                                backgroundColor: item.input ? '#fadb14' : '#f0f0f0',
                                                borderColor: '#d9d9d9',
                                                color: 'black',
                                            }}
                                        />
                                        <Button
                                            shape="circle"
                                            size="large"
                                            icon={<LuFileOutput />}
                                            style={{
                                                backgroundColor: item.output ? '#fadb14' : '#f0f0f0',
                                                borderColor: '#d9d9d9',
                                                color: 'black',
                                            }}
                                        />
                                        <Button
                                            shape="circle"
                                            size="large"
                                            icon={<MdSettings />}
                                            onClick={() => openControlModal(item)}
                                            style={{
                                                backgroundColor: '#1890ff',
                                                borderColor: '#1890ff',
                                                color: 'white',
                                            }}
                                            title="Điều khiển thiết bị"
                                        />
                                    </Flex>
                                    <div style={{ marginTop: 8, color: '#888' }}>{item.mac}</div>
                                </div>
                            }
                        >
                            <div style={{
                                padding: "20px",
                                textAlign: "left",
                                height: "350px",
                                overflowX: "auto"
                            }}>
                                {item.type ? (
                                    item.type === 1 ? (
                                        <ViewButton dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                                    ) : item.type === 2 ? (
                                        <ViewTable dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                                    ) : item.type === 3 ? (
                                        <ViewChart dataIotsDetail={item} settings={false} />
                                    ) : (
                                        <ViewCount dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                                    )
                                ) : null}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default CardList;