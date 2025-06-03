export interface IotPayloadInterface {
    CMD?: string;
    payload?: any;
    crc?: string;
    mac?: string;
    topic?: string;
    status?: string;
    type?: Number;
    time?: any;
}
const IOT_PAYLOAD_DATA: IotPayloadInterface[] = [];

export const replaceDataIotPayload = (dataNew: IotPayloadInterface[]) => {
    IOT_PAYLOAD_DATA.length = 0;
    IOT_PAYLOAD_DATA.push(...dataNew);
};

export const pushDataIotPayload = (dataIots: IotPayloadInterface) => {
    IOT_PAYLOAD_DATA.push(dataIots);
};

export const updateDataIotPayload = (dataUpdate: any) => {
    const dataDetailIndex: any = IOT_PAYLOAD_DATA.findIndex((e: any) => e.device_id == dataUpdate.device_id && e.CMD == dataUpdate.CMD);
    console.log(dataDetailIndex);
    if (dataDetailIndex >= 0) {
        IOT_PAYLOAD_DATA[dataDetailIndex] = dataUpdate;
    }
    else {
        IOT_PAYLOAD_DATA.push(dataUpdate);
    }
    return true;
};
export const getDataIotPayloadWithDeviceId = (device_id: any) => {
    const dataDetail: any = IOT_PAYLOAD_DATA.filter((e: any) => e.device_id == device_id);
    return dataDetail;
};
export const getIotPayloadGlobal = (): IotPayloadInterface[] => IOT_PAYLOAD_DATA;