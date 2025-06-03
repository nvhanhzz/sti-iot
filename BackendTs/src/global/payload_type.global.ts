export interface PayloadTypeInterface {
    id?: string;
    name?: string;
    hex_symbols?: string;
    decriptions?: string;
    js_type?: Number;
    note?: string;
    time_created?: string;
    time_updated?: string;
    isdelete?: boolean
}
const PAYLOAD_TYPE_DATA: PayloadTypeInterface[] = [];

export const replaceDataPayloadType = (dataNew: PayloadTypeInterface[]) => {
    PAYLOAD_TYPE_DATA.length = 0;
    PAYLOAD_TYPE_DATA.push(...dataNew);
};

export const pushDataPayloadType = (dataIots: PayloadTypeInterface) => {
    PAYLOAD_TYPE_DATA.push(dataIots);
};

export const getPayloadTypeGlobal = (): PayloadTypeInterface[] => PAYLOAD_TYPE_DATA;