import React, { useState, useCallback, memo } from "react";
import { Card, Col, Button, Modal, Space, Form, Radio, message, Input, Badge, Tooltip, Tabs, Descriptions } from "antd";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import { MdInfo } from "react-icons/md";
import { BiTerminal } from "react-icons/bi";
import { HiOutlineStatusOnline, HiOutlineStatusOffline } from "react-icons/hi";
import { AiOutlineControl, AiOutlineEye } from "react-icons/ai";
import { FiSettings } from "react-icons/fi";
import ViewButton from "./iot_visualization/ViewButton";
import ViewChart from "./iot_visualization/ViewChart";
import ViewTable from "./iot_visualization/ViewTable";
import IotService from "../../../services/IotService.ts";
import ViewCount from "./iot_visualization/ViewCount.tsx";

const { TextArea } = Input;
const { TabPane } = Tabs;

const HEX_COMMANDS = {
    output1: { on: '03 01 07 01 EC', off: '03 01 07 00 EB' },
    output2: { on: '04 01 07 01 8E', off: '04 01 07 00 89' },
    output3: { on: '05 01 07 01 98', off: '05 01 07 00 9F' },
    output4: { on: '06 01 07 01 A2', off: '06 01 07 00 A5' },
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' }
} as const;

interface IotCardProps {
    item: any;
    colsPerRow: number;
    titleFontSize: number;
    contentFontSize: number;
    maxHeightSettings: number;
    minHeightSettings: number;
    isSettingMode: boolean;
    onUpdateDeviceType: (deviceId: number, newType: number) => void;
}

