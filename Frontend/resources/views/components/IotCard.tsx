// src/resources/views/components/IotCard.tsx
import React, { useState, useCallback, memo } from "react";
import { Card, Col, Button, Modal, Flex, Space, Form, Radio, message } from "antd";
import { TbPlugConnectedX, TbPlugConnected } from "react-icons/tb";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import { MdSettings } from "react-icons/md";
import { GrConfigure } from "react-icons/gr";
import ViewButton from "./iot_visualization/ViewButton";
import ViewChart from "./iot_visualization/ViewChart";
import ViewTable from "./iot_visualization/ViewTable";
import IotService from "../../../services/IotService.ts"; // Đảm bảo đường dẫn đúng

// Định nghĩa lại HEX_COMMANDS nếu nó không được import từ nơi khác
const HEX_COMMANDS = {
    output1: { on: '03 01 07 01 EC', off: '03 01 07 00 EB' },
    output2: { on: '04 01 07 01 8E', off: '04 01 07 00 89' },
    output3: { on: '05 01 07 01 98', off: '05 01 07 00 9F' },
    output4: { on: '06 01 07 01 A2', off: '06 01 07 00 A5' },
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' }
} as const;

interface IotCardProps {
    item: any; // Dữ liệu của một thiết bị IoT
    colsPerRow: number;
    titleFontSize: number;
    contentFontSize: number;
    maxHeightSettings: number;
    minHeightSettings: number;
    isSettingMode: boolean;
    onUpdateDeviceType: (deviceId: number, newType: number) => void; // Callback từ CardList
    // Thêm các props khác nếu cần
}

