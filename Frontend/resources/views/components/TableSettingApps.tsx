import React, { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GetRef, InputRef, TableProps } from 'antd';
import { Button, Form, Input, Popconfirm, Table, } from 'antd';
import AppService from '../../../services/AppService';
import { AppItemsType } from '../../../interface/AppInterface';
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
    dataIndex: keyof AppItemsType;
    record: AppItemsType;
    handleSave: (record: AppItemsType) => void;
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
type ColumnTypes = Exclude<TableProps<AppItemsType>['columns'], undefined>;

interface ChildProps {
    dataApps: any;
    updateMenu: (data: any) => void;
}

const TableSettingApps: React.FC<ChildProps> = ({ dataApps, updateMenu }) => {
    const { t } = useTranslation();
    const [dataSource, setDataSource] = useState<AppItemsType[]>(dataApps);

    const handleActive = async (key: React.Key) => {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => key === item.id);
        const item = newData[index];
        const itemNew = item;
        itemNew.status = !(newData[index].status);
        newData.splice(index, 1, {
            ...item,
            ...itemNew,
        });
        const response = await AppService.updateDataApps(itemNew);
        if (response.status == 200) {
            setDataSource(newData);
            updateMenu(newData);
        }
    };

    const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
        {
            title: 'name',
            dataIndex: 'name',
            editable: true,
        },
        {
            title: 'decription',
            dataIndex: 'decription',
            editable: true,
        },
        {
            title: 'img',
            dataIndex: 'img',
            render: (_, record) =>
                dataSource.length >= 1 ? (
                    <>
                        <img src={record.img} alt="User-Profile-Image" style={{ width: '50px' }} />
                    </>
                ) : null,
        },
        {
            title: 'url',
            dataIndex: 'url',
            editable: true,
        },
        {
            title: 'status',
            dataIndex: 'status',
            render: (_, record) =>
                dataSource.length >= 1 ? (
                    <>
                        <p>{t('status')} : <span style={record.status ? { color: 'green' } : { color: 'red' }}>{record.status ? t('availability') : t('not_available')}</span></p>
                        <Popconfirm title={!record.status ? t('how_enable') : t('how_disable')} onConfirm={() => handleActive(record.id)}>
                            <Button type={record.status ? "default" : "dashed"}>
                                {record.status ? t('disable') : t('enable')}
                            </Button>
                        </Popconfirm>
                    </>
                ) : null,
        },
    ];

    const handleSave = async (row: AppItemsType) => {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => row.id === item.id);
        const item = newData[index];
        newData.splice(index, 1, {
            ...item,
            ...row,
        });
        const response = await AppService.updateDataApps(row);
        if (response.status == 200) {
            setDataSource(newData);
            updateMenu(newData);
        }
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
            onCell: (record: AppItemsType) => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
                handleSave,
            }),
        };
    });

    return (
        <div>
            <Table<AppItemsType>
                components={components}
                rowClassName={() => 'editable-row'}
                bordered
                dataSource={dataSource}
                columns={columns as ColumnTypes}
            />
        </div>
    );
};

export default TableSettingApps;