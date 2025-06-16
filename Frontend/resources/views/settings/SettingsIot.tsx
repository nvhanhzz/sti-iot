import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { TbPlugConnectedX, TbPlugConnected } from "react-icons/tb";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import type { TableColumnsType } from 'antd';
import {
    Button,
    Input,
    Table,
    Flex,
    Popconfirm,
    Popover,
    message,
    Row,
    Col,
} from 'antd';
import { IotCMDInterface } from '../../../interface/SettingInterface';
import LoadingTable from '../components/LoadingTable';
import IotService from '../../../services/IotService';
import { useSocket } from '../../../context/SocketContext';
import EditIotModal from './EditIotModal'; // Import the new modal component

type ContextType = {
    changePageName: (page: string, grouppage: string) => void;
};

// These interfaces are duplicated in EditIotModal.tsx as they are used there.
// If these interfaces are used elsewhere, consider moving them to a common types file.
interface IotConfig {
    SSID?: string;
    PW?: string;
    IP?: string;
    GATEWAY?: string;
    SUBNET?: string;
    DNS?: string;
}

interface RS485Addresses {
    ID?: number;
    Address?: string;
}

interface RS485Config {
    baudrate?: number;
    serialConfig?: string;
}

interface RS232Config {
    baudrate?: number;
    serialConfig?: string;
}

export interface ExtendedIotInterface extends IotCMDInterface {
    connected?: boolean;
    input?: boolean;
    output?: boolean;
    mac?: string;
    wifi?: IotConfig;
    can?: {
        baudrate?: number;
    };
    mqtt?: IotConfig & { MAC?: string };
    ethernet?: IotConfig & { MAC?: string };
    rs485Addresses?: RS485Addresses;
    rs485Config?: RS485Config;
    rs232Config?: RS232Config;
    version?: string;
    firmware?: string; // Add firmware here if it's not in IotCMDInterface
}