const IotCard: React.FC<IotCardProps> = memo(({
                                                  item,
                                                  colsPerRow,
                                                  titleFontSize,
                                                  contentFontSize,
                                                  maxHeightSettings,
                                                  minHeightSettings,
                                                  isSettingMode,
                                                  onUpdateDeviceType,
                                              }) => {
    // Trong IotCard component, thêm vào đầu component
    // Di chuyển các state và hàm liên quan đến từng card vào đây
    const [loading, setLoading] = useState<{[key: string]: boolean}>({});
    const [displayModalVisible, setDisplayModalVisible] = useState<boolean>(false);
    const [controlModalVisible, setControlModalVisible] = useState<boolean>(false);
    const [displayForm] = Form.useForm();

    const sendDeviceCommand = useCallback(async (mac: string, hexCommand: string): Promise<any> => {
        try {
            const response = await fetch('http://localhost:3335/api/iots/server-publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mac: mac, hex: hexCommand })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            message.success("Cập nhật thành công");
        } catch (error) {
            console.error('Error sending command:', error);
            message.error("Lỗi khi gửi lệnh điều khiển");
            throw error;
        }
    }, []);

    const openControlModal = useCallback(() => {
        setControlModalVisible(true);
    }, []);

    const closeControlModal = useCallback(() => {
        setControlModalVisible(false);
    }, []);

    const openDisplayModal = useCallback(() => {
        displayForm.setFieldsValue({ type: item.type || 1 });
        setDisplayModalVisible(true);
    }, [item.type, displayForm]);

    const closeDisplayModal = useCallback(() => {
        setDisplayModalVisible(false);
        displayForm.resetFields();
    }, [displayForm]);

    const handleDisplayTypeUpdate = useCallback(async () => {
        try {
            const values = await displayForm.validateFields();
            const newType = values.type;

            const updateData = { id: item.id, type: newType };
            const response: any = await IotService.PostDataUpdateIots(updateData);
            if (response.status === 200) {
                // API call thành công, gọi callback để cập nhật state ở component cha của CardList
                onUpdateDeviceType(item.id, newType); // <-- Gọi callback
            }

            message.success("Cập nhật kiểu hiển thị thành công");
            closeDisplayModal();
        } catch (error) {
            console.error('Error updating display type:', error);
            message.error("Lỗi khi cập nhật kiểu hiển thị");
        }
    }, [displayForm, item.id, onUpdateDeviceType, closeDisplayModal]); // Thêm onUpdateDeviceType vào dependency

    const handleCommand = useCallback(async (deviceMac: string, type: keyof typeof HEX_COMMANDS, isOn: boolean) => {
        const loadingKey = `${deviceMac}-${type}-${isOn ? 'on' : 'off'}`;
        try {
            setLoading(prev => ({ ...prev, [loadingKey]: true }));
            const hexCommand = HEX_COMMANDS[type]?.[isOn ? 'on' : 'off'];
            if (!hexCommand) { console.error(`No hex command found for type: ${type}`); return; }
            console.log(`Điều khiển ${type} của thiết bị ${deviceMac}: ${isOn ? 'BẬT' : 'TẮT'}`);
            console.log(`Hex command: ${hexCommand}`);
            await sendDeviceCommand(deviceMac, hexCommand);
        } catch (error) {
            console.error('Error in handleCommand:', error);
        } finally {
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    }, [sendDeviceCommand]);

    const renderControlRow = useCallback((label: string, type: keyof typeof HEX_COMMANDS, deviceMac: string) => {
        const onLoadingKey = `${deviceMac}-${type}-on`;
        const offLoadingKey = `${deviceMac}-${type}-off`;
        const isOnLoading = loading[onLoadingKey] || false;
        const isOffLoading = loading[offLoadingKey] || false;

        return (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontWeight: 'bold', minWidth: '100px' }}>{label}:</span>
                <Space>
                    <Button type="primary" size="small" loading={isOnLoading} disabled={isOnLoading || isOffLoading} onClick={() => handleCommand(deviceMac, type, true)} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>BẬT</Button>
                    <Button type="primary" size="small" danger loading={isOffLoading} disabled={isOnLoading || isOffLoading} onClick={() => handleCommand(deviceMac, type, false)}>TẮT</Button>
                </Space>
            </div>
        );
    }, [loading, handleCommand]);

    const getDisplayTypeText = useCallback((type: number) => {
        switch (type) {
            case 1: return 'Nút bấm'; case 2: return 'Bảng dữ liệu'; case 3: return 'Biểu đồ'; default: return 'Không xác định';
        }
    }, []);

    // console.log(`Rendering IotCard for device ID: ${item.id}, Type: ${item.type}`); // Dùng để debug re-render

    return (
        <Col span={Math.max(1, Math.floor(24 / colsPerRow))}>
            <Card
                bordered={true}
                style={{
                    border: `1px ${isSettingMode ? "dashed" : "solid"} #d9d9d9`,
                    height: "100%",
                    background: !item.connected ? "#f5f5f5" : "white",
                    opacity: !item.connected ? 0.7 : 1,
                }}
                title={
                    <div style={{ fontSize: `${titleFontSize}px`, textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{item.name}</div>
                        <Flex wrap="wrap" justify="center" gap="small">
                            <Button shape="circle" size="large" icon={item.connected ? <TbPlugConnected /> : <TbPlugConnectedX />} style={{ backgroundColor: item.connected ? '#52c41a' : '#ff4d4f', borderColor: item.connected ? '#52c41a' : '#ff4d4f', color: 'white' }} title={item.connected ? 'Đã kết nối' : 'Mất kết nối'} />
                            <Button shape="circle" size="large" icon={<LuFileInput />} style={{ backgroundColor: item.input ? '#fadb14' : '#d9d9d9', borderColor: item.input ? '#fadb14' : '#d9d9d9', color: item.input ? '#000' : '#666' }} title={item.input ? 'Input hoạt động' : 'Input không hoạt động'} />
                            <Button shape="circle" size="large" icon={<LuFileOutput />} style={{ backgroundColor: item.output ? '#fadb14' : '#d9d9d9', borderColor: item.output ? '#fadb14' : '#d9d9d9', color: item.output ? '#000' : '#666' }} title={item.output ? 'Output hoạt động' : 'Output không hoạt động'} />
                            <Button shape="circle" size="large" icon={<MdSettings />} onClick={openDisplayModal} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }} title="Điều chỉnh kiểu hiển thị" />
                            <Button shape="circle" size="large" icon={<GrConfigure />} onClick={openControlModal} style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }} title="Điều khiển thiết bị" disabled={!item.connected} />
                        </Flex>
                        <div style={{ marginTop: 8, color: '#888', fontSize: '12px' }}>{item.mac} | {getDisplayTypeText(item.type || 1)}</div>
                    </div>
                }
            >
                <div style={{ padding: "20px", textAlign: "left", height: `${Math.max(minHeightSettings, Math.min(maxHeightSettings, 400))}px`, overflowX: "auto", fontSize: `${contentFontSize}px` }}>
                    {item.type ? (
                        item.type === 1 ? (
                            <ViewButton dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                        ) : item.type === 2 ? (
                            <ViewTable dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                        ) : item.type === 3 ? (
                            <ViewChart dataIotsDetail={item} settings={false} />
                        ) : (
                            <></>
                        )
                    ) : (
                        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Chưa cấu hình kiểu hiển thị</div>
                    )}
                </div>
            </Card>

            {/* Modal Điều Khiển */}
            <Modal
                title={`Điều khiển thiết bị: ${item?.name || ''}`}
                open={controlModalVisible}
                onCancel={closeControlModal}
                footer={[<Button key="close" onClick={closeControlModal}>Đóng</Button>]}
                width={400}
            >
                {item && (
                    <div style={{ padding: '10px 0' }}>
                        <div style={{ marginBottom: '15px', textAlign: 'center' }}><strong>MAC: {item.mac}</strong></div>
                        {renderControlRow('Output 1', 'output1', item.mac)}
                        {renderControlRow('Output 2', 'output2', item.mac)}
                        {renderControlRow('Output 3', 'output3', item.mac)}
                        {renderControlRow('Output 4', 'output4', item.mac)}
                        {renderControlRow('TCP', 'tcp', item.mac)}
                        {renderControlRow('UDP', 'udp', item.mac)}
                    </div>
                )}
            </Modal>

            {/* Modal Điều Chỉnh Kiểu Hiển Thị */}
            <Modal
                title={`Điều chỉnh kiểu hiển thị`}
                open={displayModalVisible}
                onCancel={closeDisplayModal}
                footer={[
                    <Button key="cancel" onClick={closeDisplayModal}>Hủy</Button>,
                    <Button key="submit" type="primary" onClick={handleDisplayTypeUpdate}>Cập nhật</Button>
                ]}
                width={400}
            >
                {item && (
                    <Form form={displayForm} layout="vertical" initialValues={{ type: item.type || 1 }}>
                        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
                            <strong>Thiết bị: {item.name}</strong><br />
                            <span style={{ color: '#888' }}>MAC: {item.mac}</span>
                        </div>
                        <Form.Item label="Kiểu hiển thị" name="type" rules={[{ required: true, message: 'Vui lòng chọn kiểu hiển thị!' }]}>
                            <Radio.Group>
                                <Radio value={1}>Nút bấm</Radio>
                                <Radio value={2}>Bảng dữ liệu</Radio>
                                <Radio value={3}>Biểu đồ</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <div style={{ backgroundColor: '#f6f6f6', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                            <small style={{ color: '#666' }}>Kiểu hiển thị hiện tại: <strong>{getDisplayTypeText(item.type || 1)}</strong></small>
                        </div>
                    </Form>
                )}
            </Modal>
        </Col>
    );
});

export default IotCard;