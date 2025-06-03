export interface PacketInterface {
    _id?: React.Key,
    name?: string,
    hex_symbols?: string,
    description?: string,
    type?: number,
    isdelete?: boolean
}

export interface IotCMDInterface {
    id?: React.Key,
    name?: string,
    hex_symbols?: string,
    decriptions?: string,
    type?: number,
    note?: string,
    user_created?: string,
    time_created?: string,
    isdelete?: boolean
}

export interface IotCMDFieldInterface {
    id?: React.Key,
    cmd_id?: string,
    name?: string,
    decriptions?: string,
    isdelete?: boolean
}

export interface PayloadTypeInterface {
    id?: React.Key,
    name?: string,
    hex_symbols?: string,
    decriptions?: string,
    js_type?: number,
    note?: string,
    user_created?: string,
    time_created?: string,
    isdelete?: boolean
}