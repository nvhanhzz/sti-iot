import React, { useContext, useEffect, useRef, useState } from 'react';
import type { GetRef, InputRef, TableProps } from 'antd';
import { Button, Form, Input, Popconfirm, Table, Modal, Flex, message } from 'antd';
import { IotCMDFieldInterface } from '../../../interface/SettingInterface';
import CMDService from '../../../services/CMDService';
import LoadingTable from '../components/LoadingTable';
import { useTranslation } from 'react-i18next';
import { uid } from 'uid';
type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);
interface EditableRowProps {
    index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

interface EditableCellProps {
    title: React.ReactNode;
    editable: boolean;
    dataIndex: keyof IotCMDFieldInterface;
    record: IotCMDFieldInterface;
    handleSave: (record: IotCMDFieldInterface) => void;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<InputRef>(null);
    const form = useContext(EditableContext)!;

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
        }
    }, [editing]);

    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    const save = async () => {
        try {
            const values = await form.validateFields();
            toggleEdit();
            handleSave({ ...record, ...values });
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{ margin: 0 }}
                name={dataIndex}
                rules={[{ required: true, message: `${title} is required.` }]}
            >
                <Input ref={inputRef} onPressEnter={save} onBlur={save} />
            </Form.Item>
        ) : (
            <div
                className="editable-cell-value-wrap"
                style={{ paddingInlineEnd: 24 }}
                onClick={toggleEdit}
            >
                {children}
            </div>
        );
    }

    return <td {...restProps}>{childNode}</td>;
};

type ColumnTypes = Exclude<TableProps<IotCMDFieldInterface>['columns'], undefined>;


interface ChildrenProps {
    modal3Open: boolean;
    handleCancelIotCmdField: () => void;
    idIotCmdField: React.Key
}

