export interface MasterIotInterface {
    id?: number;
    name?: string;
    device_id?: string;
    mac?: string;
    note?: string;
    time_created?: string;
    time_updated?: string;
    isdelete?: boolean
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