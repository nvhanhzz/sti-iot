import React, { useState, useCallback, memo } from "react";
import { Card, Col, Button, Modal, Space, message, Input, Badge, Tooltip, Tabs, Descriptions, Row } from "antd";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import { MdInfo } from "react-icons/md";
import { BiTerminal } from "react-icons/bi";
import { HiOutlineStatusOnline, HiOutlineStatusOffline } from "react-icons/hi";
import { AiOutlineControl } from "react-icons/ai";
import ViewButton from "./iot_visualization/ViewButton";
import ViewChart from "./iot_visualization/ViewChart";
import ViewTable from "./iot_visualization/ViewTable";

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
}

const IotCard: React.FC<IotCardProps> = memo(({
                                                  item,
                                                  colsPerRow,
                                                  titleFontSize,
                                                  contentFontSize,
                                              }) => {
    const [loading, setLoading] = useState<{[key: string]: boolean}>({});
    const [controlModalVisible, setControlModalVisible] = useState<boolean>(false);
    const [serialModalVisible, setSerialModalVisible] = useState<boolean>(false);
    const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);
    const [currentSerialType, setCurrentSerialType] = useState<string>('');
    const [serialCommand, setSerialCommand] = useState<string>('');
    const [ipSerialTCP, setIpSerialTcp] = useState<string>('');
    const [serialLoading, setSerialLoading] = useState<boolean>(false);

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

    const sendSerialCommand = useCallback(async (mac: string, serialType: string, command: string, ipTcpSerial?: string): Promise<any> => {
        try {
            setSerialLoading(true);

            // Construct the request body dynamically
            const requestBody: { mac: string; type: string; command: string; ipTcpSerial?: string } = {
                mac: mac,
                type: serialType.toLowerCase(),
                command: command,
            };

            // Only add ipTcpSerial to the body if it's provided
            if (ipTcpSerial) {
                requestBody.ipTcpSerial = ipTcpSerial;
            }

            const response = await fetch('http://localhost:3335/api/iots/serial-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody), // Use the dynamically created requestBody
            });

            if (!response.ok) {
                // Attempt to parse error message from response if available
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || response.statusText}`);
            }

            message.success(`Gửi lệnh ${serialType} thành công`);
            setSerialCommand('');
            setSerialModalVisible(false);
            return await response.json(); // Return the response data if successful
        } catch (error) {
            console.error('Error sending serial command:', error);
            // Display a more specific error message if possible
            if (error instanceof Error) {
                message.error(`Lỗi khi gửi lệnh ${serialType}: ${error.message}`);
            } else {
                message.error(`Lỗi khi gửi lệnh ${serialType}`);
            }
            throw error; // Re-throw the error for further handling up the call stack
        } finally {
            setSerialLoading(false);
        }
    }, []);

    const openControlModal = useCallback(() => setControlModalVisible(true), []);
    const closeControlModal = useCallback(() => setControlModalVisible(false), []);
    const closeInfoModal = useCallback(() => setInfoModalVisible(false), []);

    const openSerialModal = useCallback((serialType: string) => {
        setCurrentSerialType(serialType);
        setSerialCommand('');
        setSerialModalVisible(true);
        // Reset IP khi mở modal
        setIpSerialTcp('');
    }, []);

    const closeSerialModal = useCallback(() => {
        setSerialModalVisible(false);
        setCurrentSerialType('');
        setSerialCommand('');
        // Reset IP khi đóng modal
        setIpSerialTcp('');
    }, []);

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

        if (currentSerialType.toUpperCase() === "SERIAL_TCP") {
            await sendSerialCommand(item.mac, currentSerialType, serialCommand, ipSerialTCP);
        } else {
            await sendSerialCommand(item.mac, currentSerialType, serialCommand);
        }
    }, [serialCommand, currentSerialType, item.mac, sendSerialCommand, ipSerialTCP]);

    const renderControlRow = useCallback((label: string, type: keyof typeof HEX_COMMANDS, deviceMac: string) => {
        const onLoadingKey = `${deviceMac}-${type}-on`;
        const offLoadingKey = `${deviceMac}-${type}-off`;
        const isOnLoading = loading[onLoadingKey] || false;
        const isOffLoading = loading[offLoadingKey] || false;

        const blueOnColor = {
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
            borderColor: '#60a5fa',
            boxShadow: '0 2px 8px rgba(96, 165, 250, 0.3)'
        };

        const redOffColor = {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderColor: '#ef4444',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
        };

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
                     borderRadius: '8px',
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
                            ...blueOnColor,
                            fontWeight: '600',
                            borderRadius: '6px', // Đã chỉnh
                            minWidth: '70px',
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
                            ...redOffColor,
                            fontWeight: '600',
                            borderRadius: '6px', // Đã chỉnh
                            minWidth: '70px',
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
                     borderRadius: '8px',
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
                        borderRadius: '6px', // Đã chỉnh
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                    }}
                    icon={<BiTerminal />}
                >
                    Mở yêu cầu
                </Button>
            </div>
        );
    }, [openSerialModal]);

    const getSerialTypeColor = useCallback((serialType: string) => {
        switch (serialType) {
            case 'SERIAL_RS485': return '#8b5cf6';
            case 'SERIAL_RS232': return '#06b6d4';
            case 'SERIAL_TCP': return '#f59e0b';
            default: return '#3b82f6';
        }
    }, []);

    return (
        <Col span={Math.max(1, Math.floor(24 / colsPerRow))} style={{minHeight: "1000px"}}>
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
                            marginBottom: '4px' // Giảm margin bottom để MAC lên gần title
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

                        {/* Địa chỉ MAC được đưa lên đây */}
                        <div style={{
                            fontSize: '13px',
                            color: '#64748b',
                            marginBottom: '16px' // Giữ khoảng cách với các nút trạng thái
                        }}>
                            <strong>MAC:</strong> {item.mac}
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
                                    borderRadius: '10px',
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
                                    borderRadius: '10px',
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
                                    borderRadius: '10px',
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

                            <Tooltip title="Điều khiển thiết bị">
                                <Button
                                    type="default"
                                    size="large"
                                    icon={<AiOutlineControl />}
                                    onClick={openControlModal}
                                    // disabled={!item.connected}
                                    style={{
                                        borderRadius: '10px', // Đã chỉnh
                                        background: item.connected
                                            ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
                                            : '#e5e7eb',
                                        borderColor: item.connected ? '#60a5fa' : '#d1d5db',
                                        color: item.connected ? 'white' : '#9ca3af',
                                        fontWeight: '600',
                                        boxShadow: item.connected
                                            ? '0 4px 12px rgba(96, 165, 250, 0.3)'
                                            : 'none',
                                        minWidth: '48px',
                                        height: '48px'
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>
                }
            >
                <div style={{
                    padding: "20px",
                    textAlign: "left",
                    minHeight: `${800}px`,
                    overflowY: "auto",
                    fontSize: `${contentFontSize}px`,
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(226, 232, 240, 0.5)'
                }}>
                    <Row gutter={20}>
                        <Col span={12}>
                            <div style={{
                                marginBottom: '20px',
                                paddingBottom: '20px'
                            }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#334155',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    Trạng thái
                                </h3>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <ViewButton dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                                </div>
                            </div>
                        </Col>

                        <Col span={12}>
                            <div style={{
                                marginBottom: '0px',
                                paddingBottom: '0px'
                            }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#334155',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    Biểu đồ
                                </h3>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <ViewChart dataIotsDetail={item} settings={false} />
                                </div>
                            </div>
                        </Col>

                        <Col span={24}>
                            <div style={{
                                marginBottom: '20px',
                                paddingBottom: '20px',
                                borderBottom: '1px solid #e2e8f0'
                            }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#334155',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    Bảng dữ liệu
                                </h3>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <ViewTable dataIotsDetail={item} dataOnEvent={{}} settings={false} />
                                </div>
                            </div>

                        </Col>
                    </Row>
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
                    <Button key="close" onClick={closeInfoModal} style={{ fontWeight: '600', borderRadius: '6px' }}> {/* Đã chỉnh */}
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
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AiOutlineControl style={{ marginRight: '8px', fontSize: '24px', color: '#2563eb' }} />
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
                            borderRadius: '6px' // Đã chỉnh
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
                        <Tabs
                            defaultActiveKey="1"
                            centered
                            size="large"
                            tabBarStyle={{ borderBottom: '1px solid #e2e8f0' }}
                        >
                            <TabPane
                                tab={
                                    <span style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
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
                                    <span style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
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
                            borderRadius: '6px' // Đã chỉnh
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
                            borderRadius: '6px', // Đã chỉnh
                            boxShadow: `0 4px 12px ${getSerialTypeColor(currentSerialType)}40`
                        }}
                        icon={<BiTerminal />}
                    >
                        Gửi dữ liệu
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
                            Nhập dữ liệu serial cho thiết bị này
                        </div>
                    </div>

                    {
                        currentSerialType.toUpperCase() === "SERIAL_TCP" && (
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '12px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#334155'
                                }}>
                                    IP:
                                </label>
                                <Input
                                    value={ipSerialTCP}
                                    onChange={(e) => {
                                        setIpSerialTcp(e.target.value)
                                    }}
                                    placeholder={`Nhập IP cho ${currentSerialType}...`}
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
                        )
                    }

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#334155'
                        }}>
                            Dữ liệu:
                        </label>
                        <TextArea
                            value={serialCommand}
                            onChange={(e) => setSerialCommand(e.target.value)}
                            placeholder={`Nhập dữ liệu ${currentSerialType}...`}
                            rows={8}
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
        </Col>
    );
});

export default IotCard;