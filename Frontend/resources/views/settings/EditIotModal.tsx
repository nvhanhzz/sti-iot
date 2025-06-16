import React, { useEffect } from 'react';
import { SaveOutlined } from '@ant-design/icons';
import {
    Button,
    Input,
    Form,
    message,
    Row,
    Col,
    Modal,
    Divider,
    InputNumber,
    Select
} from 'antd';
import IotService from '../../../services/IotService';
import { IotCMDInterface } from '../../../interface/SettingInterface';

const { Option } = Select;

interface ExtendedIotInterface extends IotCMDInterface {
    connected?: boolean;
    input?: boolean;
    output?: boolean;
    mac?: string;
    // Cập nhật các trường để khớp với tên cột DB
    wifi_ssid?: string;
    wifi_password?: string;
    wifi_ip?: string;
    wifi_gateway?: string;
    wifi_subnet?: string;
    wifi_dns?: string;

    can_baudrate?: number;

    mqtt_mac?: string;
    mqtt_ip?: string;
    mqtt_gateway?: string;
    mqtt_subnet?: string;
    mqtt_dns?: string;

    ethernet_ip?: string;
    ethernet_gateway?: string;
    ethernet_subnet?: string;
    ethernet_mac?: string;
    ethernet_dns?: string;

    rs485_id?: number;
    rs485_addresses?: string;
    rs485_baudrate?: number;
    rs485_serial_config?: string;

    rs232_baudrate?: number;
    rs232_serial_config?: string;

    firmware_version_id?: number; // Thay vì 'version', dùng ID nếu FE gửi ID
    // Nếu FE gửi string version (vd: "1.0.0") và backend cần lookup ID, giữ 'version'
    version?: string; // Giữ lại nếu FE hiển thị và gửi string version
}

interface EditIotModalProps {
    isVisible: boolean;
    record: ExtendedIotInterface | null;
    onCancel: () => void;
    onSaveSuccess: (updatedRecord: ExtendedIotInterface) => void;
}

