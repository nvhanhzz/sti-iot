import { MasterIotInterface, IotStatusInterface, MasterPayloadInterface, MasterIotCMDInterface, DataMsgInterface } from "../interface";

// Global Storage
const MASTER_IOT: MasterIotInterface[] = [];
const IOT_STATUS: IotStatusInterface[] = [];
const MASTER_PAYLOAD: MasterPayloadInterface[] = [];
const MASTER_IOT_CMD: MasterIotCMDInterface[] = [];
const DATA_MSG: DataMsgInterface[] = [];

const createGlobalDataService = <T>(store: T[], key: keyof T) => ({
    getAll: (): T[] => store,
    replaceAll: (newData: T[]): void => {
        store.length = 0;
        store.push(...newData);
    },
    findById: (id: any): T | undefined => {
        return store.find((item) => item[key] === id);
    },
    findByMac: (mac: any): T | undefined => {
        return store.find((item: any) => item['mac'] === mac);
    },
    fillById: (id: any): T[] => {
        return store.filter((item) => item[key] === id);
    },
    fillByMac: (mac: any): T[] => {
        return store.filter((item: any) => item['mac'] === mac);
    },
    update: (newItem: T): void => {
        const id = newItem[key];
        if (!id) return;
        const index = store.findIndex((item) => item[key] === id);
        if (index !== -1) {
            store[index] = { ...store[index], ...newItem };
        } else {
            store.push(newItem);
        }
    },
    updateMultipleKey: (newItem: T, keys: (keyof T)[] = [key]): void => {
        // Tìm phần tử trùng theo tất cả các key
        const index = store.findIndex((item) =>
            keys.every((k) => item[k] === newItem[k])
        );

        if (index !== -1) {
            store[index] = { ...store[index], ...newItem };
        } else {
            store.push(newItem);
        }
    },
    replaceById: (newItem: T): boolean => {
        const idValue = newItem[key];
        if (idValue === undefined || idValue === null) {
            console.warn(`ID is missing in newItem for replaceById. Key: ${String(key)}`);
            return false;
        }
        const index = store.findIndex((item) => item[key] === idValue);
        if (index !== -1) {
            store[index] = newItem;
            return true;
        }
        return false;
    },
    replaceByMultipleKeys: (newItem: T, keys: (keyof T)[] = [key]): boolean => {
        // Kiểm tra tất cả các key có giá trị hợp lệ
        const hasValidKeys = keys.every((k) =>
            newItem[k] !== undefined && newItem[k] !== null
        );

        if (!hasValidKeys) {
            console.warn(`One or more keys are missing in newItem for replaceByMultipleKeys. Keys: ${keys.map(String).join(', ')}`);
            return false;
        }

        // Tìm phần tử trùng theo tất cả các key
        const index = store.findIndex((item) =>
            keys.every((k) => item[k] === newItem[k])
        );

        if (index !== -1) {
            // Thay thế hoàn toàn, không merge
            store[index] = newItem;
            return true;
        } else {
            // Nếu không tìm thấy, thêm mới
            store.push(newItem);
            return true;
        }
    }
});

// Dịch vụ xử lý dữ liệu
//Dữ Liệu Master
export const MasterIotGlobal = createGlobalDataService<MasterIotInterface>(MASTER_IOT, "id");
export const MasterPayloadGlobal = createGlobalDataService<MasterPayloadInterface>(MASTER_PAYLOAD, "id");
export const MasterIotCMDGlobal = createGlobalDataService<MasterIotCMDInterface>(MASTER_IOT_CMD, "id");

//Dữ Liệu Khác
export const IotStatusGlobal = createGlobalDataService<IotStatusInterface>(IOT_STATUS, "iotId");
export const DataMsgGlobal = createGlobalDataService<DataMsgInterface>(DATA_MSG, "device_id");