export interface MasterIotInterface {
    id?: number;
    name?: string;
    device_id?: string;
    mac?: string;
    ip?: string; // New: General IP if any, otherwise specific ones like wifi_ip, ethernet_ip
    type?: number;
    note?: string;
    user_created?: number;
    time_created?: string; // Assuming string for Date, or Date if you prefer
    user_updated?: number;
    time_updated?: string; // Assuming string for Date, or Date if you prefer
    isdelete?: boolean;
    tcp_status?: 'requestOpen' | 'opened' | 'requestClose' | 'closed';
    udp_status?: 'requestOpen' | 'opened' | 'requestClose' | 'closed';

    // Wifi
    wifi_ssid?: string;
    wifi_password?: string;
    wifi_ip?: string;
    wifi_gateway?: string;
    wifi_subnet?: string;
    wifi_dns?: string;

    // Ethernet
    ethernet_ip?: string;
    ethernet_gateway?: string;
    ethernet_subnet?: string;
    ethernet_mac?: string;
    ethernet_dns?: string;

    // MQTT
    mqtt_mac?: string;
    mqtt_ip?: string;
    mqtt_gateway?: string;
    mqtt_subnet?: string;
    mqtt_dns?: string;

    // RS485
    rs485_id?: number;
    rs485_addresses?: string;
    rs485_baudrate?: number;
    rs485_serial_config?: string;

    // CAN
    can_baudrate?: number;

    // RS232
    rs232_baudrate?: number;
    rs232_serial_config?: string;

    // Firmware Version (updated to be a foreign key)
    firmware_version_id?: number; // Trỏ đến id của bảng FirmwareVersion
    // Nếu bạn muốn bao gồm cả thông tin FirmwareVersion khi include,
    // có thể thêm một trường lồng vào (nếu bạn sử dụng kiểu dữ liệu lồng)
    // firmware?: {
    //     id: number;
    //     versionNumber: string;
    //     // ... các trường khác của FirmwareVersion nếu cần
    // };
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