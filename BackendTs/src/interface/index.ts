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
    address: number[]; // Address sẽ là mảng các số khi được parse từ JSON
}

interface Rs485Config {
    baudrate?: number;
    serialConfig?: string;
    idAddresses?: Rs485IdAddress[];
}

interface TcpConnection {
    ip: string;
    address: number[]; // Address sẽ là mảng các số khi được parse từ JSON
}

interface TcpConfig {
    ips?: TcpConnection[];
}

interface Rs232Config {
    baudrate?: number;
    serialConfig?: string;
}

interface CanConfig {
    baudrate?: number;
}

export interface MasterIotInterface {
    id?: number;
    name?: string;
    deviceId?: string; // Đã đổi device_id thành camelCase
    mac?: string;
    ip?: string;
    type?: number;
    note?: string;
    userCreated?: number; // Đã đổi user_created thành camelCase
    timeCreated?: string; // Đã đổi time_created thành camelCase, kiểu string cho Date hoặc Date
    userUpdated?: number; // Đã đổi user_updated thành camelCase
    timeUpdated?: string; // Đã đổi time_updated thành camelCase, kiểu string cho Date hoặc Date
    isdelete?: boolean;
    tcpStatus?: 'requestOpen' | 'opened' | 'requestClose' | 'closed'; // Đã đổi tcp_status thành camelCase
    udpStatus?: 'requestOpen' | 'opened' | 'requestClose' | 'closed'; // Đã đổi udp_status thành camelCase

    // Các trường JSON
    wifiConfig?: WifiConfig;
    ethernetConfig?: EthernetConfig;
    mqttConfig?: MqttConfig;
    rs485Config?: Rs485Config;
    tcpConfig?: TcpConfig;
    rs232Config?: Rs232Config;

    canConfig?: CanConfig; // Đã đổi can_baudrate thành camelCase

    firmwareVersionId?: number; // Đã đổi firmware_version_id thành camelCase
}

export interface IotStatusInterface {
    iotId?: number;
    connected?: boolean;
    input?: boolean;
    output?: boolean;
}

export interface MasterPayloadInterface {
    id?: number;
    name?: string;
    hex_symbols?: string;
    decriptions?: string;
    js_type?: string;
    note?: string;
    time_created?: string;
    time_updated?: string;
    isdelete?: boolean
}

export interface CMDFieldInterface {
    id?: number;
    cmd_id?: number;
    name?: string;
    decriptions?: string;
    unit?: string;
    isdelete?: boolean
}

export interface MasterIotCMDInterface {
    id?: number;
    name?: string;
    hex_symbols?: string;
    decriptions?: string;
    type?: string;
    note?: string;
    iot_cmd_field?: CMDFieldInterface[];
    time_created?: string;
    time_updated?: string;
    isdelete?: boolean
}

export interface DataMsgInterface {
    device_id?: number;
    CMD?: string;
    CMD_Decriptions?: string;
    dataName?: string;
    payload_name?: string;
    data?: number,
    unit?: string,
    time?: string,
}