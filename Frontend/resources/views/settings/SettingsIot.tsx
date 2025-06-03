import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { EditOutlined, DeleteOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { TbPlugConnectedX, TbPlugConnected } from "react-icons/tb";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import type { TableColumnsType } from 'antd';
import { Button, Input, Table, Flex, Modal, Form, Radio, message, Popconfirm, Popover } from 'antd';
import { IotCMDInterface } from '../../../interface/SettingInterface';
import LoadingTable from '../components/LoadingTable';
import PaginatedSearchSelect from '../components/PaginatedSearchSelect';
import IotService from '../../../services/IotService';
import { useSocket } from '../../../context/SocketContext';
import CardSendData from '../components/CardSendData';

type ContextType =
    {
        changePageName: (page: string, grouppage: string) => void;
    };

const SettingsIot: React.FC = () => {
    const socket = useSocket();
    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [dataAll, setDataAll] = useState<IotCMDInterface[]>([]);
    const [data, setData] = useState<IotCMDInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [form] = Form.useForm();
    const [formSearch] = Form.useForm();
    const defautForm: IotCMDInterface = {};
    const [formData] = useState<IotCMDInterface>(defautForm);
    const [formDataSearch, setformDataSearch] = useState<IotCMDInterface>(defautForm);
    const [modal2Open, setModal2Open] = useState(false);
    const { changePageName } = useOutletContext<ContextType>();

    React.useEffect(() => {
        changePageName(t('navleft.device_iot'), t('navleft.settings'));
    }, [changePageName]);

    const columns: TableColumnsType<IotCMDInterface> =
        [
            {
                title: t('iots.name'),
                dataIndex: 'name',
                key: 'name',
            },
            {
                title: t('iots.device_id'),
                dataIndex: 'device_id',
                key: 'device_id',
            },
            {
                title: t('iots.mac'),
                dataIndex: 'mac',
                key: 'mac',
            },
            {
                title: t('iots.ip'),
                dataIndex: 'ip',
                key: 'ip',
            },
            {
                title: t('iots.firmware'),
                dataIndex: 'firmware',
                key: 'firmware',
            },
            {
                title: t('iots.type_view'),
                dataIndex: 'type',
                key: 'type',
                render: (_, record) =>
                    data.length >= 1 ?
                        (
                            <>
                                <p>{record.type == 1 ? t('iots.view_button') : record.type == 2 ? t('iots.view_data') : (record.type == 3 ? t('iots.view_chart') : t('iots.view_count'))}</p>
                            </>
                        ) : null,
            },
            {
                title: t('status'),
                dataIndex: 'isdelete',
                key: 'isdelete',
                render: (_, record: any) =>
                    data.length >= 1 ?
                        (
                            <>
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
                                                backgroundColor: !record.input ? '#ffffff' : '#ffff00',
                                                color: "black"
                                            }}
                                        />
                                    </Popover>
                                    <Popover content={t('iots.output')} >
                                        <Button
                                            type="primary"
                                            icon={<LuFileOutput />}
                                            style={{
                                                backgroundColor: !record.output ? '#ffffff' : '#ffff00',
                                                color: "black"
                                            }}
                                        />
                                    </Popover>
                                </Flex>
                            </>
                        ) : null,
            },
            {
                title: t('action'),
                dataIndex: 'operation',
                width: '15%',
                render: (_, record: any) =>
                    data.length >= 1 ? (
                        record.isdelete == 0 ? (
                            <>
                                <Flex gap="small" wrap>
                                    <Button color="primary" variant="solid" icon={<EditOutlined />} onClick={() => showModal(record.id ?? 0)}>
                                        {t('edit')}
                                    </Button>
                                    <Popconfirm title={`${t('sure_to')} ${record.isdelete ? t('un_loock') : t('lock')}  ?`} onConfirm={() => handleLoockUnLoock(record.id ?? 0)}>
                                        <Button color={!record.isdelete ? 'danger' : 'default'} variant="solid" icon={<DeleteOutlined />}>
                                            {record.isdelete ? t('un_loock') : t('lock')}
                                        </Button>
                                    </Popconfirm>
                                </Flex>
                            </>
                        ) : (
                            <>
                                <Flex gap="small" wrap>
                                    <Button color="primary" variant="solid" icon={<EditOutlined />} onClick={() => showModal(record.id ?? 0)}>
                                        {t('un_loock')}
                                    </Button>
                                </Flex>
                            </>
                        )
                    ) : null,
            },
        ];

    const fetchData = async () => {
        try {
            const response: any = await IotService.GetDataIots({});
            setDataAll(response.data.data);
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [formDataSearch]);

    const showModal = async (id: React.Key) => {
        const index = data.findIndex((item: any) => id === item.id);
        const item = data[index];
        form.setFieldsValue(item);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const handleOk = async () => {
        const loadingMessage = message.loading('Loading...', 0);
        try {
            const values = await form.validateFields();
            const response: any = await IotService.PostDataUpdateIots(values);
            const resData = response.data;
            const resDataNew = resData.data;
            const newData = [...data];
            const index = newData.findIndex((item: any) => item.mac === resDataNew.mac);
            if (index >= 0) {
                const updatedItem = { ...newData[index], ...resDataNew };
                newData.splice(index, 1, updatedItem);
            } else {
                newData.unshift(resDataNew);
            }
            setData(newData);
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

    const handleCancelSearch = () => {
        setModal2Open(false);
    };

    const handleOkSearch = async () => {
        try {
            const values = await formSearch.validateFields();
            const result = dataAll.filter((item: any) => {
                const matchName = values.name?.length ? values.name.includes(item.name) : true;
                const matchMAC = values.mac?.length ? values.mac.includes(item.mac) : true;
                return matchName && matchMAC;
            });
            setData(result);
        } catch (errorInfo) {
            console.error("Validation Failed:", errorInfo);
        }
    };

    useEffect(() => {
        handleOkSearch();
    }, [dataAll]);

    const handleLoockUnLoock = async (key: React.Key) => {
        const loadingMessage = message.loading('Loading...', 0);
        try {
            const dataPost = {
                'id': key
            };
            const response: any = await IotService.LockIot(dataPost);
            const resData = response.data;
            const resDataNew = resData.data;
            const newData = [...data];
            const index = newData.findIndex((item: any) => item.mac === resDataNew.mac);
            if (index >= 0) {
                const updatedItem = { ...newData[index], ...resDataNew };
                newData.splice(index, 1, updatedItem);
            };
            setData(newData);
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

    const handleReloadData = () => {
        setLoading(true);
        fetchData();
    };

    const handleSocketEvent = useCallback((eventData: any) => {
        setData((prevData) => {
            const newData = [...prevData];
            eventData.forEach((e: any) => {
                const index = newData.findIndex((item: any) => item.id === e.iotId);
                if (index >= 0) {
                    const updatedItem = { ...newData[index], ...e };
                    newData.splice(index, 1, updatedItem);
                }
            });
            return newData;
        });
    }, []);

    const handleSocketEventUpdateClient = useCallback((eventData: any) => {
        setDataAll((prevData) => [eventData, ...prevData]);
    }, []);

    useEffect(() => {
        socket.on("iot_update_status", handleSocketEvent);
        socket.on("iot_update_client", handleSocketEventUpdateClient);
        return () => {
            socket.off("iot_update_status");
        };
    }, [socket]);

    useEffect(() => {
        socket.emit("iot:iot_status");
    }, [dataAll]);

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <Flex gap="small" wrap>
                        <Button size={'large'} icon={<ReloadOutlined />} color="default" variant="dashed" onClick={() => handleReloadData()}>
                            {t('reload')}
                        </Button>
                        <Button size={'large'} icon={<FilterOutlined />} onClick={() => setModal2Open(true)}>
                            {t('search')}
                        </Button>
                        <CardSendData></CardSendData>
                    </Flex>
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
                title={t('cmd.create')}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={() => (
                    <>
                        <Button onClick={handleCancel}>{t('cancel')}</Button>
                        <Button color="primary" variant="solid" onClick={handleOk}>{t('ok')}</Button>
                    </>
                )}>
                <Form
                    form={form}
                    layout="vertical"
                    name="modal_form"
                    initialValues={formData}
                >
                    <Form.Item
                        label='id'
                        name="id"
                        className="d-none"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={t('iots.name')}
                        name='name'
                        rules={[
                            { required: true, message: `${t('please_input_your')} ${t('iots.name')} !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('iots.name')}`} />
                    </Form.Item>
                    <Form.Item
                        label={t('iots.device_id')}
                        name='device_id'
                        rules={[
                            { required: true, message: `${t('please_input_your')} ${t('iots.device_id')} !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('iots.device_id')}`} disabled />
                    </Form.Item>
                    <Form.Item
                        label={t('iots.mac')}
                        name='mac'
                        rules={[
                            { required: true, message: `${t('please_input_your')} ${t('iots.mac')} !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('iots.mac')}`} disabled />
                    </Form.Item>
                    <Form.Item
                        label={t('iots.type_view')}
                        name='type'
                        rules={[
                            { required: true, message: `${t('please_choose_your')} !` },
                        ]}
                    >
                        <Radio.Group>
                            <Radio value={1}>{t('iots.view_button')}</Radio>
                            <Radio value={2}>{t('iots.view_data')}</Radio>
                            <Radio value={3}>{t('iots.view_chart')}</Radio>
                            <Radio value={4}>{t('iots.view_count')}</Radio>
                        </Radio.Group>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title={t('search')}
                centered
                open={modal2Open}
                onCancel={handleCancelSearch}
                footer={() => (
                    <>
                        <Button color="primary" variant="solid" onClick={handleOkSearch}>{t('search')}</Button>
                    </>
                )}>
                <hr />
                <Form
                    form={formSearch}
                    layout="vertical"
                    name="modal_form"
                    initialValues={formDataSearch}
                >
                    <Form.Item
                        label={t('iots.name')}
                        name="name"
                    >
                        <PaginatedSearchSelect columns="name" table='iot' />
                    </Form.Item>
                    <Form.Item
                        label={t('iots.mac')}
                        name="mac"
                    >
                        <PaginatedSearchSelect columns="mac" table='iot' />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default SettingsIot;