import React, { useEffect, useRef, useState, useCallback } from 'react';
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
    InputNumber
} from 'antd';
import IotService from '../../../services/IotService.ts'; // Đảm bảo đường dẫn này đúng
import { IotCMDInterface } from '../../../interface/SettingInterface.ts'; // Đảm bảo đường dẫn này đúng
import "./ListDevice.css";

const backgroundForm = "#e8e8e8";

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

// Thêm DigitalInputConfig vào giao diện
interface DigitalInputConfig {
    modeDigitalInput?: number;
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
    digitalInputConfig?: DigitalInputConfig; // Sử dụng DigitalInputConfig interface
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
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // State mới cho modeDigitalInput
    const [modeDigitalInput, setModeDigitalInput] = useState<number | undefined>(undefined);

    // Store initial values for dirty checking, keyed by form purpose
    const initialValuesRef = useRef<{
        basicInfo?: any;
        wifiConfig?: any;
        ethernetConfig?: any;
        mqttConfig?: any;
        rs485Config?: any;
        rs232Config?: any;
        canConfig?: any;
        tcpConfig?: any;
        digitalInputConfig?: DigitalInputConfig; // Thêm vào initial values
    }>({});

    const formMapping = {
        basicInfo: { form: basicInfoForm, service: IotService.updateIotBasicInfo.bind(IotService), fieldName: undefined, sectionName: 'Thông tin cơ bản' },
        wifiConfig: { form: wifiForm, service: IotService.updateIotWifiSettings.bind(IotService), fieldName: 'wifiConfig', sectionName: 'Cài đặt WiFi' },
        ethernetConfig: { form: ethernetForm, service: IotService.updateIotEthernetSettings.bind(IotService), fieldName: 'ethernetConfig', sectionName: 'Cài đặt Ethernet' },
        mqttConfig: { form: mqttForm, service: IotService.updateIotMqttSettings.bind(IotService), fieldName: 'mqttConfig', sectionName: 'Cài đặt MQTT' },
        rs485Config: { form: rs485Form, service: IotService.updateIotRs485Settings.bind(IotService), fieldName: 'rs485Config', sectionName: 'Cài đặt RS485' },
        rs232Config: { form: rs232Form, service: IotService.updateIotRs232Settings.bind(IotService), fieldName: 'rs232Config', sectionName: 'Cài đặt RS232' },
        canConfig: { form: canForm, service: IotService.updateIotCanSettings.bind(IotService), fieldName: 'canConfig', sectionName: 'Cài đặt CAN' },
        tcpConfig: { form: tcpForm, service: IotService.updateIotTcpSettings.bind(IotService), fieldName: 'tcpConfig', sectionName: 'Cài đặt TCP' },
        digitalInputConfig: { service: IotService.updateIotInputSettings.bind(IotService), fieldName: 'digitalInputConfig', sectionName: 'Cài đặt Digital Input' }, // Thêm mục này
    };

    // Helper to deeply compare objects for changes
    const hasFormChanges = useCallback((formInstance: any, initialValues: any) => {
        const currentValues = formInstance.getFieldsValue(true);
        return JSON.stringify(currentValues) !== JSON.stringify(initialValues);
    }, []);

    const updateGlobalHasChanges = useCallback((mode?: number) => {
        let anyChanges = false;
        if (record) {
            for (const key in formMapping) {
                // @ts-ignore
                const { form, fieldName } = formMapping[key];
                if (form) { // Check only for forms, not direct fields like modeDigitalInput
                    // @ts-ignore
                    const currentInitialValues = initialValuesRef.current[fieldName || key];
                    if (currentInitialValues && hasFormChanges(form, currentInitialValues)) {
                        anyChanges = true;
                        break;
                    }
                }
            }
            // Check for modeDigitalInput changes as well
            if (mode !== initialValuesRef.current.digitalInputConfig?.modeDigitalInput ||
                !initialValuesRef.current.digitalInputConfig?.modeDigitalInput) {
                anyChanges = true;
            }
        }
        setHasChanges(anyChanges);
    }, [record, hasFormChanges, modeDigitalInput]);

