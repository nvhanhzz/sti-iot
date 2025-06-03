import React, { useEffect, useState } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { FileAddOutlined, EditOutlined, DeleteOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Input, Table, Flex, Modal, Form, message, Popconfirm } from 'antd';
import { PayloadTypeInterface } from '../../../interface/SettingInterface';
import LoadingTable from '../components/LoadingTable';
import PayloadTypeService from '../../../services/PayloadTypeSevice';
import PaginatedSearchSelect from '../components/PaginatedSearchSelect';

type ContextType =
    {
        changePageName: (page: string, grouppage: string) => void;
    };

const SettingsPayloadType: React.FC = () => {
    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [dataAll, setDataAll] = useState<PayloadTypeInterface[]>([]);
    const [data, setData] = useState<PayloadTypeInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [form] = Form.useForm();
    const [formSearch] = Form.useForm();
    const defautForm: PayloadTypeInterface = {};
    const [formData] = useState<PayloadTypeInterface>(defautForm);
    const [formDataSearch, setformDataSearch] = useState<PayloadTypeInterface>(defautForm);
    const [modal2Open, setModal2Open] = useState(false);
    const { changePageName } = useOutletContext<ContextType>();

    React.useEffect(() => {
        changePageName(t('payload_type.all'), t('navleft.settings'));
    }, [changePageName]);

    const columns: TableColumnsType<PayloadTypeInterface> =
        [
            {
                title: t('payload_type.name'),
                dataIndex: 'name',
                key: 'name',

            },
            {
                title: t('Hex'),
                dataIndex: 'hex_symbols',
                key: 'hex_symbols',
            },
            {
                title: t('payload_type.description'),
                dataIndex: 'decriptions',
                key: 'decriptions',
            },
            {
                title: t('payload_type.js_symbols'),
                dataIndex: 'js_type',
                key: 'js_type',
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
                render: (_, record: any) =>
                    data.length >= 1 ? (
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
                    ) : null,
            },
        ];
    const fetchData = async () => {
        try {
            const response: any = await PayloadTypeService.GetDataPayloadType({});
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
            const response: any = await PayloadTypeService.PostDataUpdatePayloadType(values);
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
            const result = dataAll.filter(item => {
                const matchName = values.name?.length ? values.name.includes(item.name) : true;
                const matchJsType = values.js_type?.length ? values.js_type.includes(item.js_type) : true;
                const matchHex = values.hex_symbols?.length ? values.hex_symbols.includes(item.hex_symbols) : true;
                return matchName && matchJsType && matchHex;
            });
            setData(result);
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
            const response: any = await PayloadTypeService.LockPayloadType(dataPost);
            const newData = [...data];
            const index = newData.findIndex((item) => key === item.id);
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
                            {t('cmd.create')}
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
                            rowKey="id"
                            columns={columns}
                            dataSource={data}
                            bordered
                        />
                    )}
                </div>
            </div>
            <Modal title='Thêm Mới Gói Tin Truyền Nhận'
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
                    <Form.Item label='id' name="id" className="d-none">
                        <Input />
                    </Form.Item>
                    <Form.Item label={t('payload_type.name')} name="name"
                        rules={[
                            { required: true, message: `${t('please_input_your')} ${t('payload_type.name')} !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('payload_type.name')}`} />
                    </Form.Item>
                    <Form.Item label={t('hex_symbols')} name="hex_symbols"
                        rules={[
                            { required: true, message: `${t('please_input_your')} ${t('hex_symbols')} !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('hex_symbols')}`} />
                    </Form.Item>
                    <Form.Item label={t('payload_type.description')} name="decriptions"
                        rules={[
                            { required: true, message: `${t('please_input_your')} ${t('payload_type.description')} !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('payload_type.description')}`} />
                    </Form.Item>
                    <Form.Item label={t('payload_type.js_symbols')} name="js_type"
                        rules={[
                            { required: true, message: `${t('please_input_your')} ${t('payload_type.js_symbols')} !` },
                        ]}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('payload_type.js_symbols')}`} />
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
                    <Form.Item label={t('payload_type.name')} name="name">
                        <PaginatedSearchSelect columns="name" table='payload_type' />
                    </Form.Item>
                    <Form.Item label='Mã Hex' name="hex_symbols">
                        <PaginatedSearchSelect columns="hex_symbols" table='payload_type' />
                    </Form.Item>
                    <Form.Item label='Mã Js' name="js_type">
                        <PaginatedSearchSelect columns="js_type" table='payload_type' />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default SettingsPayloadType;