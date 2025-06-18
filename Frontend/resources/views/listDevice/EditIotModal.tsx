import React, { useEffect, useRef, useState } from 'react';
import { SaveOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
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
    Space
} from 'antd';
import IotService from '../../../services/IotService.ts'; // Đảm bảo đường dẫn này đúng
import { IotCMDInterface } from '../../../interface/SettingInterface.ts'; // Đảm bảo đường dẫn này đúng
import "./ListDevice.css";

interface WifiConfig {
    ssid?: string;
    pw?: string;
    ip?: string;
    gateway?: string;
    subnet?: string;
    dns?: string;
}

interface EthernetConfig {
    mac?: string;
    ip?: string;
    gateway?: string;
    subnet?: string;
    dns?: string;
}

interface MqttConfig {
    server?: string;
    port?: number;
    user?: string;
    pw?: string;
    subTopic?: string;
    pubTopic?: string;
    qos?: number;
    keepAlive?: number;
}

interface Rs485IdAddress {
    id: number;
    address: string;
}

interface Rs485Config {
    baudrate?: number;
    serialConfig?: string;
    idAddresses?: Rs485IdAddress[];
}

interface Rs232Config {
    baudrate?: number;
    serialConfig?: string;
}

interface TcpConnection {
    ip: string;
    address: string;
}

interface TcpConfig {
    ipAddresses?: TcpConnection[];
}

interface ExtendedIotInterface extends IotCMDInterface {
    connected?: boolean;
    input?: boolean;
    output?: boolean;
    mac?: string;

    wifiConfig?: WifiConfig;
    ethernetConfig?: EthernetConfig;
    mqttConfig?: MqttConfig;
    rs485Config?: Rs485Config;
    rs232Config?: Rs232Config;
    tcpConfig?: TcpConfig;

    canConfig?: { baudrate?: number };
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
    const [tcpForm] = Form.useForm();

    const prevRecordIdRef = useRef<string | undefined>(undefined);

    const [isLoadingBasicInfo, setIsLoadingBasicInfo] = useState(false);
    const [isLoadingWifi, setIsLoadingWifi] = useState(false);
    const [isLoadingEthernet, setIsLoadingEthernet] = useState(false);
    const [isLoadingMqtt, setIsLoadingMqtt] = useState(false);
    const [isLoadingRs485, setIsLoadingRs485] = useState(false);
    const [isLoadingRs232, setIsLoadingRs232] = useState(false);
    const [isLoadingCan, setIsLoadingCan] = useState(false);
    const [isLoadingTcp, setIsLoadingTcp] = useState(false);


    useEffect(() => {
        if (isVisible && record && record.id !== prevRecordIdRef.current) {
            basicInfoForm.setFieldsValue(record);

            wifiForm.setFieldsValue({
                wifiConfig: record.wifiConfig || {
                    ssid: "", pw: "", ip: "", gateway: "", subnet: "", dns: ""
                }
            });

            ethernetForm.setFieldsValue({
                ethernetConfig: record.ethernetConfig || {
                    mac: "", ip: "", gateway: "", subnet: "", dns: ""
                }
            });

            mqttForm.setFieldsValue({
                mqttConfig: record.mqttConfig || {
                    server: "", port: null, user: "", pw: "", subTopic: "", pubTopic: "", qos: null, keepAlive: null
                }
            });

            const rs485InitialValues = record.rs485Config ? {
                ...record.rs485Config,
                idAddresses: record.rs485Config.idAddresses?.map(item => ({
                    id: item.id,
                    address: Array.isArray(item.address) ? item.address.join(',') : item.address
                })) || []
            } : { baudrate: null, serialConfig: "", idAddresses: [] };
            rs485Form.setFieldsValue({ rs485Config: rs485InitialValues });

            rs232Form.setFieldsValue({
                rs232Config: record.rs232Config || {
                    baudrate: null, serialConfig: ""
                }
            });

            canForm.setFieldsValue({
                canConfig: record.canConfig || { baudrate: null }
            });

            const tcpInitialValues = record.tcpConfig ? {
                ...record.tcpConfig,
                ipAddresses: record.tcpConfig.ipAddresses?.map(item => ({
                    ...item,
                    address: Array.isArray(item.address) ? item.address.join(',') : item.address
                })) || []
            } : { ipAddresses: [] };
            tcpForm.setFieldsValue({ tcpConfig: tcpInitialValues });

            // @ts-ignore - record.id should be string based on MasterIotInterface (device_id: string)
            prevRecordIdRef.current = record.id;

        } else if (!isVisible) {
            basicInfoForm.resetFields();
            wifiForm.resetFields();
            ethernetForm.resetFields();
            mqttForm.resetFields();
            rs485Form.resetFields();
            rs232Form.resetFields();
            canForm.resetFields();
            tcpForm.resetFields();
            prevRecordIdRef.current = undefined;
        }
    }, [isVisible, record, basicInfoForm, wifiForm, ethernetForm, mqttForm, rs485Form, rs232Form, canForm, tcpForm]);