    // Effect for initializing forms when record changes or modal becomes visible
    useEffect(() => {
        if (isVisible && record && record.id !== prevRecordIdRef.current) {
            // Set initial values for each form
            basicInfoForm.setFieldsValue(record);
            initialValuesRef.current.basicInfo = basicInfoForm.getFieldsValue(true);

            const wifiInitial = record.wifiConfig || { ssid: "", pw: "", ip: "", gateway: "", subnet: "", dns: "" };
            wifiForm.setFieldsValue({ wifiConfig: wifiInitial });
            initialValuesRef.current.wifiConfig = { wifiConfig: wifiInitial };

            const ethernetInitial = record.ethernetConfig || { mac: "", ip: "", gateway: "", subnet: "", dns: "" };
            ethernetForm.setFieldsValue({ ethernetConfig: ethernetInitial });
            initialValuesRef.current.ethernetConfig = { ethernetConfig: ethernetInitial };

            const mqttInitial = record.mqttConfig || { server: "", port: null, user: "", pw: "", subTopic: "", pubTopic: "", qos: null, keepAlive: null };
            mqttForm.setFieldsValue({ mqttConfig: mqttInitial });
            initialValuesRef.current.mqttConfig = { mqttConfig: mqttInitial };

            const rs485Initial = record.rs485Config ? {
                ...record.rs485Config,
                idAddresses: record.rs485Config.idAddresses?.map(item => ({
                    id: item.id,
                    address: Array.isArray(item.address) ? item.address.join(',') : item.address
                })) || []
            } : { baudrate: null, serialConfig: "", idAddresses: [] };
            rs485Form.setFieldsValue({ rs485Config: rs485Initial });
            initialValuesRef.current.rs485Config = { rs485Config: rs485Initial };

            const rs232Initial = record.rs232Config || { baudrate: null, serialConfig: "" };
            rs232Form.setFieldsValue({ rs232Config: rs232Initial });
            initialValuesRef.current.rs232Config = { rs232Config: rs232Initial };

            const canInitial = record.canConfig || { baudrate: null };
            canForm.setFieldsValue({ canConfig: canInitial });
            initialValuesRef.current.canConfig = { canConfig: canInitial };

            const tcpInitial = record.tcpConfig ? {
                ...record.tcpConfig,
                ipAddresses: record.tcpConfig.ipAddresses?.map(item => ({
                    ...item,
                    address: Array.isArray(item.address) ? item.address.join(',') : item.address
                })) || []
            } : { ipAddresses: [] };
            tcpForm.setFieldsValue({ tcpConfig: tcpInitial });
            initialValuesRef.current.tcpConfig = { tcpConfig: tcpInitial };

            // Initialize modeDigitalInput state and its initial value
            const initialMode = record.digitalInputConfig?.modeDigitalInput;
            setModeDigitalInput(initialMode);
            initialValuesRef.current.digitalInputConfig = { modeDigitalInput: initialMode };

            // @ts-ignore
            prevRecordIdRef.current = record.id;
            setHasChanges(false); // No changes on initial load

        } else if (!isVisible) {
            // Reset all forms and initial values when modal is hidden
            basicInfoForm.resetFields();
            wifiForm.resetFields();
            ethernetForm.resetFields();
            mqttForm.resetFields();
            rs485Form.resetFields();
            rs232Form.resetFields();
            canForm.resetFields();
            tcpForm.resetFields();
            prevRecordIdRef.current = undefined;
            initialValuesRef.current = {};
            setHasChanges(false);
            setModeDigitalInput(undefined); // Reset modeDigitalInput
        }
    }, [isVisible, record, basicInfoForm, wifiForm, ethernetForm, mqttForm, rs485Form, rs232Form, canForm, tcpForm]);


