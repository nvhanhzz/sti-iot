import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { EditOutlined, FilterOutlined, DeleteOutlined } from '@ant-design/icons';
import { TbPlugConnectedX, TbPlugConnected } from "react-icons/tb";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import type { TableColumnsType } from 'antd';
import { Button, Input, Table, Flex, Modal, Form, message, Popconfirm, Popover } from 'antd';
import { IotCMDInterface } from '../../../interface/SettingInterface';
import LoadingTable from '../components/LoadingTable';
import IotService from '../../../services/IotService';
import { useSocket } from '../../../context/SocketContext';

type ContextType = {
    changePageName: (page: string, grouppage: string) => void;
};

const SettingsIot: React.FC = () => {
    const socket = useSocket();
    const { t } = useTranslation();
    const { changePageName } = useOutletContext<ContextType>();

    // State management
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [dataAll, setDataAll] = useState<IotCMDInterface[]>([]);
    const [data, setData] = useState<IotCMDInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Form instances
    const [form] = Form.useForm();
    const [formSearch] = Form.useForm();

    // Set page name on component mount
    useEffect(() => {
        changePageName(t('navleft.device_iot'), t('navleft.settings'));
    }, [changePageName, t]);

    // Table columns configuration
    const columns: TableColumnsType<IotCMDInterface> = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: '5%',
            render: (_, _record, index) => index + 1,
        },
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
            width: '20%',
            render: (_, record: any) => (
                <Flex wrap gap="small">
                    <Popover content={record.connected ? "Đã kết nối" : "Không kết nối"}>
                        <Button
                            type="primary"
                            icon={record.connected ? <TbPlugConnected /> : <TbPlugConnectedX />}
                            style={{
                                backgroundColor: record.connected ? '#52c41a' : '#ff4d4f',
                                borderColor: record.connected ? '#52c41a' : '#ff4d4f',
                            }}
                        />
                    </Popover>
                    <Popover content={record.input ? 'Có dữ liệu vào' : 'Không có dữ liệu vào'}>
                        <Button
                            type="primary"
                            icon={<LuFileInput />}
                            style={{
                                backgroundColor: record.input ? '#52c41a' : '#fff',
                                color: "#000",
                                borderColor: record.input ? '#52c41a' : '#d9d9d9',
                            }}
                        />
                    </Popover>
                    <Popover content={record.output ? 'Có dữ liệu ra' : 'Không có dữ liệu ra'}>
                        <Button
                            type="primary"
                            icon={<LuFileOutput />}
                            style={{
                                backgroundColor: record.output ? '#52c41a' : '#fff',
                                color: "#000",
                                borderColor: record.output ? '#52c41a' : '#d9d9d9',
                            }}
                        />
                    </Popover>
                </Flex>
            ),
        },
        {
            title: t('action'),
            dataIndex: 'operation',
            key: 'operation',
            width: '15%',
            render: (_, record: any) => (
                <Flex gap="small" wrap>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record.id ?? 0)}
                        size="small"
                    >
                        {t('edit')}
                    </Button>
                    <Popconfirm
                        title={`${t('sure_to')} ${record.isdelete ? t('un_loock') : t('lock')}?`}
                        onConfirm={() => handleLockUnlock(record.id ?? 0)}
                    >
                        <Button
                            type={record.isdelete == 0 ? "primary" : "default"}
                            danger={record.isdelete == 0}
                            icon={<DeleteOutlined />}
                            size="small"
                        >
                            {record.isdelete == 0 ? t('lock') : t('un_loock')}
                        </Button>
                    </Popconfirm>
                </Flex>
            ),
        },
    ];

    // Data fetching function
    const fetchData = async () => {
        try {
            setLoading(true);
            const response: any = await IotService.GetDataIots({});
            const responseData = response.data.data;
            setDataAll(responseData);
            setData(responseData);
            // Reset search form
            formSearch.resetFields();
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // Initial data load
    useEffect(() => {
        fetchData();
    }, []);

    // Search function - only triggered by button click
    const handleSearch = async () => {
        try {
            const values = await formSearch.validateFields();

            // Clean and normalize search values
            const searchName = values.name ? String(values.name).trim().toLowerCase() : '';
            const searchMac = values.mac ? String(values.mac).trim().toLowerCase() : '';

            // If both fields are empty, show all data
            if (!searchName && !searchMac) {
                setData(dataAll);
                return;
            }

            // Filter data based on search criteria
            const filteredData = dataAll.filter((item: any) => {
                const itemName = item.name ? String(item.name).toLowerCase() : '';
                const itemMac = item.mac ? String(item.mac).toLowerCase() : '';

                const matchName = searchName ? itemName.includes(searchName) : true;
                const matchMac = searchMac ? itemMac.includes(searchMac) : true;

                return matchName && matchMac;
            });

            setData(filteredData);
        } catch (error) {
            console.error("Search validation failed:", error);
        }
    };

    // Clear search and show all data
    const handleClearSearch = () => {
        formSearch.resetFields();
        setData(dataAll);
    };

    // Show edit modal
    const showModal = async (id: React.Key) => {
        const item = dataAll.find((item: any) => item.id === id);
        if (item) {
            form.setFieldsValue({
                id: item.id,
                name: item.name
            });
            setIsModalVisible(true);
        }
    };

    // Handle modal cancel
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    // Update data in both dataAll and data arrays
    const updateItemInArrays = (updatedItem: any) => {
        // Update dataAll
        setDataAll(prevDataAll => {
            const newDataAll = [...prevDataAll];
            const index = newDataAll.findIndex((item: any) => item.id === updatedItem.id);
            if (index >= 0) {
                newDataAll[index] = { ...newDataAll[index], ...updatedItem };
            }
            return newDataAll;
        });

        // Update data (filtered data)
        setData(prevData => {
            const newData = [...prevData];
            const index = newData.findIndex((item: any) => item.id === updatedItem.id);
            if (index >= 0) {
                newData[index] = { ...newData[index], ...updatedItem };
            }
            return newData;
        });
    };

    // Handle form submission in modal
    const handleOk = async () => {
        const loadingMessage = message.loading('Đang cập nhật...', 0);
        try {
            const values = await form.validateFields();
            const dataToUpdate = {
                id: values.id,
                name: values.name
            };

            const response: any = await IotService.PostDataUpdateIots(dataToUpdate);
            const resData = response.data;
            const updatedItem = resData.data;

            // Update both arrays
            updateItemInArrays(updatedItem);

            message.success(t('errorCode.' + resData.message));
            setIsModalVisible(false);
            form.resetFields();
        } catch (errorInfo: any) {
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || 'Something went wrong';
            message.error(t('errorCode.' + errorMessage));
        } finally {
            loadingMessage();
        }
    };

    // Handle lock/unlock functionality
    const handleLockUnlock = async (id: React.Key) => {
        const loadingMessage = message.loading('Đang xử lý...', 0);
        try {
            const dataPost = { id };
            const response: any = await IotService.LockIot(dataPost);
            const resData = response.data;
            const updatedItem = resData.data;

            // Update both arrays
            updateItemInArrays(updatedItem);

            message.success(t('errorCode.' + resData.message));
            debugger;
        } catch (errorInfo: any) {
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || 'Something went wrong';
            message.error(t('errorCode.' + errorMessage));
        } finally {
            loadingMessage();
        }
    };

    // Socket event handler
    const handleSocketEvent = useCallback((eventData: any) => {
        if (!Array.isArray(eventData)) return;

        eventData.forEach((socketItem: any) => {
            updateItemInArrays(socketItem);
        });
    }, []);

    // Socket event listeners
    useEffect(() => {
        socket.on("iot_update_status", handleSocketEvent);
        return () => {
            socket.off("iot_update_status");
        };
    }, [socket, handleSocketEvent]);

    // Emit socket event when dataAll changes
    useEffect(() => {
        if (dataAll.length > 0) {
            socket.emit("iot:iot_status");
        }
    }, [dataAll, socket]);

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <Form
                        form={formSearch}
                        layout="inline"
                        name="search_form"
                        onFinish={handleSearch}
                    >
                        <Flex gap="small" wrap>
                            <Form.Item
                                label={t('iots.name')}
                                name="name"
                                style={{ marginBottom: 0 }}
                            >
                                <Input placeholder={`Tìm theo ${t('iots.name')}`} />
                            </Form.Item>
                            <Form.Item
                                label={t('iots.mac')}
                                name="mac"
                                style={{ marginBottom: 0 }}
                            >
                                <Input placeholder={`Tìm theo ${t('iots.mac')}`} />
                            </Form.Item>
                            <Button
                                type="primary"
                                icon={<FilterOutlined />}
                                htmlType="submit"
                            >
                                {t('search')}
                            </Button>
                            <Button onClick={handleClearSearch}>
                                Xóa bộ lọc
                            </Button>
                        </Flex>
                    </Form>
                </div>
                <div className="card-body">
                    {loading ? (
                        <LoadingTable />
                    ) : (
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={data}
                            bordered
                        />
                    )}
                </div>
            </div>

            <Modal
                title={t('edit')}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        {t('cancel')}
                    </Button>,
                    <Button key="ok" type="primary" onClick={handleOk}>
                        {t('ok')}
                    </Button>
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="modal_form"
                >
                    <Form.Item
                        label="ID"
                        name="id"
                        style={{ display: 'none' }}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={t('iots.name')}
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: `${t('please_input_your')} ${t('iots.name')}!`
                            },
                            {
                                whitespace: true,
                                message: 'Tên không được chỉ chứa khoảng trắng!'
                            }
                        ]}
                    >
                        <Input
                            placeholder={`${t('enter_your')} ${t('iots.name')}`}
                            maxLength={100}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default SettingsIot;