const SettingsIotCmdField: React.FC<ChildrenProps> = ({ modal3Open, handleCancelIotCmdField, idIotCmdField }) => {
    const { t } = useTranslation();
    const [data, setData] = useState<IotCMDFieldInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [form] = Form.useForm();
    const defautForm: IotCMDFieldInterface = {};
    const [formData] = useState<IotCMDFieldInterface>(defautForm);
    const [modal4Open, setModal4Open] = useState(false);
    const handleDelete = (key: React.Key) => {
        if (key) {
            const newData = data.filter((item) => item.id !== key);
            setData(newData);
        }
    };
    const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
        {
            title: t('cmd.field'),
            dataIndex: 'name',
            width: '30%',
        },
        {
            title: t('cmd.description'),
            dataIndex: 'decriptions',
        },
        {
            title: t('action'),
            dataIndex: 'operation',
            render: (_, record) =>
                data.length >= 1 ? (
                    <Popconfirm title={`${t('sure_to')} ${t('delete')}`} onConfirm={() => handleDelete(record.id ?? 0)}>
                        <a style={{ color: 'red' }}>{t('delete')}</a>
                    </Popconfirm>
                ) : null,
        },
    ];

    const handleAdd = () => {
        setModal4Open(true);
    };

    const handleSave = (row: IotCMDFieldInterface) => {
        const newData = [...data];
        const index = newData.findIndex((item) => row.id === item.id);
        const item = newData[index];
        newData.splice(index, 1, {
            ...item,
            ...row,
        });
        setData(newData);
    };

    const components = {
        body: {
            row: EditableRow,
            cell: EditableCell,
        },
    };

    const columns = defaultColumns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record: IotCMDFieldInterface) => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
                handleSave,
            }),
        };
    });
    const fetchData = async () => {
        try {
            const { current, pageSize } = pagination;
            const objpaginate = {
                cmd_id: idIotCmdField,
                page: current,
                limit_page: pageSize,
            };
            const response: any = await CMDService.GetDataIotCMDField({
                ...objpaginate
            });
            setData(response.data.listIotCmdField);
            setPagination((prev) => ({
                ...prev,
                total: response.data.totalRecords,
            }));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [idIotCmdField, pagination.current, pagination.pageSize]);
    const handleTableChange = (current: number, pageSize: number) => {
        setPagination({
            ...pagination,
            current: current,
            pageSize: pageSize,
        });
    };
    const handleReloadData = () => {
        setLoading(true);
        fetchData();
    };
    const handleChooseData = async () => {
        const values = await form.validateFields();
        console.log(values);
        const field_name = values.name;
        // if (field_name != idIotCmdField) {
            const index = data.findIndex((item) => field_name === item.name);
            if (index == -1) {
                const newData: IotCMDFieldInterface = {
                    id: uid(),
                    name: values.name,
                    decriptions: values.decriptions,
                };
                setData([...data, newData]);
                form.resetFields();
                setModal4Open(false);
            }
            else {
                message.error(t('errorCodeSystem.2'));
            }
        // }
        // else {
        //     message.error(t('errorCodeSystem.1'));
        // }
    };
    const handleCancelChoose = () => {
        form.resetFields();
        setModal4Open(false);
    };
    const handleSaveIotCmdField = async () => {
        const loadingMessage = message.loading('Loading...', 0);
        try {
            const dataPost = {
                'cmd_id': idIotCmdField,
                'cmd_field': data
            };
            const response: any = await CMDService.PostDataSettingsIotCMDField(dataPost);
            message.success(t('errorCode.' + response.data.message));
            form.resetFields();
        } catch (errorInfo: any) {
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || 'Something went wrong';
            message.error(t('errorCode.' + errorMessage));
        } finally {
            loadingMessage();
        }
    };
    return (
        <Modal
            title={t('cmd.field')}
            centered
            open={modal3Open}
            width={1000}
            onCancel={handleCancelIotCmdField}
            footer={() => (
                <>
                    <Button onClick={() => handleCancelIotCmdField()}>{t('cancel')}</Button>
                    <Button color="primary" variant="solid" onClick={() => handleSaveIotCmdField()}>{t('save')}</Button>
                </>
            )}>
            <hr />
            <Flex gap="small" wrap>
                <Button size={'large'} color="default" variant="dashed" onClick={() => handleReloadData()}>
                    {t('reload')}
                </Button>
                <Button size={'large'} onClick={handleAdd} type="primary">
                    {t('cmd.field')}
                </Button>
                <Modal
                    title={t('cmd.field')}
                    style={{ top: 20 }}
                    open={modal4Open}
                    onCancel={handleCancelChoose}
                    footer={() => (
                        <>
                            <Button color="primary" variant="solid" onClick={() => handleChooseData()}>{t('choose')}</Button>
                        </>
                    )}>
                    <hr />
                    <Form form={form} layout="vertical" name="modal_form" initialValues={formData}>
                        <Form.Item label={t('cmd.field')} name='name'
                            rules={[
                                { required: true, message: `${t('please_input_your')} Tên Trường Dữ Liệu !` },
                            ]}
                        >
                            <Input placeholder={`${t('enter_your')} ${t('cmd.field')}`} />
                        </Form.Item>
                        <Form.Item label={t('cmd.description')} name='decriptions'>
                            <Input placeholder={`${t('enter_your')} ${t('cmd.description')}`} />
                        </Form.Item>
                    </Form>
                </Modal>
            </Flex>
            <br />
            {loading ? (
                <LoadingTable />
            ) : (
                <Table<IotCMDFieldInterface>
                    rowKey="id"
                    components={components}
                    rowClassName={() => 'editable-row'}
                    bordered
                    dataSource={data}
                    columns={columns as ColumnTypes}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        pageSizeOptions: ['10', '20', '30', '50'],
                        showSizeChanger: true,
                        onChange: (current, pageSize) => handleTableChange(current, pageSize),
                    }}
                />
            )}
        </Modal>

    );
};

export default SettingsIotCmdField;