    const handleSaveSection = async (
        formInstance: any,
        sectionName: string,
        serviceCall: (id: string, data: any) => Promise<any>,
        setLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
        fieldName?: string
    ) => {
        if (!record?.id) {
            message.error('ID thiết bị không hợp lệ!');
            return;
        }

        setLoadingState(true);
        const loadingMessage = message.loading(`Đang lưu ${sectionName}...`, 0);
        try {
            const values = await formInstance.validateFields();
            let payloadToSend: any = { ...values };

            if (fieldName) {
                payloadToSend = values[fieldName];

                const filteredConfigData: { [key: string]: any } = {};
                for (const key in payloadToSend) {
                    if (payloadToSend.hasOwnProperty(key)) {
                        const value = payloadToSend[key];
                        if (value !== null && typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0)) {
                            filteredConfigData[key] = value;
                        }
                    }
                }
                payloadToSend = filteredConfigData;

                if (fieldName === 'mqttConfig') {
                    if (payloadToSend.port !== null && payloadToSend.port !== undefined) {
                        payloadToSend.port = Number(payloadToSend.port);
                    }
                    if (payloadToSend.qos !== null && payloadToSend.qos !== undefined) {
                        payloadToSend.qos = Number(payloadToSend.qos);
                    }
                    if (payloadToSend.keepAlive !== null && payloadToSend.keepAlive !== undefined) {
                        payloadToSend.keepAlive = Number(payloadToSend.keepAlive);
                    }
                } else if (fieldName === 'rs485Config') {
                    if (payloadToSend.baudrate !== null && payloadToSend.baudrate !== undefined) {
                        payloadToSend.baudrate = Number(payloadToSend.baudrate);
                    }
                    if (payloadToSend.idAddresses) {
                        payloadToSend.idAddresses = payloadToSend.idAddresses.map((item: any) => ({
                            id: Number(item.id),
                            address: item.address ? item.address.split(',').map((s: string) => Number(s.trim())) : [],
                        }));
                    }
                } else if (fieldName === 'rs232Config') {
                    if (payloadToSend.baudrate !== null && payloadToSend.baudrate !== undefined) {
                        payloadToSend.baudrate = Number(payloadToSend.baudrate);
                    }
                } else if (fieldName === 'canConfig') {
                    if (payloadToSend.baudrate !== null && payloadToSend.baudrate !== undefined) {
                        payloadToSend.baudrate = Number(payloadToSend.baudrate);
                    }
                } else if (fieldName === 'tcpConfig') {
                    if (payloadToSend.ipAddresses) {
                        payloadToSend.ipAddresses = payloadToSend.ipAddresses.map((item: any) => ({
                            ...item,
                            address: item.address ? item.address.split(',').map((s: string) => Number(s.trim())) : [],
                        }));
                    }
                }
            } else {
                const filteredBasicInfo: { [key: string]: any } = {};
                for (const key in payloadToSend) {
                    if (payloadToSend.hasOwnProperty(key)) {
                        const value = payloadToSend[key];
                        if (value !== null && typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0)) {
                            filteredBasicInfo[key] = value;
                        }
                    }
                }
                payloadToSend = filteredBasicInfo;
            }

            let apiPayload: any;
            if (fieldName) {
                apiPayload = { [fieldName]: payloadToSend };
            } else {
                apiPayload = payloadToSend;
            }

            // @ts-ignore
            const response: any = await serviceCall(record.id, apiPayload);
            const resData = response?.data;

