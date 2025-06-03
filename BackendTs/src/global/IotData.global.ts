import { sendIOTStatus } from "../sockets/emit";

export interface IOTDataInterface {
    iot_id?: number;
    firm_ware?: string;
    connected?: boolean;
    input?: boolean;
    output?: boolean;
}


const IOT_Data: IOTDataInterface[] = [];

export const replaceData = (dataNew: IOTDataInterface[]) => {
    IOT_Data.length = 0;
    IOT_Data.push(...dataNew);
};

export const pushData = (dataIots: IOTDataInterface) => {
    IOT_Data.push(dataIots);
};

export const findDataWithID = (iot_id: number) => {
    const dataDetail: any = IOT_Data.find((e) => e.iot_id == iot_id);
    return dataDetail;
};

export const updateData = (dataIots: IOTDataInterface) => {
    if (!dataIots.iot_id) return; // Tránh lỗi nếu không có ID
    const index = IOT_Data.findIndex(e => e.iot_id === dataIots.iot_id);
    if (index !== -1) {
        // Cập nhật dữ liệu đã có
        IOT_Data[index] = { ...IOT_Data[index], ...dataIots };
    } else {
        // Thêm mới nếu chưa có
        IOT_Data.push(dataIots);
    }
};

export const getDataIotGlobal = (): IOTDataInterface[] => IOT_Data;