    const handleSaveAll = async () => {
        if (!record?.id) {
            message.error('ID thiết bị không hợp lệ!');
            return;
        }

        setIsSaving(true);
        const loadingMessage = message.loading('Đang lưu các thay đổi...', 0);
        let allSucceeded = true;
        let updatedRecordData = { ...record };

        const savePromises = [];

        // Lưu các form cấu hình
        for (const key in formMapping) {
            // @ts-ignore
            const { form, fieldName, sectionName, service } = formMapping[key];

            // Bỏ qua nếu là digitalInputConfig, sẽ xử lý riêng
            if (key === 'digitalInputConfig') continue;

            const initialKey = fieldName || key;

            // @ts-ignore
            if (hasFormChanges(form, initialValuesRef.current[initialKey])) {
                savePromises.push(
                    (async () => {
                        try {
                            await form.validateFields();
                            let values = form.getFieldsValue(true);
                            let payloadToSend: any = {};

                            if (fieldName) {
                                payloadToSend = values[fieldName];

                                const filteredConfigData: { [key: string]: any } = {};
                                for (const subKey in payloadToSend) {
                                    if (payloadToSend.hasOwnProperty(subKey)) {
                                        const value = payloadToSend[subKey];
                                        if (value !== null && typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0)) {
                                            filteredConfigData[subKey] = value;
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
                                for (const subKey in values) {
                                    if (values.hasOwnProperty(subKey)) {
                                        const value = values[subKey];
                                        if (value !== null && typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0)) {
                                            filteredBasicInfo[subKey] = value;
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
                            const response: any = await service(record.id, apiPayload);
                            const resData = response?.data;

                            if (resData?.data) {
                                const resDataNew = resData.data;

                                // Special handling for transforming address arrays back to comma-separated strings for form display
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

                                message.success(`${sectionName} cập nhật thành công!`);

                                // Update form values and initial values after successful save
                                if (fieldName) {
                                    form.setFieldsValue({ [fieldName]: resDataNew[fieldName] });
                                    // @ts-ignore
                                    initialValuesRef.current[fieldName] = { [fieldName]: resDataNew[fieldName] };
                                    updatedRecordData = { ...updatedRecordData, [fieldName]: resDataNew[fieldName] };
                                } else {
                                    form.setFieldsValue(resDataNew);
                                    initialValuesRef.current.basicInfo = resDataNew;
                                    updatedRecordData = { ...updatedRecordData, ...resDataNew };
                                }

                            } else {
                                message.error(resData?.message || `Có lỗi xảy ra khi cập nhật ${sectionName}!`);
                                allSucceeded = false;
                            }
                        } catch (errorInfo: any) {
                            console.error(`Lỗi khi lưu ${sectionName}:`, errorInfo);
                            const response = errorInfo?.response;
                            const errorMessage = response?.data?.message || `Có lỗi xảy ra khi lưu ${sectionName}!`;
                            message.error(errorMessage);
                            allSucceeded = false;
                        }
                    })()
                );
            }
        }

        // Handle saving modeDigitalInput if it has changed
        if (modeDigitalInput !== initialValuesRef.current.digitalInputConfig?.modeDigitalInput) {
            savePromises.push(
                (async () => {
                    try {
                        const { service, sectionName, fieldName } = formMapping.digitalInputConfig;
                        const payload = { modeDigitalInput: modeDigitalInput };
                        const apiPayload = { [fieldName!]: payload }; // payload là digitalInputConfig: {modeDigitalInput: number}

                        // @ts-ignore
                        const response: any = await service(record.id, apiPayload); // Gọi service tương ứng
                        const resData = response?.data;

                        if (resData?.data) {
                            message.success(`${sectionName} cập nhật thành công!`);
                            initialValuesRef.current.digitalInputConfig = resData.data.digitalInputConfig; // Cập nhật initial value
                            updatedRecordData = { ...updatedRecordData, digitalInputConfig: resData.data.digitalInputConfig };
                        } else {
                            message.error(resData?.message || `Có lỗi xảy ra khi cập nhật ${sectionName}!`);
                            allSucceeded = false;
                        }
                    } catch (error: any) {
                        console.error('Lỗi khi lưu Mode Digital Input:', error);
                        message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu Mode Digital Input!');
                        allSucceeded = false;
                    }
                })()
            );
        }

        await Promise.all(savePromises);

        loadingMessage();
        setIsSaving(false);
        updateGlobalHasChanges(); // Re-check for changes after saving

        if (allSucceeded) {
            onSaveSuccess(updatedRecordData as ExtendedIotInterface);
        }
    };

    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

    const handleModeButtonClick = (mode: number) => {
        setModeDigitalInput(mode);
        updateGlobalHasChanges(mode);
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Chỉnh sửa cài đặt thiết bị IoT</span>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: 23 }}>
                        <span style={{ marginRight: '10px', fontSize: '14px', fontWeight: 'bold' }}>Mode Digital Input:</span>
                        <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                            {[1, 2, 3].map((mode) => (
                                <Button
                                    key={mode}
                                    onClick={() => handleModeButtonClick(mode)}
                                    style={{
                                        padding: '0 10px',
                                        height: '32px',
                                        border: 'none',
                                        borderRadius: '0',
                                        backgroundColor: mode === 1 ? '#ffadd2' : mode === 2 ? '#bae637' : '#91d5ff', // Màu sắc khác nhau
                                        color: '#000',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: 'none',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        zIndex: 1,
                                        ...(modeDigitalInput === mode && {
                                            border: '2px solid #1890ff', // Viền highlight khi active
                                            zIndex: 2,
                                            // marginRight: 1
                                        }),
                                    }}
                                >
                                    {mode}
                                </Button>
                            ))}
                        </div>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSaveAll}
                            loading={isSaving}
                            disabled={isSaving || !hasChanges}
                            style={{ marginLeft: "20px" }}
                        >
                            Lưu tất cả thay đổi
                        </Button>
                    </div>
                </div>
            }
            open={isVisible}
            onCancel={onCancel}
            width={1700}
            footer={null}
            destroyOnClose
            maskClosable={false}
            style={{ top: 10 }}
            bodyStyle={{ maxHeight: 'calc(100vh - 60px)', padding: '10px 24px', overflowY: "auto" }}
        >

            <Row gutter={10} style={{ marginTop: '10px' }}>
                <Col span={9}>
                    <div style={{ background: `${backgroundForm}`, padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Thông tin cơ bản</Divider>
                        <Form
                            form={basicInfoForm}
                            layout="vertical"
                            onValuesChange={updateGlobalHasChanges}
                        >
                            <Row gutter={16} align="bottom">
                                <Col span={24}>
                                    <Form.Item
                                        name="name"
                                        label="Tên thiết bị"
                                        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}
                                    >
                                        <Input placeholder="Nhập tên thiết bị" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16} align="bottom">
                                <Col span={24}>
                                    <Form.Item
                                        name="mac"
                                        label="Địa chỉ MAC"
                                    >
                                        <Input disabled placeholder="Địa chỉ MAC cố định" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: `${backgroundForm}`, padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>RS232</Divider>
                        <Form
                            form={rs232Form}
                            layout="vertical"
                            onValuesChange={updateGlobalHasChanges}
                        >
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item
                                        name={['rs232Config', 'baudrate']}
                                        label="Baudrate"
                                        rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS232!' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="9600" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16} align="bottom">
                                <Col span={24}>
                                    <Form.Item
                                        name={['rs232Config', 'serialConfig']}
                                        label="Cấu hình Serial"
                                        rules={[{ required: true, message: 'Vui lòng nhập cấu hình Serial!' }]}
                                    >
                                        <Input placeholder="8N1" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: `${backgroundForm}`, padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>RS485</Divider>
                        <Form
                            form={rs485Form}
                            layout="vertical"
                            onValuesChange={updateGlobalHasChanges}
                        >
                            <Row gutter={20}>
                                <Col span={24}>
                                    <Form.Item
                                        name={['rs485Config', 'baudrate']}
                                        label="Baudrate"
                                        rules={[{ required: true, message: 'Vui lòng nhập Baudrate RS485!' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="9600" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16} align="bottom">
                                <Col span={24}>
                                    <Form.Item
                                        name={['rs485Config', 'serialConfig']}
                                        label="Cấu hình Serial"
                                        rules={[{ required: true, message: 'Vui lòng nhập cấu hình Serial!' }]}
                                    >
                                        <Input placeholder="8N1" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider orientation="left" style={{ marginTop: -3, marginBottom: 10 }}>Cấu hình ID & Địa chỉ RS485</Divider>
                            <Form.List name={['rs485Config', 'idAddresses']}>
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{ background: '#e6e6e6', borderRadius: '5px', marginBottom: '10px' }}>
                                                <Row gutter={[16, 16]}>
                                                    <Col span={10}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'id']}
                                                            rules={[{ required: true, message: 'Vui lòng nhập ID!' }, { type: 'number', message: 'ID phải là số!' }]}
                                                            style={{ flex: 1, marginBottom: 0 }}
                                                        >
                                                            <InputNumber style={{ width: '100%' }} placeholder="ID (ví dụ: 1)" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={13}>
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
                                                    </Col>
                                                    <MinusCircleOutlined onClick={() => remove(name)} style={{marginBottom: 6}} />
                                                </Row>
                                            </div>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add({ id: null, address: '' })} block icon={<PlusOutlined />} disabled={isSaving}>
                                                Thêm ID & Địa chỉ RS485
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form>
                    </div>

