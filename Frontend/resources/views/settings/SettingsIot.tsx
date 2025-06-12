import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { TbPlugConnectedX, TbPlugConnected } from "react-icons/tb";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import type { TableColumnsType } from 'antd';
import { Button, Input, Table, Flex, Popconfirm, Popover, Form, message, Row, Col } from 'antd'; // Xóa Modal
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
    // Thêm các trường dữ liệu khác cần thiết từ API nếu chưa có
}

const SettingsIot: React.FC = () => {
    const socket = useSocket();
    const { t } = useTranslation();
    const [dataAll, setDataAll] = useState<ExtendedIotInterface[]>([]);
    const [data, setData] = useState<ExtendedIotInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchName, setSearchName] = useState<string>('');
    const [searchMac, setSearchMac] = useState<string>('');
    const [form] = Form.useForm(); // Form cho chỉnh sửa nội tuyến
    const [editingKey, setEditingKey] = useState<React.Key>(''); // Thêm editingKey để theo dõi hàng đang chỉnh sửa
    const { changePageName } = useOutletContext<ContextType>();

    useEffect(() => {
        changePageName(t('navleft.device_iot'), t('navleft.settings'));
    }, [changePageName, t]);

    // --- Logic cho Inline Editing ---
    const isEditing = (record: ExtendedIotInterface) => record.id === editingKey;

    const edit = (record: ExtendedIotInterface) => {
        form.setFieldsValue({ ...record });
        // @ts-ignore
        setEditingKey(record.id);
    };

    const cancel = () => {
        setEditingKey('');
    };

    const save = async (id: React.Key) => {
        const loadingMessage = message.loading('Loading...', 0);
        try {
            const row = (await form.validateFields()) as ExtendedIotInterface;
            const updatedValues = { ...row, id: id }; // Đảm bảo ID được gửi đi

            const response: any = await IotService.PostDataUpdateIots(updatedValues);
            const resData = response?.data;

            if (resData?.data) {
                const resDataNew = resData.data;

                // Cập nhật state data và dataAll
                const newData = [...data];
                const newAllData = [...dataAll];

                const index = newData.findIndex(item => id === item.id);
                const allIndex = newAllData.findIndex(item => id === item.id);

                if (index > -1) {
                    newData[index] = { ...newData[index], ...resDataNew };
                    setData(newData);
                }
                if (allIndex > -1) {
                    newAllData[allIndex] = { ...newAllData[allIndex], ...resDataNew };
                    setDataAll(newAllData);
                }

                setEditingKey(''); // Kết thúc chỉnh sửa
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
    // --- End Logic for Inline Editing ---

    // @ts-ignore
    const columns: TableColumnsType<ExtendedIotInterface> = [
        {
            title: 'STT', // Cột số thứ tự
            key: 'stt',
            width: '5%',
            render: (_text, _record, index) => index + 1,
        },
        {
            title: t('iots.name'),
            dataIndex: 'name',
            key: 'name',
            editable: true, // Đánh dấu là có thể chỉnh sửa
            render: (text, record: ExtendedIotInterface) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="name"
                        rules={[{ required: true, message: `${t('please_input_your')} ${t('iots.name')} !` }]}
                        style={{ margin: 0 }}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('iots.name')}`} />
                    </Form.Item>
                ) : (
                    text
                );
            },
        },
        {
            title: t('iots.mac'),
            dataIndex: 'mac',
            key: 'mac',
            editable: true, // Đánh dấu là có thể chỉnh sửa
            render: (text, record: ExtendedIotInterface) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="mac"
                        rules={[{ required: true, message: `${t('please_input_your')} ${t('iots.mac')} !` }]}
                        style={{ margin: 0 }}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('iots.mac')}`} />
                    </Form.Item>
                ) : (
                    text
                );
            },
        },
        {
            title: t('iots.firmware'),
            dataIndex: 'firmware',
            key: 'firmware',
            editable: true, // Đánh dấu là có thể chỉnh sửa
            render: (text, record: ExtendedIotInterface) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="firmware"
                        // rules={[{ required: true, message: `${t('please_input_your')} ${t('iots.firmware')} !` }]} // Firmware có thể không bắt buộc
                        style={{ margin: 0 }}
                    >
                        <Input placeholder={`${t('enter_your')} ${t('iots.firmware')}`} />
                    </Form.Item>
                ) : (
                    text
                );
            },
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
            render: (_, record: ExtendedIotInterface) => {
                const editable = isEditing(record);
                return editable ? (
                    <Flex gap="small" wrap>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={() => save(record.id)}
                        >
                            {t('save')}
                        </Button>
                        <Popconfirm title='Xác nhận hủy?' onConfirm={cancel}>
                            <Button
                                icon={<CloseOutlined />}
                            >
                                {t('cancel')}
                            </Button>
                        </Popconfirm>
                    </Flex>
                ) : (
                    <Flex gap="small" wrap>
                        <Button
                            color="primary"
                            variant="solid"
                            icon={<EditOutlined />}
                            onClick={() => edit(record)}
                            disabled={editingKey !== ''} // Không cho phép sửa khi một hàng khác đang được sửa
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
                );
            },
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
        setEditingKey(''); // Đảm bảo hủy mọi chỉnh sửa khi refresh
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
            // Khi có thiết bị mới từ socket, thêm vào cả data và dataAll
            setDataAll((prevData) => [eventData, ...prevData]);
            setData((prevData) => [eventData, ...prevData]); // Thêm vào data hiển thị để nó xuất hiện ngay
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
        // Chỉ emit khi dataAll đã có dữ liệu ban đầu
        if (socket && dataAll.length > 0) {
            socket.emit("iot:iot_status");
        }
    }, [socket, dataAll]); // Dependency dataAll để đảm bảo emit sau khi fetch data

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
                            <h3 style={{ marginBottom: '30px' }}>Danh sách thiết bị</h3>
                            <Form form={form} component={false}> {/* Form bao bọc Table */}
                                <Table
                                    rowKey="id"
                                    columns={columns}
                                    dataSource={data}
                                    bordered
                                    pagination={false}
                                    // Thêm logic để hợp nhất các hàng có thể chỉnh sửa
                                    components={{
                                        body: {
                                            cell: EditableCell,
                                        },
                                    }}
                                    rowClassName="editable-row"
                                />
                            </Form>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

// Component helper cho Editable Cell, cần thiết cho Form.Item
interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
    editing: boolean;
    dataIndex: string;
    title: any;
    inputType: 'number' | 'text';
    children: React.ReactNode;
    rules?: any[];
}

const EditableCell: React.FC<EditableCellProps> = ({
                                                       editing,
                                                       dataIndex,
                                                       title,
                                                       inputType,
                                                       children,
                                                       rules,
                                                       ...restProps
                                                   }) => {
    const inputNode = inputType === 'number' ? <Input type="number" /> : <Input />;
    return (
        <td {...restProps}>
            {editing ? (
                <Form.Item
                    name={dataIndex}
                    style={{ margin: 0 }}
                    rules={rules}
                >
                    {inputNode}
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};


export default SettingsIot;