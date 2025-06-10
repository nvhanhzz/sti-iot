import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { TbPlugConnectedX, TbPlugConnected } from "react-icons/tb";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import type { TableColumnsType } from 'antd';
import { Button, Input, Table, Flex, Modal, Form, Row, Col, message, Popconfirm, Popover } from 'antd';
import { IotCMDInterface } from '../../../interface/SettingInterface';
import LoadingTable from '../components/LoadingTable';
import IotService from '../../../services/IotService';
import { useSocket } from '../../../context/SocketContext';

type ContextType = {
    changePageName: (page: string, grouppage: string) => void;
};

interface ExtendedIotInterface extends IotCMDInterface {
    connected?: boolean;
    input?: boolean;
    output?: boolean;
    mac?: string;
}

const SettingsIot: React.FC = () => {
    const socket = useSocket();
    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [dataAll, setDataAll] = useState<ExtendedIotInterface[]>([]);
    const [data, setData] = useState<ExtendedIotInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [editingId, setEditingId] = useState<React.Key | null>(null);
    const [searchName, setSearchName] = useState<string>('');
    const [searchMac, setSearchMac] = useState<string>('');
    const [form] = Form.useForm();
    const { changePageName } = useOutletContext<ContextType>();

    useEffect(() => {
        changePageName(t('navleft.device_iot'), t('navleft.settings'));
    }, [changePageName, t]);

    const columns: TableColumnsType<ExtendedIotInterface> = [
        {
            title: t('iots.name'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: t('iots.mac'),
            dataIndex: 'mac',
            key: 'mac',
        },
        {
            title: t('iots.firmware'),
            dataIndex: 'firmware',
            key: 'firmware',
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            render: (_, record: ExtendedIotInterface) => (
                <Flex wrap gap="small">
                    <Popover content={t('status')}>
                        <Button
                            type="primary"
                            icon={record.connected ? <TbPlugConnected /> : <TbPlugConnectedX />}
                            style={{
                                backgroundColor: record.connected ? '#52c41a' : '#ff4d4f',
                                borderColor: record.connected ? '#52c41a' : '#ff4d4f',
                            }}
                        />
                    </Popover>
                    <Popover content={t('iots.input')}>
                        <Button
                            type="primary"
                            icon={<LuFileInput />}
                            style={{
                                backgroundColor: record.input ? '#ffff00' : '#ffffff',
                                color: "black"
                            }}
                        />
                    </Popover>
                    <Popover content={t('iots.output')}>
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
            title: t('action'),
            dataIndex: 'operation',
            width: '15%',
            render: (_, record: ExtendedIotInterface) => (
                <Flex gap="small" wrap>
                    <Button
                        color="primary"
                        variant="solid"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record.id)}
                    >
                        {t('edit')}
                    </Button>
                    <Popconfirm
                        title={`${t('sure_to')} ${record.isdelete ? t('un_loock') : t('lock')} ?`}
                        onConfirm={() => handleLockUnlock(record.id)}
                    >
                        <Button
                            color={record.isdelete ? 'default' : 'danger'}
                            style={record.isdelete ? {backgroundColor: '#fff', color: '#000', border: '1px solid #ddd'} : {}}
                            variant="solid"
                            icon={<DeleteOutlined />}
                            disabled={record.isdelete && !record.name}
                        >
                            {record.isdelete ? t('un_loock') : t('lock')}
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
            console.error('Error fetching data:', error);
            message.error('Error fetching data');
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

    const showModal = (id?: React.Key) => {
        if (id) {
            const item = data.find((item: ExtendedIotInterface) => id === item.id);
            if (item) {
                form.setFieldsValue(item);
                setEditingId(id);
            }
        } else {
            form.resetFields();
            setEditingId(null);
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingId(null);
        form.resetFields();
    };

    const handleOk = async () => {
        const loadingMessage = message.loading('Loading...', 0);
        try {
            const values = await form.validateFields();

            if (editingId) {
                values.id = editingId;
            }

            const response: any = await IotService.PostDataUpdateIots(values);
            const resData = response?.data;

            if (resData?.data) {
                const resDataNew = resData.data;
                setData(prevData => {
                    const newData = [...prevData];
                    const index = newData.findIndex((item: ExtendedIotInterface) =>
                        editingId ? item.id === editingId : item.mac === resDataNew.mac
                    );

                    if (index >= 0) {
                        newData[index] = { ...newData[index], ...resDataNew };
                    } else {
                        newData.unshift(resDataNew);
                    }
                    return newData;
                });

                setDataAll(prevData => {
                    const newData = [...prevData];
                    const index = newData.findIndex((item: ExtendedIotInterface) =>
                        editingId ? item.id === editingId : item.mac === resDataNew.mac
                    );

                    if (index >= 0) {
                        newData[index] = { ...newData[index], ...resDataNew };
                    } else {
                        newData.unshift(resDataNew);
                    }
                    return newData;
                });

                message.success('Success');
                handleCancel();
            }
        } catch (errorInfo: any) {
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || 'Something went wrong';
            message.error(errorMessage);
        } finally {
            loadingMessage();
        }
    };

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
            message.error('Invalid ID');
            return;
        }

        const loadingMessage = message.loading('Loading...', 0);
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

                message.success('Success');
            }
        } catch (errorInfo: any) {
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || 'Something went wrong';
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
                        <Col style={{display: "flex", alignItems: "center"}}>
                            <h4 style={{marginBottom: 0}}>Tìm kiếm: </h4>
                        </Col>
                        <Col span={6}>
                            <Input
                                placeholder={t('iots.name')}
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col span={4}>
                            <Input
                                placeholder={t('iots.mac')}
                                value={searchMac}
                                onChange={(e) => setSearchMac(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex gap="small" wrap>
                                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                                    {t('search')}
                                </Button>
                                <Button onClick={handleClearSearch}>
                                    Clear
                                </Button>
                                <Button icon={<ReloadOutlined />} onClick={refreshData}>
                                    Refresh
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
                            <h3 style={{marginBottom: '30px'}}>Danh sách thiết bị</h3>
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

            <Modal
                title={editingId ? t('edit') : t('cmd.create')}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        {t('cancel')}
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleOk}>
                        {t('ok')}
                    </Button>,
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="modal_form"
                >
                    <Form.Item
                        label={t('iots.name')}
                        name='name'
                        rules={[
                            { required: true, message: `${t('please_input_your')} ${t('iots.name')} !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('iots.name')}`} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default SettingsIot;