const IotCard: React.FC<IotCardProps> = memo(({
                                                  item,
                                                  colsPerRow,
                                                  titleFontSize,
                                                  contentFontSize,
                                                  maxHeightSettings,
                                                  minHeightSettings,
                                                  onUpdateDeviceType,
                                              }) => {
    const [loading, setLoading] = useState<{[key: string]: boolean}>({});
    const [displayModalVisible, setDisplayModalVisible] = useState<boolean>(false);
    const [controlModalVisible, setControlModalVisible] = useState<boolean>(false);
    const [serialModalVisible, setSerialModalVisible] = useState<boolean>(false);
    const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);
    const [currentSerialType, setCurrentSerialType] = useState<string>('');
    const [serialCommand, setSerialCommand] = useState<string>('');
    const [serialLoading, setSerialLoading] = useState<boolean>(false);
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

    const sendSerialCommand = useCallback(async (mac: string, serialType: string, command: string): Promise<any> => {
        try {
            setSerialLoading(true);
            const response = await fetch('http://localhost:3335/api/iots/serial-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mac: mac,
                    type: serialType.toLowerCase(),
                    command: command
                })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            message.success(`Gửi lệnh ${serialType} thành công`);
            setSerialCommand('');
            setSerialModalVisible(false);
        } catch (error) {
            console.error('Error sending serial command:', error);
            message.error(`Lỗi khi gửi lệnh ${serialType}`);
            throw error;
        } finally {
            setSerialLoading(false);
        }
    }, []);

    const openControlModal = useCallback(() => setControlModalVisible(true), []);
    const closeControlModal = useCallback(() => setControlModalVisible(false), []);
    const openInfoModal = useCallback(() => setInfoModalVisible(true), []);
    const closeInfoModal = useCallback(() => setInfoModalVisible(false), []);

    const openSerialModal = useCallback((serialType: string) => {
        setCurrentSerialType(serialType);
        setSerialCommand('');
        setSerialModalVisible(true);
    }, []);

    const closeSerialModal = useCallback(() => {
        setSerialModalVisible(false);
        setCurrentSerialType('');
        setSerialCommand('');
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
                onUpdateDeviceType(item.id, newType);
            }

            message.success("Cập nhật kiểu hiển thị thành công");
            closeDisplayModal();
        } catch (error) {
            console.error('Error updating display type:', error);
            message.error("Lỗi khi cập nhật kiểu hiển thị");
        }
    }, [displayForm, item.id, onUpdateDeviceType, closeDisplayModal]);

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

    const handleSerialCommand = useCallback(async () => {
        if (!serialCommand.trim()) {
            message.warning('Vui lòng nhập lệnh!');
            return;
        }
        await sendSerialCommand(item.mac, currentSerialType, serialCommand);
    }, [serialCommand, currentSerialType, item.mac, sendSerialCommand]);

    const renderControlRow = useCallback((label: string, type: keyof typeof HEX_COMMANDS, deviceMac: string) => {
        const onLoadingKey = `${deviceMac}-${type}-on`;
        const offLoadingKey = `${deviceMac}-${type}-off`;
        const isOnLoading = loading[onLoadingKey] || false;
        const isOffLoading = loading[offLoadingKey] || false;

        return (
            <div key={type}
                 className="control-row"
                 style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     padding: '16px 20px',
                     marginBottom: '12px',
                     background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                     borderRadius: '12px',
                     border: '1px solid #e2e8f0',
                     transition: 'all 0.3s ease',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                 }}
                 onMouseEnter={(e) => {
                     e.currentTarget.style.transform = 'translateY(-2px)';
                     e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
                 }}
                 onMouseLeave={(e) => {
                     e.currentTarget.style.transform = 'translateY(0)';
                     e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                 }}
            >
                <span style={{
                    fontWeight: '600',
                    minWidth: '120px',
                    color: '#334155',
                    fontSize: '15px'
                }}>
                    {label}
                </span>
                <Space size={8}>
                    <Button
                        type="primary"
                        size="middle"
                        loading={isOnLoading}
                        disabled={isOnLoading || isOffLoading}
                        onClick={() => handleCommand(deviceMac, type, true)}
                        style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderColor: '#10b981',
                            fontWeight: '600',
                            borderRadius: '8px',
                            minWidth: '70px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        BẬT
                    </Button>
                    <Button
                        type="primary"
                        size="middle"
                        danger
                        loading={isOffLoading}
                        disabled={isOnLoading || isOffLoading}
                        onClick={() => handleCommand(deviceMac, type, false)}
                        style={{
                            fontWeight: '600',
                            borderRadius: '8px',
                            minWidth: '70px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            borderColor: '#ef4444',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        TẮT
                    </Button>
                </Space>
            </div>
        );
    }, [loading, handleCommand]);

    const renderSerialRow = useCallback((label: string, serialType: string) => {
        return (
            <div key={serialType}
                 style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     padding: '16px 20px',
                     marginBottom: '12px',
                     background: 'linear-gradient(135deg, #fefcfb 0%, #fef7f0 100%)',
                     borderRadius: '12px',
                     border: '1px solid #fed7aa',
                     transition: 'all 0.3s ease',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                 }}
                 onMouseEnter={(e) => {
                     e.currentTarget.style.transform = 'translateY(-2px)';
                     e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
                 }}
                 onMouseLeave={(e) => {
                     e.currentTarget.style.transform = 'translateY(0)';
                     e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                 }}
            >
                <span style={{
                    fontWeight: '600',
                    minWidth: '140px',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '15px'
                }}>
                    <BiTerminal style={{ marginRight: '8px', fontSize: '18px', color: '#f59e0b' }} />
                    {label}
                </span>
                <Button
                    type="default"
                    size="middle"
                    onClick={() => openSerialModal(serialType)}
                    style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        borderColor: '#f59e0b',
                        color: 'white',
                        fontWeight: '600',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                    }}
                    icon={<BiTerminal />}
                >
                    Mở yêu cầu
                </Button>
            </div>
        );
    }, [openSerialModal]);

    const getDisplayTypeText = useCallback((type: number) => {
        switch (type) {
            case 1: return 'Nút bấm';
            case 2: return 'Bảng dữ liệu';
            case 3: return 'Biểu đồ';
            case 4: return 'Đếm số';
            default: return 'Không xác định';
        }
    }, []);

    const getSerialTypeColor = useCallback((serialType: string) => {
        switch (serialType) {
            case 'SERIAL_RS485': return '#8b5cf6';
            case 'SERIAL_RS232': return '#06b6d4';
            case 'SERIAL_TCP': return '#f59e0b';
            default: return '#3b82f6';
        }
    }, []);

    return (
        <Col span={Math.max(1, Math.floor(24 / colsPerRow))}>
            <Card
                bordered={false}
                style={{
                    height: "100%",
                    background: item.connected
                        ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    opacity: item.connected ? 1 : 0.8,
                    borderRadius: '16px',
                    boxShadow: item.connected
                        ? '0 8px 32px rgba(0, 0, 0, 0.08)'
                        : '0 4px 16px rgba(0, 0, 0, 0.04)',
                    border: `2px solid ${item.connected ? '#e2e8f0' : '#cbd5e1'}`,
                    transition: 'all 0.3s ease',
                    overflow: 'hidden'
                }}
                title={
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <Badge
                                status={item.connected ? 'success' : 'error'}
                                style={{ marginRight: '8px' }}
                            />
                            <span style={{
                                fontSize: `${titleFontSize + 2}px`,
                                fontWeight: '700',
                                color: '#1e293b',
                                letterSpacing: '-0.025em'
                            }}>
                                {item.name}
                            </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '16px',
                            flexWrap: 'wrap'
                        }}>
                            <Tooltip title={item.connected ? 'Thiết bị đang kết nối' : 'Thiết bị mất kết nối'}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    background: item.connected
                                        ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                                        : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                    border: `1px solid ${item.connected ? '#86efac' : '#fca5a5'}`,
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    {item.connected ? <HiOutlineStatusOnline /> : <HiOutlineStatusOffline />}
                                    <span style={{
                                        marginLeft: '4px',
                                        color: item.connected ? '#15803d' : '#dc2626'
                                    }}>
                                        {item.connected ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </Tooltip>

                            <Tooltip title={item.input ? 'Input đang hoạt động' : 'Input không hoạt động'}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    background: item.input
                                        ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                                        : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                    border: `1px solid ${item.input ? '#fbbf24' : '#cbd5e1'}`,
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    <LuFileInput style={{ fontSize: '14px' }} />
                                    <span style={{
                                        marginLeft: '4px',
                                        color: item.input ? '#92400e' : '#64748b'
                                    }}>
                                        Input
                                    </span>
                                </div>
                            </Tooltip>

                            <Tooltip title={item.output ? 'Output đang hoạt động' : 'Output không hoạt động'}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    background: item.output
                                        ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                                        : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                    border: `1px solid ${item.output ? '#fbbf24' : '#cbd5e1'}`,
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    <LuFileOutput style={{ fontSize: '14px' }} />
                                    <span style={{
                                        marginLeft: '4px',
                                        color: item.output ? '#92400e' : '#64748b'
                                    }}>
                                        Output
                                    </span>
                                </div>
                            </Tooltip>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                        }}>
                            <Tooltip title="Xem thông tin thiết bị">
                                <Button
                                    type="default"
                                    size="large"
                                    icon={<MdInfo />}
                                    onClick={openInfoModal}
                                    style={{
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        borderColor: '#3b82f6',
                                        color: 'white',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                        minWidth: '48px',
                                        height: '48px'
                                    }}
                                />
                            </Tooltip>

                            <Tooltip title="Cài đặt hiển thị">
                                <Button
                                    type="default"
                                    size="large"
                                    icon={<FiSettings />}
                                    onClick={openDisplayModal}
                                    disabled={!item.connected}
                                    style={{
                                        borderRadius: '12px',
                                        background: item.connected
                                            ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                            : '#e5e7eb',
                                        borderColor: item.connected ? '#8b5cf6' : '#d1d5db',
                                        color: item.connected ? 'white' : '#9ca3af',
                                        fontWeight: '600',
                                        boxShadow: item.connected
                                            ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                                            : 'none',
                                        minWidth: '48px',
                                        height: '48px'
                                    }}
                                />
                            </Tooltip>

                            <Tooltip title="Điều khiển thiết bị">
                                <Button
                                    type="default"
                                    size="large"
                                    icon={<AiOutlineControl />}
                                    onClick={openControlModal}
                                    disabled={!item.connected}
                                    style={{
                                        borderRadius: '12px',
                                        background: item.connected
                                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                            : '#e5e7eb',
                                        borderColor: item.connected ? '#f59e0b' : '#d1d5db',
                                        color: item.connected ? 'white' : '#9ca3af',
                                        fontWeight: '600',
                                        boxShadow: item.connected
                                            ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                                            : 'none',
                                        minWidth: '48px',
                                        height: '48px'
                                    }}
                                />
                            </Tooltip>
                        </div>

                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: 'rgba(148, 163, 184, 0.1)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#64748b'
                        }}>
                            <div><strong>MAC:</strong> {item.mac}</div>
                            <div><strong>Hiển thị:</strong> {getDisplayTypeText(item.type || 1)}</div>
                        </div>
                    </div>
                }
            >
                <div style={{
                    padding: "20px",
                    textAlign: "left",
                    height: `${Math.max(minHeightSettings, Math.min(maxHeightSettings, 400))}px`,
                    overflowX: "auto",
                    fontSize: `${contentFontSize}px`,
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(226, 232, 240, 0.5)'
                }}>
                    {item.type ? (
                        item.type === 1 ? (
                            <ViewButton dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                        ) : item.type === 2 ? (
                            <ViewTable dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                        ) : item.type === 3 ? (
                            <ViewChart dataIotsDetail={item} settings={false} />
                        ) : item.type === 4 ? (
                            <ViewCount dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                        ) : (
                            <></>
                        )
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            color: '#94a3b8',
                            padding: '40px 20px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '8px',
                            border: '2px dashed #cbd5e1'
                        }}>
                            <AiOutlineEye style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                            <div style={{ fontSize: '16px', fontWeight: '600' }}>Chưa cấu hình kiểu hiển thị</div>
                            <div style={{ fontSize: '14px', marginTop: '8px' }}>Nhấn vào nút cài đặt để chọn kiểu hiển thị</div>
                        </div>
                    )}
                </div>
            </Card>

            <Modal
                title={
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <MdInfo style={{ marginRight: '8px', fontSize: '24px', color: '#3b82f6' }} />
                            Thông tin thiết bị
                        </div>
                    </div>
                }
                open={infoModalVisible}
                onCancel={closeInfoModal}
                footer={[
                    <Button key="close" onClick={closeInfoModal} style={{ fontWeight: '600' }}>
                        Đóng
                    </Button>
                ]}
                width={500}
                style={{ top: 50 }}
            >
                {item && (
                    <div style={{ padding: '16px 0' }}>
                        <Descriptions bordered column={1} layout="vertical" size="middle"
                                      title={<span style={{fontSize: '18px', fontWeight: '700', color: '#1e293b'}}>{item.name}</span>}
                                      labelStyle={{fontWeight: '600', color: '#64748b'}}
                                      contentStyle={{fontSize: '16px', fontWeight: '600', color: '#334155'}}
                        >
                            <Descriptions.Item label="MAC">{item.mac}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái kết nối">
                                <span style={{ color: item.connected ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center' }}>
                                    {item.connected ? <HiOutlineStatusOnline style={{ marginRight: '4px' }} /> : <HiOutlineStatusOffline style={{ marginRight: '4px' }} />}
                                    {item.connected ? 'Đang kết nối' : 'Mất kết nối'}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Kiểu hiển thị">
                                {getDisplayTypeText(item.type || 1)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái Input">
                                <span style={{ color: item.input ? '#d97706' : '#64748b', display: 'flex', alignItems: 'center' }}>
                                    <LuFileInput style={{ marginRight: '4px' }} />
                                    {item.input ? 'Hoạt động' : 'Không hoạt động'}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái Output">
                                <span style={{ color: item.output ? '#d97706' : '#64748b', display: 'flex', alignItems: 'center' }}>
                                    <LuFileOutput style={{ marginRight: '4px' }} />
                                    {item.output ? 'Hoạt động' : 'Không hoạt động'}
                                </span>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>

            <Modal
                title={
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AiOutlineControl style={{ marginRight: '8px', fontSize: '24px', color: '#f59e0b' }} />
                            Điều khiển thiết bị
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                            {item?.name} | MAC: {item?.mac}
                        </div>
                    </div>
                }
                open={controlModalVisible}
                onCancel={closeControlModal}
                footer={[
                    <Button
                        key="close"
                        onClick={closeControlModal}
                        style={{
                            fontWeight: '600',
                            borderRadius: '8px'
                        }}
                    >
                        Đóng
                    </Button>
                ]}
                width={600}
                style={{ top: 50 }}
            >
                {item && (
                    <div style={{ padding: '16px 0' }}>
                        <Tabs defaultActiveKey="1" centered size="large">
                            <TabPane
                                tab={
                                    <span style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                                        <LuFileOutput style={{ marginRight: '8px', fontSize: '20px' }} />
                                        Điều khiển Output
                                    </span>
                                }
                                key="1"
                            >
                                <div style={{ padding: '20px 0' }}>
                                    {renderControlRow('Output 1', 'output1', item.mac)}
                                    {renderControlRow('Output 2', 'output2', item.mac)}
                                    {renderControlRow('Output 3', 'output3', item.mac)}
                                    {renderControlRow('Output 4', 'output4', item.mac)}
                                    {renderControlRow('TCP', 'tcp', item.mac)}
                                    {renderControlRow('UDP', 'udp', item.mac)}
                                </div>
                            </TabPane>
                            <TabPane
                                tab={
                                    <span style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                                        <BiTerminal style={{ marginRight: '8px', fontSize: '20px' }} />
                                        Điều khiển Serial
                                    </span>
                                }
                                key="2"
                            >
                                <div style={{ padding: '20px 0' }}>
                                    {renderSerialRow('SERIAL RS485', 'SERIAL_RS485')}
                                    {renderSerialRow('SERIAL RS232', 'SERIAL_RS232')}
                                    {renderSerialRow('SERIAL TCP', 'SERIAL_TCP')}
                                </div>
                            </TabPane>
                        </Tabs>
                    </div>
                )}
            </Modal>

            <Modal
                title={
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: getSerialTypeColor(currentSerialType),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <BiTerminal style={{ marginRight: '8px', fontSize: '24px' }} />
                            {currentSerialType}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                            Thiết bị: {item?.name} | MAC: {item?.mac}
                        </div>
                    </div>
                }
                open={serialModalVisible}
                onCancel={closeSerialModal}
                footer={[
                    <Button
                        key="cancel"
                        onClick={closeSerialModal}
                        style={{
                            fontWeight: '600',
                            borderRadius: '8px'
                        }}
                    >
                        Hủy
                    </Button>,
                    <Button
                        key="send"
                        type="primary"
                        loading={serialLoading}
                        onClick={handleSerialCommand}
                        style={{
                            background: `linear-gradient(135deg, ${getSerialTypeColor(currentSerialType)} 0%, ${getSerialTypeColor(currentSerialType)}dd 100%)`,
                            borderColor: getSerialTypeColor(currentSerialType),
                            fontWeight: '600',
                            borderRadius: '8px',
                            boxShadow: `0 4px 12px ${getSerialTypeColor(currentSerialType)}40`
                        }}
                        icon={<BiTerminal />}
                    >
                        Gửi lệnh
                    </Button>
                ]}
                width={650}
                style={{ top: 80 }}
            >
                <div style={{ padding: '16px 0' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1e293b',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <BiTerminal style={{ marginRight: '8px', color: getSerialTypeColor(currentSerialType) }} />
                            Loại kết nối: {currentSerialType}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                            Nhập lệnh điều khiển serial cho thiết bị này
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#334155'
                        }}>
                            Lệnh điều khiển:
                        </label>
                        <TextArea
                            value={serialCommand}
                            onChange={(e) => setSerialCommand(e.target.value)}
                            placeholder={`Nhập lệnh ${currentSerialType}...`}
                            rows={8} // Tăng chiều cao mặc định
                            style={{
                                fontSize: '14px',
                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                resize: 'vertical',
                                borderRadius: '8px',
                                border: '2px solid #e2e8f0',
                                background: '#fafafa'
                            }}
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                title={
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FiSettings style={{ marginRight: '8px', fontSize: '24px', color: '#8b5cf6' }} />
                            Cài đặt hiển thị
                        </div>
                    </div>
                }
                open={displayModalVisible}
                onCancel={closeDisplayModal}
                footer={[
                    <Button
                        key="cancel"
                        onClick={closeDisplayModal}
                        style={{
                            fontWeight: '600',
                            borderRadius: '8px'
                        }}
                    >
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleDisplayTypeUpdate}
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            borderColor: '#8b5cf6',
                            fontWeight: '600',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        Cập nhật
                    </Button>
                ]}
                width={450}
            >
                {item && (
                    <Form
                        form={displayForm}
                        layout="vertical"
                        initialValues={{ type: item.type || 1 }}
                        style={{ padding: '16px 0' }}
                    >
                        <div style={{
                            marginBottom: '20px',
                            textAlign: 'center',
                            background: '#f8fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                                {item.name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'monospace' }}>
                                MAC: {item.mac}
                            </div>
                        </div>

                        <Form.Item
                            label="Chọn kiểu hiển thị"
                            name="type"
                            rules={[{ required: true, message: 'Vui lòng chọn kiểu hiển thị!' }]}
                        >
                            <Radio.Group>
                                <Radio value={1}>🎛️ Nút bấm</Radio>
                                <Radio value={2}>📊 Bảng dữ liệu</Radio>
                                <Radio value={3}>📈 Biểu đồ</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <div style={{
                            background: '#fffbeb',
                            padding: '16px',
                            borderRadius: '8px',
                            marginTop: '16px',
                            border: '1px solid #fbbf24'
                        }}>
                            <div style={{ fontSize: '14px', color: '#92400e' }}>
                                ℹ️ <strong>Hiện tại: {getDisplayTypeText(item.type || 1)}</strong>
                            </div>
                        </div>
                    </Form>
                )}
            </Modal>
        </Col>
    );
});

export default IotCard;