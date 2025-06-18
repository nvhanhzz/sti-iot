import React, { useEffect, useRef } from 'react';
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
import IotService from '../../../services/IotService';
import { IotCMDInterface } from '../../../interface/SettingInterface';

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

    canConfig?: { baudrate?: number }; // Cập nhật để phản ánh chỉ dùng canConfig (JSON)
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

    // Dùng useRef để kiểm soát việc setFieldsValue chỉ khi record thay đổi ID hoặc isVisible thay đổi
    const prevRecordIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        // Chỉ setFieldsValue khi record thay đổi (hoặc khi record.id thay đổi),
        // và khi modal hiển thị.
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

            // Thay đổi cách khởi tạo canForm để phù hợp với canConfig (JSON)
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

            // Cập nhật ID của record trước đó
            // @ts-ignore - record.id should be string based on MasterIotInterface (device_id: string)
            prevRecordIdRef.current = record.id;

        } else if (!isVisible) {
            // Reset các form khi modal bị đóng (isVisible = false)
            basicInfoForm.resetFields();
            wifiForm.resetFields();
            ethernetForm.resetFields();
            mqttForm.resetFields();
            rs485Form.resetFields();
            rs232Form.resetFields();
            canForm.resetFields();
            tcpForm.resetFields();
            prevRecordIdRef.current = undefined; // Đặt lại để lần sau mở lại modal với cùng record.id sẽ set lại giá trị
        }
    }, [isVisible, record, basicInfoForm, wifiForm, ethernetForm, mqttForm, rs485Form, rs232Form, canForm, tcpForm]);

    const handleSaveSection = async (
        formInstance: any,
        sectionName: string,
        serviceCall: (id: string, data: any) => Promise<any>,
        fieldName?: string
    ) => {
        if (!record?.id) {
            message.error('ID thiết bị không hợp lệ!');
            return;
        }

        const loadingMessage = message.loading(`Đang lưu ${sectionName}...`, 0);
        try {
            const values = await formInstance.validateFields();
            let payloadToSend: any = { ...values };

            if (fieldName) {
                // Lấy giá trị của fieldName từ values (ví dụ: values.wifiConfig)
                payloadToSend = values[fieldName];

                // --- Bắt đầu phần lọc giá trị null/undefined/empty array ---
                const filteredConfigData: { [key: string]: any } = {};
                for (const key in payloadToSend) {
                    if (payloadToSend.hasOwnProperty(key)) {
                        const value = payloadToSend[key];
                        // Lọc null, undefined và mảng rỗng
                        if (value !== null && typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0)) {
                            filteredConfigData[key] = value;
                        }
                    }
                }
                payloadToSend = filteredConfigData; // Gán lại payload đã lọc
                // --- Kết thúc phần lọc giá trị null/undefined/empty array ---

                if (fieldName === 'wifiConfig') {
                    // Không cần xử lý đặc biệt cho wifiConfig nếu không có Number
                } else if (fieldName === 'ethernetConfig') {
                    // Không cần xử lý đặc biệt cho ethernetConfig
                } else if (fieldName === 'mqttConfig') {
                    // Chuyển đổi sang kiểu Number nếu không null/undefined
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
                            // Chuyển đổi chuỗi "1,2,3" thành mảng số [1,2,3]
                            address: item.address ? item.address.split(',').map((s: string) => Number(s.trim())) : [],
                        }));
                    }
                } else if (fieldName === 'rs232Config') {
                    if (payloadToSend.baudrate !== null && payloadToSend.baudrate !== undefined) {
                        payloadToSend.baudrate = Number(payloadToSend.baudrate);
                    }
                } else if (fieldName === 'canConfig') {
                    // canConfig bây giờ là một trường JSON, payloadToSend đã là object chứa baudrate (hoặc các thuộc tính khác của canConfig)
                    // Không cần gán lại payloadToSend = { canBaudrate: ... }
                    // PayloadToSend đã là { baudrate: ... } hoặc { baudrate: ..., otherProp: ...}
                    // và sẽ được bọc đúng cách trong apiPayload dưới dạng { canConfig: { baudrate: ... } }
                    if (payloadToSend.baudrate !== null && payloadToSend.baudrate !== undefined) {
                        payloadToSend.baudrate = Number(payloadToSend.baudrate);
                    }
                } else if (fieldName === 'tcpConfig') {
                    if (payloadToSend.ipAddresses) {
                        payloadToSend.ipAddresses = payloadToSend.ipAddresses.map((item: any) => ({
                            ...item,
                            // Chuyển đổi chuỗi "8080,40001" thành mảng số [8080,40001]
                            address: item.address ? item.address.split(',').map((s: string) => Number(s.trim())) : [],
                        }));
                    }
                }
            } else { // Trường hợp basicInfo (không có fieldName)
                // Lọc null/undefined/empty array cho basicInfo
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

            // =========================================================================
            // ĐÂY LÀ ĐOẠN CODE ĐƯỢC THAY ĐỔI ĐỂ SỬA LỖI KEY RỖNG
            // Chuẩn bị payload cuối cùng cho API
            let apiPayload: any;
            if (fieldName) { // Nếu có fieldName (wifiConfig, mqttConfig, canConfig, ...)
                apiPayload = { [fieldName]: payloadToSend };
            } else { // Đối với basic info (fieldName là undefined/null)
                apiPayload = payloadToSend; // Gửi thẳng object basic info, không bọc trong khóa rỗng
            }
            // =========================================================================

            // @ts-ignore
            const response: any = await serviceCall(record.id, apiPayload); // Gọi serviceCall với payload đã chuẩn bị
            const resData = response?.data;

            if (resData?.data) {
                const resDataNew = resData.data;

                // Chuẩn hóa dữ liệu nhận được từ server để hiển thị lên form
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
                // Nếu backend trả về canConfig (JSON) thì setFieldsValue trực tiếp
                // Hoặc nếu backend vẫn trả về canBaudrate và bạn muốn map lại thành canConfig cho form
                if (fieldName === 'canConfig' && resDataNew.canConfig !== undefined) {
                    // Giả sử resDataNew.canConfig đã là { baudrate: X }
                    // Không cần chuyển đổi thêm, vì form mong đợi canConfig: { baudrate: X }
                    resDataNew.canConfig = resDataNew.canConfig;
                }


                message.success(`${sectionName} cập nhật thành công!`);

                // Cập nhật lại CHỈ form hiện tại với dữ liệu mới từ server
                if (fieldName) {
                    formInstance.setFieldsValue({ [fieldName]: resDataNew[fieldName] });
                } else {
                    formInstance.setFieldsValue(resDataNew); // Cho basic info
                }

                // Gọi onSaveSuccess để component cha có thể cập nhật record tổng thể
                // Đảm bảo dữ liệu ở component cha luôn mới nhất.
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
    const handleSaveWifi = () => handleSaveSection(wifiForm, 'Cài đặt WiFi', IotService.updateIotWifiSettings.bind(IotService), 'wifiConfig');
    const handleSaveEthernet = () => handleSaveSection(ethernetForm, 'Cài đặt Ethernet', IotService.updateIotEthernetSettings.bind(IotService), 'ethernetConfig');
    const handleSaveMqtt = () => handleSaveSection(mqttForm, 'Cài đặt MQTT', IotService.updateIotMqttSettings.bind(IotService), 'mqttConfig');
    const handleSaveRs485 = () => handleSaveSection(rs485Form, 'Cài đặt RS485', IotService.updateIotRs485Settings.bind(IotService), 'rs485Config');
    const handleSaveRs232 = () => handleSaveSection(rs232Form, 'Cài đặt RS232', IotService.updateIotRs232Settings.bind(IotService), 'rs232Config');
    const handleSaveCan = () => handleSaveSection(canForm, 'Cài đặt CAN', IotService.updateIotCanSettings.bind(IotService), 'canConfig');
    const handleSaveTcp = () => handleSaveSection(tcpForm, 'Cài đặt TCP', IotService.updateIotTcpSettings.bind(IotService), 'tcpConfig');

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
            bodyStyle={{ maxHeight: 'calc(100vh - 70px)', padding: '10px 24px', overflowY: "auto" }}
        >
            <Row gutter={10}>
                <Col span={12}>
                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Thông tin cơ bản</Divider>
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

                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt MQTT</Divider>
                        <Form form={mqttForm} layout="vertical">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'server']}
                                        label="Server"
                                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ Server MQTT!' }]}
                                    >
                                        <Input placeholder="192.168.1.67" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'port']}
                                        label="Port"
                                        rules={[{ required: true, message: 'Vui lòng nhập Port MQTT!' }, { type: 'number', min: 1, max: 65535, message: 'Cổng không hợp lệ!' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="1883" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'user']}
                                        label="Tên người dùng"
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
                                    >
                                        <Input.Password placeholder="***" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'subTopic']}
                                        label="Subscribe Topic"
                                    >
                                        <Input placeholder="device/response/" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'pubTopic']}
                                        label="Publish Topic"
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
                                        rules={[{ type: 'number', min: 0, max: 2, message: 'QoS không hợp lệ (0-2)!' }]}
                                        style={{ marginBottom: 0 }}
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
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="60" />
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

                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt RS232</Divider>
                        <Form form={rs232Form} layout="vertical">
                            <Row gutter={16}  align="bottom">
                                <Col span={10}>
                                    <Form.Item
                                        name={['rs232Config', 'baudrate']}
                                        label="Baudrate"
                                        rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS232!' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="9600" />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item
                                        name={['rs232Config', 'serialConfig']}
                                        label="Cấu hình Serial"
                                        rules={[{ required: true, message: 'Vui lòng nhập cấu hình Serial!' }]}
                                    >
                                        <Input placeholder="8N1" />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRs232}>
                                            Lưu
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
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
                                                    >
                                                        <Input placeholder="Địa chỉ (ví dụ: 8080,40001)" />
                                                    </Form.Item>
                                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                                </Space>
                                            </div>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add({ ip: '', address: '' })} block icon={<PlusOutlined />}>
                                                Thêm cấu hình IP & Địa chỉ TCP
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>

                            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveTcp}>
                                    Lưu
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Col>

                <Col span={12}>
                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt WiFi</Divider>
                        <Form form={wifiForm} layout="vertical">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name={['wifiConfig', 'ssid']}
                                        label="SSID"
                                        rules={[{ required: true, message: 'Vui lòng nhập SSID!' }]}
                                    >
                                        <Input placeholder="STI_VietNam_No8" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['wifiConfig', 'pw']}
                                        label="Mật khẩu WiFi"
                                    >
                                        <Input.Password placeholder="66668888" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['wifiConfig', 'ip']}
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
                                        name={['wifiConfig', 'gateway']}
                                        label="Gateway"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng Gateway không hợp lệ!' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input placeholder="192.168.1.1" />
                                    </Form.Item>
                                </Col>
                                <Col span={7}>
                                    <Form.Item
                                        name={['wifiConfig', 'subnet']}
                                        label="Subnet"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng Subnet không hợp lệ!' }]}
                                        style={{ marginBottom: 0 }}
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

                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt Ethernet</Divider>
                        <Form form={ethernetForm} layout="vertical">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'ip']}
                                        label="IP"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng IP không hợp lệ!' }]}
                                    >
                                        <Input placeholder="192.168.1.235" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'gateway']}
                                        label="Gateway"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng Gateway không hợp lệ!' }]}
                                    >
                                        <Input placeholder="192.168.1.1" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'subnet']}
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
                                        name={['ethernetConfig', 'mac']}
                                        label="Địa chỉ MAC"
                                        rules={[
                                            { pattern: macRegex, message: 'Định dạng MAC không hợp lệ!' }
                                        ]}
                                        style={{ marginBottom: 0 }}
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

                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt CAN</Divider>
                        <Form form={canForm} layout="vertical">
                            <Row gutter={16} align="bottom">
                                <Col span={16}>
                                    <Form.Item
                                        name={['canConfig', 'baudrate']} // Tên này phải trùng với cách bạn setFieldsValue cho canForm
                                        label="Baudrate"
                                        rules={[{ required: true, message: 'Vui lòng nhập Baudrate CAN!' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="51000" />
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

                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Cài đặt RS485</Divider>
                        <Form form={rs485Form} layout="vertical">
                            <Row gutter={20}>
                                <Col span={12}>
                                    <Form.Item
                                        name={['rs485Config', 'baudrate']}
                                        label="Baudrate"
                                        rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS485!' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="9600" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name={['rs485Config', 'serialConfig']}
                                        label="Cấu hình Serial"
                                        rules={[{ required: true, message: 'Vui lòng nhập cấu hình Serial!' }]}
                                    >
                                        <Input placeholder="8N1" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider orientation="left" style={{ marginTop: -10, marginBottom: 10 }}>Cấu hình ID & Địa chỉ RS485</Divider>
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
                                                    >
                                                        <Input placeholder="Địa chỉ (ví dụ: 40001,40002)" />
                                                    </Form.Item>
                                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                                </Space>
                                            </div>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add({ id: null, address: '' })} block icon={<PlusOutlined />}>
                                                Thêm ID & Địa chỉ RS485
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>

                            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRs485}>
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