import React, { useState, useCallback, memo } from "react";
import { Card, Col, Button, Modal, Tooltip, Descriptions, Row } from "antd";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import { MdInfo } from "react-icons/md";
import { HiOutlineStatusOnline, HiOutlineStatusOffline } from "react-icons/hi";
import ViewButton from "./iot_visualization/ViewButton";
import ViewChart from "./iot_visualization/ViewChart";
import ViewTable from "./iot_visualization/ViewTable";

interface IotCardProps {
    item: any;
    colsPerRow: number;
    titleFontSize: number;
    contentFontSize: number;
}

const IotCard: React.FC<IotCardProps> = memo(({
                                                  item,
                                                  colsPerRow,
                                                  titleFontSize,
                                                  contentFontSize,
                                              }) => {
    const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);
    // State mới để kiểm soát màu nháy của Output
    const [outputHighlight, setOutputHighlight] = useState<boolean>(false);

    const closeInfoModal = useCallback(() => setInfoModalVisible(false), []);

    // Hàm được gọi khi có thao tác điều khiển thành công
    const handleControlSuccess = useCallback(() => {
        // Kích hoạt highlight
        setOutputHighlight(true);
        // Tắt highlight sau 500ms
        const timer = setTimeout(() => {
            setOutputHighlight(false);
        }, 500);
        return () => clearTimeout(timer); // Cleanup timer nếu component unmount sớm
    }, []);

    return (
        <Col span={Math.max(1, Math.floor(24 / colsPerRow))} style={{ flex: '1 0 auto' }}>
            <Card
                bordered={false}
                style={{
                    background: item.connected
                        ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    opacity: item.connected ? 1 : 0.8,
                    boxShadow: item.connected
                        ? '0 8px 32px rgba(0, 0, 0, 0.08)'
                        : '0 4px 16px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    borderBottom: `1px solid #ddd`,
                    borderRadius: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                title={
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '16px',
                            flexShrink: 0
                        }}>
                            <div style={{
                                fontSize: `${titleFontSize + 2}px`,
                                fontWeight: '700',
                                color: '#1e293b',
                                letterSpacing: '-0.025em',
                                lineHeight: '1',
                                whiteSpace: 'nowrap'
                            }}>
                                Thiết bị: {item.name}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: '#64748b',
                                lineHeight: '1',
                                whiteSpace: 'normal',
                                wordBreak: 'break-all'
                            }}>
                                <strong>MAC:</strong> {item.mac}
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
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
                                    {item.connected ? <HiOutlineStatusOnline style={{ marginRight: '4px' }} /> : <HiOutlineStatusOffline style={{ marginRight: '4px' }} />}
                                    <span style={{ color: item.connected ? '#15803d' : '#dc2626' }}>
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
                                    <LuFileInput style={{ marginRight: '4px', fontSize: '14px' }} />
                                    <span style={{ color: item.input ? '#92400e' : '#64748b' }}>
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
                                    // Thay đổi background và border dựa trên outputHighlight
                                    background: outputHighlight
                                        ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' // Màu vàng nháy
                                        : (item.output
                                            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' // Màu vàng nếu output hoạt động
                                            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'), // Màu xám nếu không hoạt động
                                    border: outputHighlight
                                        ? `1px solid #fbbf24` // Border màu vàng nháy
                                        : `1px solid ${item.output ? '#fbbf24' : '#cbd5e1'}`, // Border bình thường
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    transition: 'background 0.2s ease-in-out, border-color 0.2s ease-in-out' // Thêm transition
                                }}>
                                    <LuFileOutput style={{ marginRight: '4px', fontSize: '14px' }} />
                                    <span style={{
                                        // Thay đổi màu chữ dựa trên outputHighlight
                                        color: outputHighlight
                                            ? '#92400e' // Màu chữ vàng nháy
                                            : (item.output ? '#92400e' : '#64748b') // Màu chữ bình thường
                                    }}>
                                        Output
                                    </span>
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                }
            >
                <div style={{
                    textAlign: "left",
                    flex: 1,
                    fontSize: `${contentFontSize}px`,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Row gutter={[10, 10]} style={{ flex: 1 }}>
                        <Col span={14} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ paddingBottom: '10px' }}>
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
                                    <ViewButton
                                        dataIotsDetail={item}
                                        deviceMac={item.mac}
                                        onControlSuccess={handleControlSuccess}
                                        isConnected={item.connected}
                                    />
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
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
                                    border: '1px solid #e2e8f0',
                                    height: 'calc(100% - 40px)'
                                }}>
                                    <ViewTable
                                        dataIotsDetail={item}
                                        deviceMac={item.mac}
                                        onControlSuccess={handleControlSuccess}
                                        isConnected={item.connected}
                                    />
                                </div>
                            </div>
                        </Col>

                        <Col span={10} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1 }}>
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
                                    border: '1px solid #e2e8f0',
                                    height: 'calc(100% - 40px)'
                                }}>
                                    <ViewChart dataIotsDetail={item} settings={false} />
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
                    <Button key="close" onClick={closeInfoModal} style={{ fontWeight: '600', borderRadius: '6px' }}>
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
        </Col>
    );
});

export default IotCard;