            if (resData?.data) {
                const resDataNew = resData.data;

                if (fieldName === 'rs485Config' && resDataNew.rs485Config?.idAddresses) {
                    resDataNew.rs485Config.idAddresses = resDataNew.rs485Config.idAddresses.map((item: any) => ({
                        ...item,
                        address: Array.isArray(item.address) ? item.address.join(',') : item.address
                    }));
                }
                if (fieldName === 'tcpConfig' && resDataNew.tcpConfig?.ipAddresses) {
                    resDataNew.tcpConfig.ipAddresses = resDataNew.tcpConfig.ipAddresses.map((item: any) => ({
                        ...item,
                        address: Array.isArray(item.address) ? item.address.join(',') : item.address
                    }));
                }
                if (fieldName === 'canConfig' && resDataNew.canConfig !== undefined) {
                    resDataNew.canConfig = resDataNew.canConfig;
                }

                message.success(`${sectionName} cập nhật thành công!`);

                if (fieldName) {
                    formInstance.setFieldsValue({ [fieldName]: resDataNew[fieldName] });
                } else {
                    formInstance.setFieldsValue(resDataNew);
                }

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
            setLoadingState(false);
        }
    };

    const handleSaveBasicInfo = () => handleSaveSection(basicInfoForm, 'Thông tin cơ bản', IotService.updateIotBasicInfo.bind(IotService), setIsLoadingBasicInfo);
    const handleSaveWifi = () => handleSaveSection(wifiForm, 'Cài đặt WiFi', IotService.updateIotWifiSettings.bind(IotService), setIsLoadingWifi, 'wifiConfig');
    const handleSaveEthernet = () => handleSaveSection(ethernetForm, 'Cài đặt Ethernet', IotService.updateIotEthernetSettings.bind(IotService), setIsLoadingEthernet, 'ethernetConfig');
    const handleSaveMqtt = () => handleSaveSection(mqttForm, 'Cài đặt MQTT', IotService.updateIotMqttSettings.bind(IotService), setIsLoadingMqtt, 'mqttConfig');
    const handleSaveRs485 = () => handleSaveSection(rs485Form, 'Cài đặt RS485', IotService.updateIotRs485Settings.bind(IotService), setIsLoadingRs485, 'rs485Config');
    const handleSaveRs232 = () => handleSaveSection(rs232Form, 'Cài đặt RS232', IotService.updateIotRs232Settings.bind(IotService), setIsLoadingRs232, 'rs232Config');
    const handleSaveCan = () => handleSaveSection(canForm, 'Cài đặt CAN', IotService.updateIotCanSettings.bind(IotService), setIsLoadingCan, 'canConfig');
    const handleSaveTcp = () => handleSaveSection(tcpForm, 'Cài đặt TCP', IotService.updateIotTcpSettings.bind(IotService), setIsLoadingTcp, 'tcpConfig');

    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

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
            bodyStyle={{ maxHeight: 'calc(100vh - 60px)', padding: '10px 24px', overflowY: "auto" }}
        >
            <Row gutter={10}>
                <Col span={12}>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Thông tin cơ bản</Divider>
                        <Form form={basicInfoForm} layout="vertical">
                            <Row gutter={16} align="bottom">
                                <Col span={8}>
                                    <Form.Item
                                        name="name"
                                        label="Tên thiết bị"
                                        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="Nhập tên thiết bị" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="mac"
                                        label="Địa chỉ MAC"
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <Input disabled placeholder="Địa chỉ MAC cố định" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveBasicInfo} loading={isLoadingBasicInfo} disabled={isLoadingBasicInfo}>
                                            Lưu
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt MQTT</Divider>
                        <Form form={mqttForm} layout="vertical">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'server']}
                                        label="Server"
                                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ Server MQTT!' }]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="192.168.1.67" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'port']}
                                        label="Port"
                                        rules={[{ required: true, message: 'Vui lòng nhập Port MQTT!' }, { type: 'number', min: 1, max: 65535, message: 'Cổng không hợp lệ!' }]}
                                        validateTrigger={[]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="1883" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'user']}
                                        label="Tên người dùng"
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="..." />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16} align="bottom">
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'pw']}
                                        label="Mật khẩu"
                                        validateTrigger={[]}
                                    >
                                        <Input.Password placeholder="***" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'subTopic']}
                                        label="Subscribe Topic"
                                        rules={[{ required: true, message: 'Vui lòng nhập Subscribe Topic!' }]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="device/response/" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'pubTopic']}
                                        label="Publish Topic"
                                        rules={[{ required: true, message: 'Vui lòng nhập Publish Topic!' }]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="device_send/" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16} align="bottom">
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'qos']}
                                        label="QoS"
                                        rules={[{ required: true, message: 'Vui lòng nhập Qos!' },
                                            { type: 'number', min: 0, max: 1, message: 'QoS không hợp lệ (0-1)!' }]}
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="1" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'keepAlive']}
                                        label="Keep Alive (giây)"
                                        rules={[{ type: 'number', min: 0, message: 'Keep Alive không hợp lệ!' }]}
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="60" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveMqtt} loading={isLoadingMqtt} disabled={isLoadingMqtt}>
                                            Lưu
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt RS232</Divider>
                        <Form form={rs232Form} layout="vertical">
                            <Row gutter={16}  align="bottom">
                                <Col span={10}>
                                    <Form.Item
                                        name={['rs232Config', 'baudrate']}
                                        label="Baudrate"
                                        rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS232!' }]}
                                        validateTrigger={[]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="9600" />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item
                                        name={['rs232Config', 'serialConfig']}
                                        label="Cấu hình Serial"
                                        rules={[{ required: true, message: 'Vui lòng nhập cấu hình Serial!' }]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="8N1" />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRs232} loading={isLoadingRs232} disabled={isLoadingRs232}>
                                            Lưu
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt TCP</Divider>
                        <Form form={tcpForm} layout="vertical">
                            <Form.List name={['tcpConfig', 'ipAddresses']}>
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{ background: '#e6e6e6', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                                                <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline" size="middle">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'ip']}
                                                        rules={[
                                                            { required: true, message: 'Vui lòng nhập IP!' },
                                                            { pattern: ipRegex, message: 'Định dạng IP không hợp lệ!' }
                                                        ]}
                                                        style={{ flex: 1, marginBottom: 0 }}
                                                        validateTrigger={[]}
                                                    >
                                                        <Input placeholder="IP đích (ví dụ: 192.168.1.100)" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'address']}
                                                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' },
                                                            ({ }) => ({
                                                                validator(_, value) {
                                                                    if (value && value.split(',').some((s: string) => isNaN(Number(s.trim())) || s.trim() === '')) {
                                                                        return Promise.reject(new Error('Mỗi địa chỉ phải là một số và được ngăn cách bởi dấu phẩy!'));
                                                                    }
                                                                    return Promise.resolve();
                                                                },
                                                            }),
                                                        ]}
                                                        style={{ flex: 2, marginBottom: 0 }}
                                                        validateTrigger={[]}
                                                    >
                                                        <Input placeholder="Địa chỉ (ví dụ: 8080,40001)" />
                                                    </Form.Item>
                                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                                </Space>
                                            </div>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add({ ip: '', address: '' })} block icon={<PlusOutlined />} disabled={isLoadingTcp}>
                                                Thêm cấu hình IP & Địa chỉ TCP
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>

                            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveTcp} loading={isLoadingTcp} disabled={isLoadingTcp}>
                                    Lưu
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Col>

                <Col span={12}>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt WiFi</Divider>
                        <Form form={wifiForm} layout="vertical">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name={['wifiConfig', 'ssid']}
                                        label="SSID"
                                        rules={[{ required: true, message: 'Vui lòng nhập SSID!' }]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="STI_VietNam_No8" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['wifiConfig', 'pw']}
                                        label="Mật khẩu WiFi"
                                        validateTrigger={[]}
                                    >
                                        <Input.Password placeholder="66668888" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['wifiConfig', 'ip']}
                                        label="IP"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng IP không hợp lệ!' }]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="192.168.1.123" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16} align="bottom">
                                <Col span={7}>
                                    <Form.Item
                                        name={['wifiConfig', 'gateway']}
                                        label="Gateway"
                                        rules={[
                                            { pattern: ipRegex, message: 'Định dạng Gateway không hợp lệ!' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    const ipValue = getFieldValue(['wifiConfig', 'ip']);
                                                    if (ipValue && !value) {
                                                        return Promise.reject(new Error('Vui lòng nhập gateway'));
                                                    }
                                                    return Promise.resolve();
                                                },
                                            }),
                                        ]}
                                        dependencies={[['wifiConfig', 'ip']]}
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="192.168.1.1" />
                                    </Form.Item>
                                </Col>
                                <Col span={7}>
                                    <Form.Item
                                        name={['wifiConfig', 'subnet']}
                                        label="Subnet"
                                        rules={[
                                            { pattern: ipRegex, message: 'Định dạng Subnet không hợp lệ!' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    const ipValue = getFieldValue(['wifiConfig', 'ip']);
                                                    if (ipValue && !value) {
                                                        return Promise.reject(new Error('Vui lòng nhập subnet'));
                                                    }
                                                    return Promise.resolve();
                                                },
                                            }),
                                        ]}
                                        dependencies={[['wifiConfig', 'ip']]}
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="255.255.255.0" />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item
                                        name={['wifiConfig', 'dns']}
                                        label="DNS"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng DNS không hợp lệ!' }]}
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="8.8.8.8" />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveWifi} loading={isLoadingWifi} disabled={isLoadingWifi}>
                                            Lưu
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt Ethernet</Divider>
                        <Form form={ethernetForm} layout="vertical">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'ip']}
                                        label="IP"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng IP không hợp lệ!' }]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="192.168.1.235" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'gateway']}
                                        label="Gateway"
                                        rules={[
                                            { pattern: ipRegex, message: 'Định dạng Gateway không hợp lệ!' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    const ipValue = getFieldValue(['ethernetConfig', 'ip']);
                                                    if (ipValue && !value) {
                                                        return Promise.reject(new Error('Vui lòng nhập gateway'));
                                                    }
                                                    return Promise.resolve();
                                                },
                                            }),
                                        ]}
                                        dependencies={[['ethernetConfig', 'ip']]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="192.168.1.1" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'subnet']}
                                        label="Subnet"
                                        rules={[
                                            { pattern: ipRegex, message: 'Định dạng Subnet không hợp lệ!' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    const ipValue = getFieldValue(['ethernetConfig', 'ip']);
                                                    if (ipValue && !value) {
                                                        return Promise.reject(new Error('Vui lòng nhập subnet'));
                                                    }
                                                    return Promise.resolve();
                                                },
                                            }),
                                        ]}
                                        dependencies={[['ethernetConfig', 'ip']]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="255.255.255.0" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16} align="bottom">
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'mac']}
                                        label="Địa chỉ MAC"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập địa chỉ mac!' },
                                            { pattern: macRegex, message: 'Định dạng MAC không hợp lệ!' }
                                        ]}
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="DE:AD:BE:EF:FE:ED" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'dns']}
                                        label="DNS"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng DNS không hợp lệ!' }]}
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="8.8.8.8" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveEthernet} loading={isLoadingEthernet} disabled={isLoadingEthernet}>
                                            Lưu
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt CAN</Divider>
                        <Form form={canForm} layout="vertical">
                            <Row gutter={16} align="bottom">
                                <Col span={16}>
                                    <Form.Item
                                        name={['canConfig', 'baudrate']}
                                        label="Baudrate"
                                        rules={[{ required: true, message: 'Vui lòng nhập Baudrate CAN!' }]}
                                        style={{ marginBottom: 0 }}
                                        validateTrigger={[]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="51000" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveCan} loading={isLoadingCan} disabled={isLoadingCan}>
                                            Lưu
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt RS485</Divider>
                        <Form form={rs485Form} layout="vertical">
                            <Row gutter={20}>
                                <Col span={12}>
                                    <Form.Item
                                        name={['rs485Config', 'baudrate']}
                                        label="Baudrate"
                                        rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS485!' }]}
                                        validateTrigger={[]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="9600" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name={['rs485Config', 'serialConfig']}
                                        label="Cấu hình Serial"
                                        rules={[{ required: true, message: 'Vui lòng nhập cấu hình Serial!' }]}
                                        validateTrigger={[]}
                                    >
                                        <Input placeholder="8N1" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider orientation="left" style={{ marginTop: -5, marginBottom: 10 }}>Cấu hình ID & Địa chỉ RS485</Divider>
                            <Form.List name={['rs485Config', 'idAddresses']}>
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{ background: '#e6e6e6', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                                                <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline" size="middle">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'id']}
                                                        rules={[{ required: true, message: 'Vui lòng nhập ID!' }, { type: 'number', message: 'ID phải là số!' }]}
                                                        style={{ flex: 1, marginBottom: 0 }}
                                                        validateTrigger={[]}
                                                    >
                                                        <InputNumber style={{ width: '100%' }} placeholder="ID (ví dụ: 1)" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'address']}
                                                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' },
                                                            ({ }) => ({
                                                                validator(_, value) {
                                                                    if (value && value.split(',').some((s: string) => isNaN(Number(s.trim())) || s.trim() === '')) {
                                                                        return Promise.reject(new Error('Mỗi địa chỉ phải là một số và được ngăn cách bởi dấu phẩy!'));
                                                                    }
                                                                    return Promise.resolve();
                                                                },
                                                            }),
                                                        ]}
                                                        style={{ flex: 2, marginBottom: 0 }}
                                                        validateTrigger={[]}
                                                    >
                                                        <Input placeholder="Địa chỉ (ví dụ: 40001,40002)" />
                                                    </Form.Item>
                                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                                </Space>
                                            </div>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add({ id: null, address: '' })} block icon={<PlusOutlined />} disabled={isLoadingRs485}>
                                                Thêm ID & Địa chỉ RS485
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>

                            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRs485} loading={isLoadingRs485} disabled={isLoadingRs485}>
                                    Lưu
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Modal>
    );
};

export default EditIotModal;