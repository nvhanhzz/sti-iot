import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    SearchOutlined,
    SaveOutlined
} from '@ant-design/icons';
import { TbPlugConnectedX, TbPlugConnected } from "react-icons/tb";
import { LuFileOutput, LuFileInput } from "react-icons/lu";
import type { TableColumnsType } from 'antd';
import {
    Button,
    Input,
    Table,
    Flex,
    Popconfirm,
    Popover,
    Form,
    message,
    Row,
    Col,
    Modal,
    Divider,
    InputNumber,
    Select
} from 'antd';
import { IotCMDInterface } from '../../../interface/SettingInterface';
import LoadingTable from '../components/LoadingTable';
import IotService from '../../../services/IotService';
import { useSocket } from '../../../context/SocketContext';

type ContextType = {
    changePageName: (page: string, grouppage: string) => void;
};

interface IotConfig {
    SSID?: string;
    PW?: string;
    IP?: string;
    GATEWAY?: string;
    SUBNET?: string;
    DNS?: string;
}

interface RS485Addresses {
    ID?: number;
    Address?: string;
}

interface RS485Config {
    baudrate?: number;
    serialConfig?: string;
}

interface RS232Config {
    baudrate?: number;
    serialConfig?: string;
}

interface ExtendedIotInterface extends IotCMDInterface {
    connected?: boolean;
    input?: boolean;
    output?: boolean;
    mac?: string;
    wifi?: IotConfig;
    can?: {
        baudrate?: number;
    };
    mqtt?: IotConfig & { MAC?: string };
    ethernet?: IotConfig & { MAC?: string };
    rs485Addresses?: RS485Addresses;
    rs485Config?: RS485Config;
    rs232Config?: RS232Config;
    version?: string;
}

const { Option } = Select;