const EditIotModal: React.FC<EditIotModalProps> = ({ isVisible, record, onCancel, onSaveSuccess }) => {
    const [basicInfoForm] = Form.useForm();
    const [wifiForm] = Form.useForm();
    const [ethernetForm] = Form.useForm();
    const [mqttForm] = Form.useForm();
    const [rs485Form] = Form.useForm();
    const [rs232Form] = Form.useForm();
    const [canForm] = Form.useForm();
    const [versionForm] = Form.useForm();

    useEffect(() => {
        if (record) {
            basicInfoForm.setFieldsValue(record);

            // Gán trực tiếp các trường, không còn object lồng nhau
            wifiForm.setFieldsValue({
                wifi_ssid: record.wifi_ssid,
                wifi_password: record.wifi_password,
                wifi_ip: record.wifi_ip,
                wifi_gateway: record.wifi_gateway,
                wifi_subnet: record.wifi_subnet,
                wifi_dns: record.wifi_dns,
            });
            ethernetForm.setFieldsValue({
                ethernet_ip: record.ethernet_ip,
                ethernet_gateway: record.ethernet_gateway,
                ethernet_subnet: record.ethernet_subnet,
                ethernet_mac: record.ethernet_mac,
                ethernet_dns: record.ethernet_dns,
            });
            mqttForm.setFieldsValue({
                mqtt_mac: record.mqtt_mac,
                mqtt_ip: record.mqtt_ip,
                mqtt_gateway: record.mqtt_gateway,
                mqtt_subnet: record.mqtt_subnet,
                mqtt_dns: record.mqtt_dns,
            });
            rs485Form.setFieldsValue({
                rs485_id: record.rs485_id,
                rs485_addresses: record.rs485_addresses,
                rs485_baudrate: record.rs485_baudrate,
                rs485_serial_config: record.rs485_serial_config,
            });
            rs232Form.setFieldsValue({
                rs232_baudrate: record.rs232_baudrate,
                rs232_serial_config: record.rs232_serial_config,
            });
            canForm.setFieldsValue({
                can_baudrate: record.can_baudrate,
            });
            versionForm.setFieldsValue({ version: record.version }); // Nếu record.version là string
            // Hoặc versionForm.setFieldsValue({ firmware_version_id: record.firmware_version_id }); nếu FE gửi ID
        } else {
            basicInfoForm.resetFields();
            wifiForm.resetFields();
            ethernetForm.resetFields();
            mqttForm.resetFields();
            rs485Form.resetFields();
            rs232Form.resetFields();
            canForm.resetFields();
            versionForm.resetFields();
        }
    }, [record, basicInfoForm, wifiForm, ethernetForm, mqttForm, rs485Form, rs232Form, canForm, versionForm]);

    const handleSaveSection = async (
        formInstance: any,
        sectionName: string,
        serviceCall: (id: string, data: any) => Promise<any>
    ) => {
        if (!record?.id) {
            message.error('ID thiết bị không hợp lệ!');
            return;
        }

        const loadingMessage = message.loading(`Đang lưu ${sectionName}...`, 0);
        try {
            const values = await formInstance.validateFields();

            // payloadToSend giờ chính là values từ form, không cần mapping thêm
            const payloadToSend = values;

            // @ts-ignore
            const response: any = await serviceCall(record.id, payloadToSend);
            const resData = response?.data;

            if (resData?.data) {
                const resDataNew = resData.data;
                message.success(`${sectionName} cập nhật thành công!`);
                onSaveSuccess({ ...record, ...resDataNew });
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

    const handleSaveBasicInfo = () => handleSaveSection(basicInfoForm, 'Thông tin cơ bản', IotService.updateIotBasicInfo.bind(IotService));
    const handleSaveWifi = () => handleSaveSection(wifiForm, 'Cài đặt WiFi', IotService.updateIotWifiSettings.bind(IotService));
    const handleSaveEthernet = () => handleSaveSection(ethernetForm, 'Cài đặt Ethernet', IotService.updateIotEthernetSettings.bind(IotService));
    const handleSaveMqtt = () => handleSaveSection(mqttForm, 'Cài đặt MQTT', IotService.updateIotMqttSettings.bind(IotService));
    const handleSaveRs485 = () => handleSaveSection(rs485Form, 'Cài đặt RS485', IotService.updateIotRs485Settings.bind(IotService));
    const handleSaveRs232 = () => handleSaveSection(rs232Form, 'Cài đặt RS232', IotService.updateIotRs232Settings.bind(IotService));
    const handleSaveCan = () => handleSaveSection(canForm, 'Cài đặt CAN', IotService.updateIotCanSettings.bind(IotService));
    const handleSaveVersion = () => handleSaveSection(versionForm, 'Phiên bản Firmware', IotService.updateIotFirmwareVersion.bind(IotService));

    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

    const firmwareVersions = [
        { value: '1.0.0', label: '1.0.0' },
        { value: '1.0.1', label: '1.0.1' },
        { value: '1.0.2', label: '1.0.2' },
        { value: '2.0.0', label: '2.0.0' },
    ];

    return (
        <Modal
            title="Chỉnh sửa cài đặt thiết bị IoT"
            open={isVisible}
            onCancel={onCancel}
            width={1400}
            footer={null}
            destroyOnClose
            maskClosable={false}
            style={{ top: 10 }}
            bodyStyle={{ maxHeight: 'calc(100vh - 100px)', padding: '10px 24px' }}
        >
            <Row gutter={20}>
                <Col span={12}>
                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <Divider orientation="left">Thông tin cơ bản</Divider>
                        <Form form={basicInfoForm} layout="vertical">
                            <Row gutter={16} align="bottom">
                                <Col span={8}>
                                    <Form.Item
                                        name="name"
                                        label="Tên thiết bị"
                                        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input placeholder="Nhập tên thiết bị" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="mac"
                                        label="Địa chỉ MAC"
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input disabled placeholder="Địa chỉ MAC cố định" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveBasicInfo}>
                                            Lưu
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <Divider orientation="left">Cài đặt Ethernet</Divider>
                        <Form form={ethernetForm} layout="vertical">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name="ethernet_ip"
                                        label="IP"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng IP không hợp lệ!' }]}
                                    >
                                    <Input placeholder="192.168.0.10" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="ethernet_gateway"
                            label="Gateway"
                            rules={[{ pattern: ipRegex, message: 'Định dạng Gateway không hợp lệ!' }]}
                        >
                            <Input placeholder="192.168.1.1" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="ethernet_subnet"
                            label="Subnet"
                            rules={[{ pattern: ipRegex, message: 'Định dạng Subnet không hợp lệ!' }]}
                        >
                            <Input placeholder="255.255.255.0" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16} align="bottom">
                    <Col span={8}>
                        <Form.Item
                            name="ethernet_mac"
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
                            name="ethernet_dns"
                            label="DNS"
                            rules={[{ pattern: ipRegex, message: 'Định dạng DNS không hợp lệ!' }]}
                            style={{ marginBottom: 0 }}
                        >
                            <Input placeholder="8.8.8.8" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveEthernet}>
                                Lưu
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
    </div>

        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <Divider orientation="left">Cài đặt RS485</Divider>
            <Form form={rs485Form} layout="vertical">
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="rs485_id"
                            label="ID"
                        >
                            <InputNumber style={{ width: '100%' }} placeholder="1" />
                        </Form.Item>
                    </Col>
                    <Col span={16}>
                        <Form.Item
                            name="rs485_addresses"
                            label="Địa chỉ (cách nhau bởi dấu phẩy)"
                        >
                            <Input.TextArea rows={2} placeholder="40001,40002,40003,40004,40005" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16} align="bottom">
                    <Col span={8}>
                        <Form.Item
                            name="rs485_baudrate"
                            label="Baudrate"
                            rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS485!' }]}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber style={{ width: '100%' }} placeholder="9600" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="rs485_serial_config"
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

        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <Divider orientation="left">Cài đặt RS232</Divider>
            <Form form={rs232Form} layout="vertical">
                <Row gutter={16} align="bottom">
                    <Col span={10}>
                        <Form.Item
                            name="rs232_baudrate"
                            label="Baudrate"
                            rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS232!' }]}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber style={{ width: '100%' }} placeholder="9600" />
                        </Form.Item>
                    </Col>
                    <Col span={10}>
                        <Form.Item
                            name="rs232_serial_config"
                            label="Cấu hình Serial"
                            rules={[{ required: true, message: 'Vui lòng nhập cấu hình Serial!' }]}
                            style={{ marginBottom: 0 }}
                        >
                            <Input placeholder="8N1" />
                        </Form.Item>
                    </Col>
                    <Col span={4}>
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

        <Col span={12}>
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <Divider orientation="left">Cài đặt WiFi</Divider>
                <Form form={wifiForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="wifi_ssid"
                                label="SSID"
                                rules={[{ required: true, message: 'Vui lòng nhập SSID!' }]}
                            >
                                <Input placeholder="SSID" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="wifi_password"
                                label="Mật khẩu WiFi"
                            >
                                <Input.Password placeholder="Nhập mật khẩu" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="wifi_ip"
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
                                name="wifi_gateway"
                                label="Gateway"
                                rules={[{ pattern: ipRegex, message: 'Định dạng Gateway không hợp lệ!' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <Input placeholder="192.168.1.1" />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item
                                name="wifi_subnet"
                                label="Subnet"
                                rules={[{ pattern: ipRegex, message: 'Định dạng Subnet không hợp lệ!' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <Input placeholder="255.255.255.0" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="wifi_dns"
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

            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <Divider orientation="left">Cài đặt MQTT</Divider>
                <Form form={mqttForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="mqtt_mac"
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
                                name="mqtt_ip"
                                label="IP"
                                rules={[{ pattern: ipRegex, message: 'Định dạng IP không hợp lệ!' }]}
                            >
                                <Input placeholder="192.168.1.235" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="mqtt_gateway"
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
                                name="mqtt_subnet"
                                label="Subnet"
                                rules={[{ pattern: ipRegex, message: 'Định dạng Subnet không hợp lệ!' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <Input placeholder="255.255.255.0" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="mqtt_dns"
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

            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <Divider orientation="left">Cài đặt CAN</Divider>
                <Form form={canForm} layout="vertical">
                    <Row gutter={16} align="bottom">
                        <Col span={16}>
                            <Form.Item
                                name="can_baudrate"
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

            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '0px' }}>
                <Divider orientation="left">Phiên bản Firmware</Divider>
                <Form form={versionForm} layout="vertical">
                    <Row gutter={16} align="bottom">
                        <Col span={16}>
                            <Form.Item
                                name="version" // Giữ nguyên 'version' nếu FE gửi string version
                                // Hoặc 'firmware_version_id' nếu FE gửi ID
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
    );
};

export default EditIotModal;