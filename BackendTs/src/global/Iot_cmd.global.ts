export interface IOTCMDInterface {
    id?: string;
    name?: string;
    hex_symbols?: string;
    decriptions?: string;
    iot_cmd_field: any;
    type?: Number;
    note?: string;
    time_created?: string;
    time_updated?: string;
    isdelete?: boolean
}
const IOT_CMD_Data: IOTCMDInterface[] = [];

export const replaceDataIotCmd = (dataNew: IOTCMDInterface[]) => {
    IOT_CMD_Data.length = 0;
    IOT_CMD_Data.push(...dataNew);
};
export const pushDataIotCmd = (dataIots: IOTCMDInterface) => {
    IOT_CMD_Data.push(dataIots);
};

export const getDataIotCmdGlobal = (): IOTCMDInterface[] => IOT_CMD_Data;