                    <div style={{ background: `${backgroundForm}`, padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>CAN</Divider>
                        <Form
                            form={canForm}
                            layout="vertical"
                            onValuesChange={updateGlobalHasChanges}
                        >
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item
                                        name={['canConfig', 'baudrate']}
                                        label="Baudrate"
                                        rules={[{ required: true, message: 'Vui lòng nhập Baudrate CAN!' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="51000" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>
                </Col>

                <Col span={15}>
                    <div style={{ background: `${backgroundForm}`, padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>WiFi</Divider>
                        <Form
                            form={wifiForm}
                            layout="vertical"
                            onValuesChange={updateGlobalHasChanges}
                        >
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
                            <Row gutter={16}>
                                <Col span={8}>
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
                                    >
                                        <Input placeholder="192.168.1.1" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
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
                                    >
                                        <Input placeholder="255.255.255.0" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['wifiConfig', 'dns']}
                                        label="DNS"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng DNS không hợp lệ!' }]}
                                    >
                                        <Input placeholder="8.8.8.8" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: `${backgroundForm}`, padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>Ethernet</Divider>
                        <Form
                            form={ethernetForm}
                            layout="vertical"
                            onValuesChange={updateGlobalHasChanges}
                        >
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
                                    >
                                        <Input placeholder="255.255.255.0" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'mac']}
                                        label="Địa chỉ MAC"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập địa chỉ mac!' },
                                            { pattern: macRegex, message: 'Định dạng MAC không hợp lệ!' }
                                        ]}
                                    >
                                        <Input placeholder="DE:AD:BE:EF:FE:ED" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['ethernetConfig', 'dns']}
                                        label="DNS"
                                        rules={[{ pattern: ipRegex, message: 'Định dạng DNS không hợp lệ!' }]}
                                    >
                                        <Input placeholder="8.8.8.8" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: `${backgroundForm}`, padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>MQTT</Divider>
                        <Form
                            form={mqttForm}
                            layout="vertical"
                            onValuesChange={updateGlobalHasChanges}
                        >
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
                            <Row gutter={16}>
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
                                        rules={[{ required: true, message: 'Vui lòng nhập Subscribe Topic!' }]}
                                    >
                                        <Input placeholder="device/response/" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'pubTopic']}
                                        label="Publish Topic"
                                        rules={[{ required: true, message: 'Vui lòng nhập Publish Topic!' }]}
                                    >
                                        <Input placeholder="device_send/" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'qos']}
                                        label="QoS"
                                        rules={[{ required: true, message: 'Vui lòng nhập Qos!' },
                                            { type: 'number', min: 0, max: 1, message: 'QoS không hợp lệ (0-1)!' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="1" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name={['mqttConfig', 'keepAlive']}
                                        label="Keep Alive (giây)"
                                        rules={[{ type: 'number', min: 0, message: 'Keep Alive không hợp lệ!' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} placeholder="60" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    <div style={{ background: `${backgroundForm}`, padding: '16px', borderRadius: '8px', marginBottom: '10px' }}>
                        <Divider orientation="left" style={{marginTop: '-5px', fontWeight: 'bold'}}>TCP</Divider>
                        <Form
                            form={tcpForm}
                            layout="vertical"
                            onValuesChange={updateGlobalHasChanges}
                        >
                            <label style={{color: "#000", marginBottom: '2px', display: 'block'}}>Cấu hình IP & địa chỉ TCP</label>
                            <Form.List name={['tcpConfig', 'ipAddresses']}>
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{ background: '#e6e6e6', borderRadius: '5px', marginBottom: '10px' }}>
                                                <Row gutter={[16, 16]} style={{display: "flex", alignItems: "center"}}>
                                                    <Col span={8}>
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
                                                    </Col>
                                                    <Col span={8}>
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
                                                    </Col>
                                                    <MinusCircleOutlined onClick={() => remove(name)} style={{marginBottom: 6}} />
                                                </Row>
                                            </div>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add({ ip: '', address: '' })} block icon={<PlusOutlined />} disabled={isSaving}>
                                                Thêm cấu hình IP & Địa chỉ TCP
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Modal>
    );
};

export default EditIotModal;