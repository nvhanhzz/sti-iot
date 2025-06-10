import React, { useEffect, useState } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { FileAddOutlined, EditOutlined, DeleteOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Input, Table, Flex, Modal, Form, Radio, message, Popconfirm, Select } from 'antd';
import { PacketInterface } from '../../../interface/SettingInterface';
import PacketService from '../../../services/PacketService';
import LoadingTable from '../components/LoadingTable';
import CustomerService from "../../../services/CustomerService.ts";

type ContextType =
    {
        changePageName: (page: string, grouppage: string) => void;
    };

const SettingsCustomer: React.FC = () => {
    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [data, setData] = useState<PacketInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [form] = Form.useForm();
    const [formSearch] = Form.useForm();
    const defautForm: PacketInterface = {};
    const [formData] = useState<PacketInterface>(defautForm);
    const [formDataSearch] = useState<PacketInterface>(defautForm);
    const [modal2Open, setModal2Open] = useState(false);
    const { changePageName } = useOutletContext<ContextType>();
    React.useEffect(() => {
        changePageName(t('navleft.packet'), t('navleft.settings'));
    }, [changePageName]);
    const columns: TableColumnsType<PacketInterface> =
        [
            {
                title: 'Tên Gói Tin',
                dataIndex: 'name',
                key: 'name',

            },
            {
                title: 'Mã Hex',
                dataIndex: 'hex_symbols',
                key: 'hex_symbols',
            },
            {
                title: 'Mô Tả',
                dataIndex: 'description',
                key: 'description',
            },
            {
                title: 'Loại',
                dataIndex: 'type',
                key: 'type',
                render: (_, record) =>
                    data.length >= 1 ?
                        (
                            <>
                                <p>{record.type == 1 ? 'Command' : 'Kiểu Dữ Liệu'}</p>
                            </>
                        ) : null,
            },
            {
                title: t('status'),
                dataIndex: 'isdelete',
                key: 'isdelete',
                render: (_, record) =>
                    data.length >= 1 ?
                        (
                            <>
                                <p style={{ color: record.isdelete ? '#ff0000' : '#2eb82e' }}>{record.isdelete ? t('lock') : t('active')}</p>
                            </>
                        ) : null,
            },
            {
                title: t('action'),
                dataIndex: 'operation',
                width: '15%',
                render: (_, record) =>
                    data.length >= 1 ? (
                        <>
                            <Flex gap="small" wrap>
                                <Button color="primary" variant="solid" icon={<EditOutlined />} onClick={() => showModal(record._id ?? 0)}>
                                    {t('edit')}
                                </Button>
                                <Popconfirm title={`${t('sure_to')} ${record.isdelete ? t('un_loock') : t('lock')}  ?`} onConfirm={() => handleLoockUnLoock(record._id ?? 0)}>
                                    <Button color={!record.isdelete ? 'danger' : 'default'} variant="solid" icon={<DeleteOutlined />}>
                                        {record.isdelete ? t('un_loock') : t('lock')}
                                    </Button>
                                </Popconfirm>
                            </Flex>
                        </>
                    ) : null,
            },
        ];
    const fetchData = async () => {
        try {
            const response: any = await PacketService.GetDataPacket({});
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    const showModal = async (id: React.Key) => {
        const index = data.findIndex((item) => id === item._id);
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
            const response: any = await PacketService.PostDataSettingsPacket(values);
            const dataRes = response.data.data;
            const newData = [...data];
            const index = newData.findIndex((item) => item._id === dataRes._id);
            if (index >= 0) {
                const updatedItem = { ...newData[index], ...values };
                newData.splice(index, 1, updatedItem);
            } else {
                newData.unshift(dataRes);
            }
            setData(newData);
            message.success(t('errorCode.' + response.data.message));
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
            console.log(values);
        } catch (errorInfo) {
            console.error("Validation Failed:", errorInfo);
        }
    };
    const handleLoockUnLoock = async (key: React.Key) => {
        const loadingMessage = message.loading('Loading...', 0);
        try {
            const dataPost = {
                'id': key
            }
            const response: any = await CustomerService.LookCustomers(dataPost);
            const newData = [...data];
            const index = newData.findIndex((item) => key === item._id);
            const item = newData[index];
            const itemNew = item;
            itemNew.isdelete = !(newData[index].isdelete);
            newData.splice(index, 1, {
                ...item,
                ...itemNew,
            });
            setData(newData);
            message.success(t('errorCode.' + response.data.message));
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
    return (
        <>
            <div className="card">
                <div className="card-header">
                    <Flex gap="small" wrap>
                        <Button size={'large'} icon={<ReloadOutlined />} color="default" variant="dashed" onClick={() => handleReloadData()}>
                            {t('reload')}
                        </Button>
                        <Button type="primary" size={'large'} icon={<FileAddOutlined />} onClick={() => showModal(0)}>
                            Thêm Mới Gói Tin Truyền Nhận
                        </Button>
                        <Button size={'large'} icon={<FilterOutlined />} onClick={() => setModal2Open(true)}>
                            {t('search')}
                        </Button>
                    </Flex>
                </div>
                <div className="card-body">
                    {loading ? (
                        <LoadingTable />
                    ) : (
                        <Table
                            rowKey="_id"
                            columns={columns}
                            dataSource={data}
                            bordered
                        />
                    )}
                </div>
            </div>
            <Modal title='Thêm Mới Gói Tin Truyền Nhận' open={isModalVisible} onCancel={handleCancel}
                footer={() => (
                    <>
                        <Button onClick={handleCancel}>{t('cancel')}</Button>
                        <Button color="primary" variant="solid" onClick={handleOk}>{t('ok')}</Button>
                    </>
                )}>
                <Form form={form} layout="vertical" name="modal_form" initialValues={formData}>
                    <Form.Item label='id' name="_id" className="d-none"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item label='Tên Gói Tin' name="name"
                        rules={[
                            { required: true, message: `${t('please_input_your')} Tên Gói Tin !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} Tên Gói Tin`} />
                    </Form.Item>
                    <Form.Item label='Mã Hex' name="hex_symbols"
                        rules={[
                            { required: true, message: `${t('please_input_your')} Mã Hex !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} Mã Hex`} />
                    </Form.Item>
                    <Form.Item label='Mô Tả' name="description"
                        rules={[
                            { required: true, message: `${t('please_input_your')} Mô Tả !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} Mô Tả`} />
                    </Form.Item>
                    <Form.Item label={t('type')} name="type"
                        rules={[
                            { required: true, message: "Please input your status!" },
                        ]}
                    >
                        <Radio.Group>
                            <Radio value={1}>Command</Radio>
                            <Radio value={2}>Kiểu Dữ Liệu</Radio>
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
                <Form form={formSearch} layout="vertical" name="modal_form" initialValues={formDataSearch}>
                    <Form.Item label='Mã Hex' name="hex_symbols">
                        <Input placeholder={`${t('enter_your')} Mã Hex`} />
                    </Form.Item>
                    <Form.Item label={t('type')} name="type">
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%' }}
                            options={
                                [
                                    {
                                        'label': 'Command',
                                        'value': 1,
                                    },
                                    {
                                        'label': 'Kiểu Dữ Liệu',
                                        'value': 2,
                                    }
                                ]
                            }
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default SettingsCustomer;