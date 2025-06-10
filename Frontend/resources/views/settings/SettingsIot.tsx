import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
    const [searchValues, setSearchValues] = useState({ name: '', mac: '' });

    // Form instances
    const [form] = Form.useForm();
    const [formSearch] = Form.useForm();

    // Refs to prevent unnecessary re-renders
    const socketEmittedRef = useRef(false);
    const dataAllRef = useRef<IotCMDInterface[]>([]);

    // Update ref when dataAll changes
    useEffect(() => {
        dataAllRef.current = dataAll;
    }, [dataAll]);

    // Set page name on component mount - memoize để tránh re-run
    useEffect(() => {
        changePageName(t('navleft.device_iot'), t('navleft.settings'));
    }, [changePageName, t]);

    // Memoized status buttons để tránh re-render
    const StatusButtons = useMemo(() => {
        return React.memo(({ record }: { record: any }) => (
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
        ));
    }, []);

    // Memoized action buttons
    const ActionButtons = useMemo(() => {
        return React.memo(({ record }: { record: any }) => (
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
        ));
    }, [t]);

    // Memoized table columns để tránh re-create
    const columns: TableColumnsType<IotCMDInterface> = useMemo(() => [
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
            render: (_, record: any) => <StatusButtons record={record} />,
        },
        {
            title: t('action'),
            dataIndex: 'operation',
            key: 'operation',
            width: '15%',
            render: (_, record: any) => <ActionButtons record={record} />,
        },
    ], [t, StatusButtons, ActionButtons]);

    // Data fetching function - useCallback để tránh re-create
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response: any = await IotService.GetDataIots({});
            const responseData = response.data.data;
            setDataAll(responseData);
            setData(responseData);
            // Reset search form
            formSearch.resetFields();
            setSearchValues({ name: '', mac: '' });
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [formSearch]);

    // Initial data load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Memoized filtered data để tránh filter lại không cần thiết
    const filteredData = useMemo(() => {
        const { name: searchName, mac: searchMac } = searchValues;

        // If both fields are empty, show all data
        if (!searchName && !searchMac) {
            return dataAll;
        }

        // Filter data based on search criteria
        return dataAll.filter((item: any) => {
            const itemName = item.name ? String(item.name).toLowerCase() : '';
            const itemMac = item.mac ? String(item.mac).toLowerCase() : '';

            const matchName = searchName ? itemName.includes(searchName.toLowerCase()) : true;
            const matchMac = searchMac ? itemMac.includes(searchMac.toLowerCase()) : true;

            return matchName && matchMac;
        });
    }, [dataAll, searchValues]);

    // Update data when filtered result changes
    useEffect(() => {
        setData(filteredData);
    }, [filteredData]);

    // Search function - useCallback và debounce
    const handleSearch = useCallback(async () => {
        try {
            const values = await formSearch.validateFields();

            // Clean and normalize search values
            const searchName = values.name ? String(values.name).trim() : '';
            const searchMac = values.mac ? String(values.mac).trim() : '';

            setSearchValues({ name: searchName, mac: searchMac });
        } catch (error) {
            console.error("Search validation failed:", error);
        }
    }, [formSearch]);

    // Clear search and show all data
    const handleClearSearch = useCallback(() => {
        formSearch.resetFields();
        setSearchValues({ name: '', mac: '' });
    }, [formSearch]);

    // Show edit modal - useCallback
    const showModal = useCallback(async (id: React.Key) => {
        const item = dataAllRef.current.find((item: any) => item.id === id);
        if (item) {
            form.setFieldsValue({
                id: item.id,
                name: item.name
            });
            setIsModalVisible(true);
        }
    }, [form]);

    // Handle modal cancel - useCallback
    const handleCancel = useCallback(() => {
        setIsModalVisible(false);
        form.resetFields();
    }, [form]);

    // Update data in both dataAll and data arrays - useCallback với batching
    const updateItemInArrays = useCallback((updatedItem: any) => {
        setDataAll(prevDataAll => {
            const newDataAll = [...prevDataAll];
            const index = newDataAll.findIndex((item: any) => item.id === updatedItem.id);
            if (index >= 0) {
                newDataAll[index] = { ...newDataAll[index], ...updatedItem };
            }
            return newDataAll;
        });
    }, []);

    // Handle form submission in modal - useCallback
    const handleOk = useCallback(async () => {
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
    }, [form, t, updateItemInArrays]);

    // Handle lock/unlock functionality - useCallback
    const handleLockUnlock = useCallback(async (id: React.Key) => {
        const loadingMessage = message.loading('Đang xử lý...', 0);
        try {
            const dataPost = { id };
            const response: any = await IotService.LockIot(dataPost);
            const resData = response.data;
            const updatedItem = resData.data;

            // Update both arrays
            updateItemInArrays(updatedItem);

            message.success(t('errorCode.' + resData.message));
        } catch (errorInfo: any) {
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || 'Something went wrong';
            message.error(t('errorCode.' + errorMessage));
        } finally {
            loadingMessage();
        }
    }, [t, updateItemInArrays]);

    // Socket event handler - tối ưu với throttling
    const handleSocketEvent = useCallback((eventData: any) => {
        if (!Array.isArray(eventData)) return;

        // Batch update để tránh multiple re-renders
        const updateIds = new Set();
        const updates = eventData.filter((socketItem: any) => {
            if (updateIds.has(socketItem.id)) return false;
            updateIds.add(socketItem.id);
            return true;
        });

        if (updates.length > 0) {
            setDataAll(prevDataAll => {
                const newDataAll = [...prevDataAll];
                let hasChanges = false;

                updates.forEach((socketItem: any) => {
                    const index = newDataAll.findIndex((item: any) => item.id === socketItem.id);
                    if (index >= 0) {
                        // Chỉ update nếu có thay đổi thực sự
                        const currentItem = newDataAll[index];
                        const hasActualChanges = JSON.stringify(currentItem) !== JSON.stringify({...currentItem, ...socketItem});

                        if (hasActualChanges) {
                            newDataAll[index] = { ...currentItem, ...socketItem };
                            hasChanges = true;
                        }
                    }
                });

                return hasChanges ? newDataAll : prevDataAll;
            });
        }
    }, []);

    // Socket event listeners - stable reference
    useEffect(() => {
        socket.on("iot_update_status", handleSocketEvent);
        return () => {
            socket.off("iot_update_status");
        };
    }, [socket, handleSocketEvent]);

    // Emit socket event when dataAll changes - với debounce
    useEffect(() => {
        if (dataAll.length > 0 && !socketEmittedRef.current) {
            socketEmittedRef.current = true;
            const timer = setTimeout(() => {
                socket.emit("iot:iot_status");
                socketEmittedRef.current = false;
            }, 100); // Debounce 100ms

            return () => clearTimeout(timer);
        }
    }, [dataAll.length, socket]);

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
                            pagination={{
                                pageSize: 50,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total) => `Tổng ${total} bản ghi`
                            }}
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

export default React.memo(SettingsIot);