const SettingsIot: React.FC = () => {
    const socket = useSocket();
    const { t } = useTranslation();
    const [dataAll, setDataAll] = useState<ExtendedIotInterface[]>([]);
    const [data, setData] = useState<ExtendedIotInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchName, setSearchName] = useState<string>('');
    const [searchMac, setSearchMac] = useState<string>('');
    const { changePageName } = useOutletContext<ContextType>();

    const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
    const [currentEditingRecord, setCurrentEditingRecord] = useState<ExtendedIotInterface | null>(null);

    useEffect(() => {
        changePageName(t('navleft.device_iot'), t('navleft.settings'));
    }, [changePageName, t]);

    const handleEditRecord = (record: ExtendedIotInterface) => {
        setCurrentEditingRecord(record);
        setIsEditModalVisible(true);
    };

    const handleEditModalCancel = () => {
        setIsEditModalVisible(false);
        setCurrentEditingRecord(null);
    };

    const handleEditModalSaveSuccess = (updatedRecord: ExtendedIotInterface) => {
        const updateData = (prevData: ExtendedIotInterface[]) => {
            return prevData.map(item =>
                item.id === updatedRecord.id ? { ...item, ...updatedRecord } : item
            );
        };
        setData(updateData);
        setDataAll(updateData);
        // Optionally, update currentEditingRecord if the modal remains open for further edits
        setCurrentEditingRecord(updatedRecord);
    };

    const columns: TableColumnsType<ExtendedIotInterface> = [
        {
            title: 'STT',
            key: 'stt',
            width: '5%',
            render: (_text, _record, index) => index + 1,
        },
        {
            title: 'Tên thiết bị',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Địa chỉ MAC',
            dataIndex: 'mac',
            key: 'mac',
        },
        {
            title: 'Firmware',
            dataIndex: 'firmware',
            key: 'firmware',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (_, record: ExtendedIotInterface) => (
                <Flex wrap gap="small">
                    <Popover content="Trạng thái kết nối">
                        <Button
                            type="primary"
                            icon={record.connected ? <TbPlugConnected /> : <TbPlugConnectedX />}
                            style={{
                                backgroundColor: record.connected ? '#52c41a' : '#ff4d4f',
                                borderColor: record.connected ? '#52c41a' : '#ff4d4f',
                            }}
                        />
                    </Popover>
                    <Popover content="Đầu vào">
                        <Button
                            type="primary"
                            icon={<LuFileInput />}
                            style={{
                                backgroundColor: record.input ? '#ffff00' : '#ffffff',
                                color: "black"
                            }}
                        />
                    </Popover>
                    <Popover content="Đầu ra">
                        <Button
                            type="primary"
                            icon={<LuFileOutput />}
                            style={{
                                backgroundColor: record.output ? '#ffff00' : '#ffffff',
                                color: "black"
                            }}
                        />
                    </Popover>
                </Flex>
            ),
        },
        {
            title: 'Hành động',
            dataIndex: 'operation',
            width: '15%',
            render: (_, record: ExtendedIotInterface) => (
                <Flex gap="small" wrap>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditRecord(record)}
                    >
                        Chỉnh
                    </Button>
                    <Popconfirm
                        title={`Xác nhận ${record.isdelete ? 'mở khóa' : 'khóa'} ?`}
                        onConfirm={() => handleLockUnlock(record.id)}
                        okText="Đồng ý"
                        cancelText="Hủy"
                    >
                        <Button
                            danger={!record.isdelete}
                            style={record.isdelete ? { backgroundColor: '#fff', color: '#000', border: '1px solid #ddd' } : {}}
                            icon={<DeleteOutlined />}
                            disabled={record.isdelete && !record.name}
                        >
                            {record.isdelete ? 'Mở khóa' : 'Khóa'}
                        </Button>
                    </Popconfirm>
                </Flex>
            ),
        },
    ];

    const fetchData = async () => {
        try {
            setLoading(true);
            const response: any = await IotService.GetDataIots({});
            if (response?.data?.data) {
                setDataAll(response.data.data);
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            message.error('Lỗi khi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    const refreshData = () => {
        fetchData();
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = () => {
        const result = dataAll.filter((item: ExtendedIotInterface) => {
            const matchName = !searchName || (item.name && item.name.toLowerCase().includes(searchName.toLowerCase()));
            const matchMAC = !searchMac || (item.mac && item.mac.toLowerCase().includes(searchMac.toLowerCase()));
            return matchName && matchMAC;
        });
        setData(result);
    };

    const handleClearSearch = () => {
        setSearchName('');
        setSearchMac('');
        setData(dataAll);
    };

    const handleLockUnlock = async (id?: React.Key) => {
        if (!id) {
            message.error('ID không hợp lệ!');
            return;
        }

        const loadingMessage = message.loading('Đang xử lý...', 0);
        try {
            const dataPost = { id };
            const response: any = await IotService.LockIot(dataPost);
            const resData = response?.data;

            if (resData?.data) {
                const resDataNew = resData.data;

                const updateData = (prevData: ExtendedIotInterface[]) => {
                    return prevData.map(item =>
                        item.id === id ? { ...item, ...resDataNew } : item
                    );
                };

                setData(updateData);
                setDataAll(updateData);

                message.success('Thành công!');
            }
        } catch (errorInfo: any) {
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || 'Có lỗi xảy ra!';
            message.error(errorMessage);
        } finally {
            loadingMessage();
        }
    };

    const handleSocketEvent = useCallback((eventData: any) => {
        if (!Array.isArray(eventData)) return;

        setData((prevData) => {
            const newData = [...prevData];
            eventData.forEach((e: any) => {
                const index = newData.findIndex((item: ExtendedIotInterface) => item.id === e.iotId);
                if (index >= 0) {
                    newData[index] = { ...newData[index], ...e };
                }
            });
            return newData;
        });
    }, []);

    const handleSocketEventUpdateClient = useCallback((eventData: any) => {
        if (eventData) {
            setDataAll((prevData) => [eventData, ...prevData]);
            setData((prevData) => [eventData, ...prevData]);
        }
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on("iot_update_status", handleSocketEvent);
            socket.on("iot_update_client", handleSocketEventUpdateClient);

            return () => {
                socket.off("iot_update_status", handleSocketEvent);
                socket.off("iot_update_client", handleSocketEventUpdateClient);
            };
        }
    }, [socket, handleSocketEvent, handleSocketEventUpdateClient]);

    useEffect(() => {
        if (socket && dataAll.length > 0) {
            socket.emit("iot:iot_status");
        }
    }, [socket, dataAll]);

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <Row gutter={[16, 16]} align="middle">
                        <Col style={{ display: "flex", alignItems: "center" }}>
                            <h4 style={{ marginBottom: 0 }}>Tìm kiếm: </h4>
                        </Col>
                        <Col span={6}>
                            <Input
                                placeholder="Tên thiết bị"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col span={4}>
                            <Input
                                placeholder="Địa chỉ MAC"
                                value={searchMac}
                                onChange={(e) => setSearchMac(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex gap="small" wrap>
                                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                                    Tìm kiếm
                                </Button>
                                <Button onClick={handleClearSearch}>
                                    Xóa tìm kiếm
                                </Button>
                                <Button icon={<ReloadOutlined />} onClick={refreshData}>
                                    Làm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </div>
                <div className="card-body">
                    {loading ? (
                        <LoadingTable />
                    ) : (
                        <>
                            <h3 style={{ marginBottom: '30px' }}>Danh sách thiết bị</h3>
                            <Table
                                rowKey="id"
                                columns={columns}
                                dataSource={data}
                                bordered
                                pagination={false}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Modal chỉnh sửa thiết bị */}
            <EditIotModal
                isVisible={isEditModalVisible}
                record={currentEditingRecord}
                onCancel={handleEditModalCancel}
                onSaveSuccess={handleEditModalSaveSuccess}
            />
        </>
    );
};

export default SettingsIot;