import React, { useEffect, useState } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { FileAddOutlined, EditOutlined, DeleteOutlined, FilterOutlined, ReloadOutlined, DeleteColumnOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Input, Table, Flex, Modal, Form, Radio, message, Popconfirm, Select } from 'antd';
import { IotCMDInterface } from '../../../interface/SettingInterface';
import LoadingTable from '../components/LoadingTable';
import CMDService from '../../../services/CMDService';
import PaginatedSearchSelect from '../components/PaginatedSearchSelect';
import SettingsIotCmdField from './SettingsIotCmdField';

type ContextType =
    {
        changePageName: (page: string, grouppage: string) => void;
    };

const SettingsCMD: React.FC = () => {
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
    const [idIotCmdField, setidIotCmdField] = useState<React.Key>(0);
    const [modal3Open, setModal3Open] = useState(false);

    React.useEffect(() => {
        changePageName(t('CMD Type'), t('navleft.settings'));
    }, [changePageName]);

    const columns: TableColumnsType<IotCMDInterface> =
        [
            {
                title: t('cmd.name'),
                dataIndex: 'name',
                key: 'name',

            },
            {
                title: 'Hex',
                dataIndex: 'hex_symbols',
                key: 'hex_symbols',

            },
            {
                title: t('cmd.description'),
                dataIndex: 'decriptions',
                key: 'decriptions',
            },
            {
                title: t('cmd.note'),
                dataIndex: 'note',
                key: 'note',
            },
            {
                title: t('cmd.type'),
                dataIndex: 'type',
                key: 'type',
                render: (_, record) =>
                    data.length >= 1 ?
                        (
                            <>
                                <p>{record.type == 1 ? t('cmd.type_1') : t('cmd.type_2')}</p>
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
                render: (_, record: any) =>
                    data.length >= 1 ? (
                        <>
                            <Flex gap="small" wrap>
                                <Button color="default" variant="dashed" icon={<DeleteColumnOutlined />} onClick={() => showModalIotCmdField(record.id ?? 0)}>
                                    {t('cmd.field')}
                                </Button>
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
            const response: any = await CMDService.GetDataCMD({});
            setData(response.data.data);
            setDataAll(response.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [formDataSearch]);

    const showModalIotCmdField = async (id: React.Key) => {
        setidIotCmdField(id);
        setModal3Open(true);
    };
    const handleCancelIotCmdField = () => {
        setModal3Open(false);
    };

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
            const response: any = await CMDService.PostDataUpdateCMD(values);
            const newData = [...data];
            const index = newData.findIndex((item) => item.id === values.id);
            if (index >= 0) {
                const updatedItem = { ...newData[index], ...values };
                newData.splice(index, 1, updatedItem);
            } else {
                newData.unshift(values);
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
            const result = dataAll.filter(item => {
                const matchName = values.name?.length ? values.name.includes(item.name) : true;
                const matchType = values.type?.length ? values.type.includes(item.type) : true;
                const matchHex = values.hex_symbols?.length ? values.hex_symbols.includes(item.hex_symbols) : true;
                return matchName && matchType && matchHex;
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
            const response: any = await CMDService.LockIotCMD(dataPost);
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
            <Modal
                title={t('cmd.create')}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={() => (
                    <>
                        <Button onClick={handleCancel}>{t('cancel')}</Button>
                        <Button color="primary" variant="solid" onClick={handleOk}>{t('ok')}</Button>
                    </>
                )}
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="modal_form"
                    initialValues={formData}
                >
                    <Form.Item label='id' name="id" className="d-none">
                        <Input />
                    </Form.Item>
                    <Form.Item label={t('cmd.name')} name='name'
                        rules={[
                            { required: true, message: `${t('please_input_your')} ${t('cmd.name')} !` },
                        ]}>
                        <Input placeholder={`${t('enter_your')} ${t('cmd.name')}`} />
                    </Form.Item>
                    <Form.Item label='Hex' name='hex_symbols'
                        rules={[
                            { required: true, message: `${t('please_input_your')} Hex !` },
                        ]}>
                        <Input placeholder={`${t('enter_your')} Hex`} />
                    </Form.Item>
                    <Form.Item label={t('description')} name='decriptions'>
                        <Input placeholder={`${t('enter_your')} ${t('description')}`} />
                    </Form.Item>
                    <Form.Item label={t('note')} name="note"
                        rules={[
                            { message: `${t('please_input_your')} ${t('note')} !` },
                        ]}>
                        <Input placeholder={`${t('enter_your')} ${t('note')}`} />
                    </Form.Item>
                    <Form.Item label={t('cmd.type')} name='type'
                        rules={[
                            { required: true, message: `${t('please_choose_your')} !` },
                        ]}>
                        <Radio.Group>
                            <Radio value={1}>{t('cmd.type_1')}</Radio>
                            <Radio value={2}>{t('cmd.type_2')}</Radio>
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
                    <Form.Item label={t('cmd.name')} name="name">
                        <PaginatedSearchSelect columns="name" table='iot_cmd' />
                    </Form.Item>
                    <Form.Item label={t('hex')} name="hex_symbols">
                        <PaginatedSearchSelect columns="hex_symbols" table='iot_cmd' />
                    </Form.Item>
                    <Form.Item label={t('type')} name="type">
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%' }}
                            options={
                                [
                                    {
                                        'label': 'Lệnh Từ IOT',
                                        'value': 1,
                                    },
                                    {
                                        'label': 'Lệnh Từ Server',
                                        'value': 2,
                                    }
                                ]
                            }
                        />
                    </Form.Item>
                </Form>
            </Modal>
            <SettingsIotCmdField idIotCmdField={idIotCmdField} modal3Open={modal3Open} handleCancelIotCmdField={handleCancelIotCmdField} />
        </>
    );
};

export default SettingsCMD;