const SettingsIot: React.FC = () => {
    const socket = useSocket();
    const { t } = useTranslation();
    const [dataAll, setDataAll] = useState<ExtendedIotInterface[]>([]);
    const [data, setData] = useState<ExtendedIotInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchName, setSearchName] = useState<string>('');
    const [searchMac, setSearchMac] = useState<string>('');
    const { changePageName } = useOutletContext<ContextType>();

    const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
    const [currentEditingRecord, setCurrentEditingRecord] = useState<ExtendedIotInterface | null>(null);

    const [basicInfoForm] = Form.useForm();
    const [wifiForm] = Form.useForm();
    const [ethernetForm] = Form.useForm();
    const [mqttForm] = Form.useForm();
    const [rs485Form] = Form.useForm();
    const [rs232Form] = Form.useForm();
    const [canForm] = Form.useForm();
    const [versionForm] = Form.useForm();

    useEffect(() => {
        changePageName(t('navleft.device_iot'), t('navleft.settings'));
    }, [changePageName, t]);

    const handleEditRecord = (record: ExtendedIotInterface) => {
        setCurrentEditingRecord(record);
        basicInfoForm.setFieldsValue(record);
        wifiForm.setFieldsValue(record.wifi);
        ethernetForm.setFieldsValue(record.ethernet);
        mqttForm.setFieldsValue(record.mqtt);
        rs485Form.setFieldsValue({
            rs485Addresses: record.rs485Addresses,
            rs485Config: record.rs485Config
        });
        rs232Form.setFieldsValue(record.rs232Config);
        canForm.setFieldsValue(record.can);
        versionForm.setFieldsValue({ version: record.version });

        setIsEditModalVisible(true);
    };

    const handleEditModalCancel = () => {
        setIsEditModalVisible(false);
        setCurrentEditingRecord(null);
        basicInfoForm.resetFields();
        wifiForm.resetFields();
        ethernetForm.resetFields();
        mqttForm.resetFields();
        rs485Form.resetFields();
        rs232Form.resetFields();
        canForm.resetFields();
        versionForm.resetFields();
    };

    const handleSaveSection = async (
        formInstance: any,
        sectionName: string,
        dataTransform?: (values: any) => any
    ) => {
        const loadingMessage = message.loading(`Đang lưu ${sectionName}...`, 0);
        try {
            const values = await formInstance.validateFields();
            if (!currentEditingRecord?.id) {
                message.error('ID thiết bị không hợp lệ!');
                return;
            }

            let dataToUpdate: any = {};
            if (dataTransform) {
                dataToUpdate = dataTransform(values);
            } else {
                if (sectionName === 'Thông tin cơ bản') {
                    dataToUpdate = { name: values.name, mac: values.mac };
                } else if (sectionName === 'Cài đặt WiFi') {
                    dataToUpdate = { wifi: values };
                } else if (sectionName === 'Cài đặt Ethernet') {
                    dataToUpdate = { ethernet: values };
                } else if (sectionName === 'Cài đặt MQTT') {
                    dataToUpdate = { mqtt: values };
                } else if (sectionName === 'Cài đặt RS485') {
                    dataToUpdate = {
                        rs485Addresses: values.rs485Addresses,
                        rs485Config: values.rs485Config
                    };
                } else if (sectionName === 'Cài đặt RS232') {
                    dataToUpdate = { rs232Config: values };
                } else if (sectionName === 'Cài đặt CAN') {
                    dataToUpdate = { can: values };
                } else if (sectionName === 'Phiên bản Firmware') {
                    dataToUpdate = { version: values.version };
                }
            }

            const payload = {
                id: currentEditingRecord.id,
                ...currentEditingRecord,
                ...dataToUpdate
            };

            const response: any = await IotService.PostDataUpdateIots(payload);
            const resData = response?.data;

            if (resData?.data) {
                const resDataNew = resData.data;

                const updateData = (prevData: ExtendedIotInterface[]) => {
                    return prevData.map(item =>
                        item.id === currentEditingRecord.id ? { ...item, ...resDataNew } : item
                    );
                };

                setData(updateData);
                setDataAll(updateData);
                setCurrentEditingRecord(prev => prev ? { ...prev, ...resDataNew } : null);

                message.success(`${sectionName} cập nhật thành công!`);
            } else {
                message.error(resData?.message || `Có lỗi xảy ra khi cập nhật ${sectionName}!`);
            }
        } catch (errorInfo: any) {
            console.error(`Lỗi khi lưu ${sectionName}:`, errorInfo);
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || `Có lỗi xảy ra khi lưu ${sectionName}!`;
            message.error(errorMessage);
        } finally {
            loadingMessage();
        }
    };

    const handleSaveBasicInfo = () => handleSaveSection(basicInfoForm, 'Thông tin cơ bản');
    const handleSaveWifi = () => handleSaveSection(wifiForm, 'Cài đặt WiFi');
    const handleSaveEthernet = () => handleSaveSection(ethernetForm, 'Cài đặt Ethernet');
    const handleSaveMqtt = () => handleSaveSection(mqttForm, 'Cài đặt MQTT');
    const handleSaveRs485 = () => handleSaveSection(rs485Form, 'Cài đặt RS485');
    const handleSaveRs232 = () => handleSaveSection(rs232Form, 'Cài đặt RS232');
    const handleSaveCan = () => handleSaveSection(canForm, 'Cài đặt CAN');
    const handleSaveVersion = () => handleSaveSection(versionForm, 'Phiên bản Firmware');

    const columns: TableColumnsType<ExtendedIotInterface> = [
        {
            title: 'STT',
            key: 'stt',
            width: '5%',
            render: (_text, _record, index) => index + 1,
        },
        {
            title: 'Tên thiết bị',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Địa chỉ MAC',
            dataIndex: 'mac',
            key: 'mac',
        },
        {
            title: 'Firmware',
            dataIndex: 'firmware',
            key: 'firmware',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (_, record: ExtendedIotInterface) => (
                <Flex wrap gap="small">
                    <Popover content="Trạng thái kết nối">
                        <Button
                            type="primary"
                            icon={record.connected ? <TbPlugConnected /> : <TbPlugConnectedX />}
                            style={{
                                backgroundColor: record.connected ? '#52c41a' : '#ff4d4f',
                                borderColor: record.connected ? '#52c41a' : '#ff4d4f',
                            }}
                        />
                    </Popover>
                    <Popover content="Đầu vào">
                        <Button
                            type="primary"
                            icon={<LuFileInput />}
                            style={{
                                backgroundColor: record.input ? '#ffff00' : '#ffffff',
                                color: "black"
                            }}
                        />
                    </Popover>
                    <Popover content="Đầu ra">
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
            title: 'Hành động',
            dataIndex: 'operation',
            width: '15%',
            render: (_, record: ExtendedIotInterface) => (
                <Flex gap="small" wrap>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditRecord(record)}
                    >
                        Chỉnh
                    </Button>
                    <Popconfirm
                        title={`Xác nhận ${record.isdelete ? 'mở khóa' : 'khóa'} ?`}
                        onConfirm={() => handleLockUnlock(record.id)}
                        okText="Đồng ý"
                        cancelText="Hủy"
                    >
                        <Button
                            danger={!record.isdelete}
                            style={record.isdelete ? { backgroundColor: '#fff', color: '#000', border: '1px solid #ddd' } : {}}
                            icon={<DeleteOutlined />}
                            disabled={record.isdelete && !record.name}
                        >
                            {record.isdelete ? 'Mở khóa' : 'Khóa'}
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
            console.error('Lỗi khi tải dữ liệu:', error);
            message.error('Lỗi khi tải dữ liệu!');
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
            message.error('ID không hợp lệ!');
            return;
        }

        const loadingMessage = message.loading('Đang xử lý...', 0);
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

                message.success('Thành công!');
            }
        } catch (errorInfo: any) {
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || 'Có lỗi xảy ra!';
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
            setData((prevData) => [eventData, ...prevData]);
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

    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/; // Regex cho MAC

    const firmwareVersions = [
        { value: '1.0.0', label: '1.0.0' },
        { value: '1.0.1', label: '1.0.1' },
        { value: '1.0.2', label: '1.0.2' },
        { value: '2.0.0', label: '2.0.0' },
    ];

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
                                placeholder="Tên thiết bị"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col span={4}>
                            <Input
                                placeholder="Địa chỉ MAC"
                                value={searchMac}
                                onChange={(e) => setSearchMac(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <Flex gap="small" wrap>
                                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                                    Tìm kiếm
                                </Button>
                                <Button onClick={handleClearSearch}>
                                    Xóa tìm kiếm
                                </Button>
                                <Button icon={<ReloadOutlined />} onClick={refreshData}>
                                    Làm mới
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

            {/* Modal chỉnh sửa thiết bị */}
            <Modal
                title="Chỉnh sửa cài đặt thiết bị IoT"
                open={isEditModalVisible}
                onCancel={handleEditModalCancel}
                width={1400}
                footer={null}
                destroyOnClose
                maskClosable={false}
                style={{ top: 10 }}
                // bodyStyle để quản lý cuộn bên trong nếu cần
                bodyStyle={{ maxHeight: 'calc(100vh - 100px)', padding: '10px 24px' }}
            >
                <Row gutter={20}> {/* Giảm gutter để tiết kiệm không gian */}
                    {/* Cột chính 1 (Bên trái) */}
                    <Col span={12}>
                        {/* Form: Thông tin cơ bản */}
                        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}> {/* Giảm margin-bottom */}
                            <Divider orientation="left">Thông tin cơ bản</Divider>
                            <Form form={basicInfoForm} layout="vertical">
                                <Row gutter={16} align="bottom">
                                    <Col span={8}> {/* Tên thiết bị */}
                                        <Form.Item
                                            name="name"
                                            label="Tên thiết bị"
                                            rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="Nhập tên thiết bị" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}> {/* Địa chỉ MAC (disabled) */}
                                        <Form.Item
                                            name="mac"
                                            label="Địa chỉ MAC"
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input disabled placeholder="Địa chỉ MAC cố định" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}> {/* Nút Lưu */}
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveBasicInfo}>
                                                Lưu
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>

                        {/* Form: Cài đặt Ethernet */}
                        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <Divider orientation="left">Cài đặt Ethernet</Divider>
                            <Form form={ethernetForm} layout="vertical">
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item
                                            name="IP"
                                            label="IP"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng IP không hợp lệ!' }]}
                                        >
                                            <Input placeholder="192.168.0.10" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="GATEWAY"
                                            label="Gateway"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng Gateway không hợp lệ!' }]}
                                        >
                                            <Input placeholder="192.168.1.1" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="SUBNET"
                                            label="Subnet"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng Subnet không hợp lệ!' }]}
                                        >
                                            <Input placeholder="255.255.255.0" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16} align="bottom">
                                    <Col span={8}> {/* MAC */}
                                        <Form.Item
                                            name="MAC"
                                            label="Địa chỉ MAC"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập địa chỉ MAC!' }, // Quy tắc bắt buộc
                                                { pattern: macRegex, message: 'Định dạng MAC không hợp lệ!' } // Quy tắc định dạng
                                            ]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="DE:AD:BE:EF:FE:ED" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}> {/* DNS */}
                                        <Form.Item
                                            name="DNS"
                                            label="DNS"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng DNS không hợp lệ!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="8.8.8.8" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}> {/* Nút Lưu */}
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveEthernet}>
                                                Lưu
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>

                        {/* Form: Cài đặt RS485 */}
                        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <Divider orientation="left">Cài đặt RS485</Divider>
                            <Form form={rs485Form} layout="vertical">
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item
                                            name={['rs485Addresses', 'ID']}
                                            label="ID"
                                        >
                                            <InputNumber style={{ width: '100%' }} placeholder="1" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={16}>
                                        <Form.Item
                                            name={['rs485Addresses', 'Address']}
                                            label="Địa chỉ (cách nhau bởi dấu phẩy)"
                                        >
                                            <Input.TextArea rows={2} placeholder="40001,40002,40003,40004,40005" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16} align="bottom">
                                    <Col span={8}>
                                        <Form.Item
                                            name={['rs485Config', 'baudrate']}
                                            label="Baudrate"
                                            rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS485!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <InputNumber style={{ width: '100%' }} placeholder="9600" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name={['rs485Config', 'serialConfig']}
                                            label="Cấu hình Serial"
                                            rules={[{ required: true, message: 'Vui lòng nhập cấu hình Serial!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="8N1" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRs485}>
                                                Lưu
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>

                        {/* Form: Cài đặt RS232 */}
                        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <Divider orientation="left">Cài đặt RS232</Divider>
                            <Form form={rs232Form} layout="vertical">
                                <Row gutter={16} align="bottom">
                                    <Col span={10}>
                                        <Form.Item
                                            name="baudrate"
                                            label="Baudrate"
                                            rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS232!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <InputNumber style={{ width: '100%' }} placeholder="9600" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={10}>
                                        <Form.Item
                                            name="serialConfig"
                                            label="Cấu hình Serial"
                                            rules={[{ required: true, message: 'Vui lòng nhập cấu hình Serial!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="8N1" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}> {/* Đặt nút ở hàng riêng để đảm bảo cân bằng */}
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRs232}>
                                                Lưu
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>
                    </Col>

                    {/* Cột chính 2 (Bên phải) */}
                    <Col span={12}>
                        {/* Form: Cài đặt WiFi */}
                        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <Divider orientation="left">Cài đặt WiFi</Divider>
                            <Form form={wifiForm} layout="vertical">
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item
                                            name="SSID"
                                            label="SSID"
                                            rules={[{ required: true, message: 'Vui lòng nhập SSID!' }]}
                                        >
                                            <Input placeholder="SSID" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="PW"
                                            label="Mật khẩu WiFi"
                                        >
                                            <Input.Password placeholder="Nhập mật khẩu" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="IP"
                                            label="IP"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng IP không hợp lệ!' }]}
                                        >
                                            <Input placeholder="192.168.1.123" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16} align="bottom">
                                    <Col span={7}>
                                        <Form.Item
                                            name="GATEWAY"
                                            label="Gateway"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng Gateway không hợp lệ!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="192.168.1.1" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={7}>
                                        <Form.Item
                                            name="SUBNET"
                                            label="Subnet"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng Subnet không hợp lệ!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="255.255.255.0" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name="DNS"
                                            label="DNS"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng DNS không hợp lệ!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="8.8.8.8" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveWifi}>
                                                Lưu
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>

                        {/* Form: Cài đặt MQTT */}
                        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <Divider orientation="left">Cài đặt MQTT</Divider>
                            <Form form={mqttForm} layout="vertical">
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item
                                            name="MAC"
                                            label="Địa chỉ MAC"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập địa chỉ MAC!' },
                                                { pattern: macRegex, message: 'Định dạng MAC không hợp lệ!' }
                                            ]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="DE:AD:BE:EF:FE:ED" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="IP"
                                            label="IP"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng IP không hợp lệ!' }]}
                                        >
                                            <Input placeholder="192.168.1.235" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="GATEWAY"
                                            label="Gateway"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng Gateway không hợp lệ!' }]}
                                        >
                                            <Input placeholder="192.168.1.1" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16} align="bottom">
                                    <Col span={8}>
                                        <Form.Item
                                            name="SUBNET"
                                            label="Subnet"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng Subnet không hợp lệ!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="255.255.255.0" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="DNS"
                                            label="DNS"
                                            rules={[{ pattern: ipRegex, message: 'Định dạng DNS không hợp lệ!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="8.8.8.8" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveMqtt}>
                                                Lưu
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>

                        {/* Form: Cài đặt CAN */}
                        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <Divider orientation="left">Cài đặt CAN</Divider>
                            <Form form={canForm} layout="vertical">
                                <Row gutter={16} align="bottom">
                                    <Col span={16}>
                                        <Form.Item
                                            name="baudrate"
                                            label="Baudrate"
                                            rules={[{ required: true, message: 'Vui lòng nhập Baudrate CAN!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <InputNumber style={{ width: '100%' }} placeholder="5100" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveCan}>
                                                Lưu
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>

                        {/* Form: Phiên bản Firmware */}
                        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '0px' }}> {/* Loại bỏ margin-bottom cuối cùng */}
                            <Divider orientation="left">Phiên bản Firmware</Divider>
                            <Form form={versionForm} layout="vertical">
                                <Row gutter={16} align="bottom">
                                    <Col span={16}>
                                        <Form.Item
                                            name="version"
                                            label="Phiên bản Firmware"
                                            rules={[{ required: true, message: 'Vui lòng chọn phiên bản firmware!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Select placeholder="Chọn phiên bản">
                                                {firmwareVersions.map(option => (
                                                    <Option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveVersion}>
                                                Lưu
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Modal>
        </>
    );
};

export default SettingsIot;