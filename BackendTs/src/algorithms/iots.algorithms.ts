import { Request, Response } from "express";
import { FindOneData, CreateData, UpdateData } from "../services/iot.services";
import { FindOneDataIotCmd, CreateDataIotCmd, UpdateDataIotCmd, UpdateDataIotCmdField, BulkCreateIotCmdFile } from "../services/iot_cmd.services";
import { MasterIotGlobal } from "../global";
export const AlgorithmGetIot = async () => {
    try {
        const allIots = MasterIotGlobal.getAll();
        return {
            status: true,
            data: allIots
        };
    }
    catch (error) {
        return {
            status: false,
            msg: error
        };
    }
};

export const UpdateDataIotsDetail = async (req: Request) => {
    try {
        const { id, name, device_id, mac, type } = req.body;
        let finalData: any = null;
        const existingData: any = await FindOneData({ id });
        if (existingData) {
            await UpdateData(
                {
                    name: name,
                    type: type,
                    isdelete: 0
                },
                { id: existingData.id }
            );
        } else {
            await CreateData({
                id,
                name,
                device_id,
                mac,
                type,
            });
        }
        finalData = await FindOneData({ id });
        MasterIotGlobal.update(finalData.get({ plain: true }));
        return {
            status: 200,
            message: 103,
            data: finalData,
        };
    } catch (error) {
        console.error('Lỗi khi update hoặc tạo dữ liệu:', error);
        return {
            status: 500,
            data: error,
        };
    }
};


export const AlgorithmLockIot = async (req: Request) => {
    const { id } = req.body;
    const get_data_iot: any = await FindOneData({
        id: id,
    });

    if (get_data_iot) {
        await UpdateData(
            {
                isdelete: get_data_iot.isdelete == 1 ? 0 : 1,
            },
            { id: id }
        );
        let finalData = await FindOneData({ id });
        return {
            status: 200,
            message: get_data_iot.isdelete == 0 ? 104 : 105,
            data: finalData,
        };
    }
    else {
        return {
            'status': 500,
            'message': 95
        };
    }
};

// iot command
export const AlgorithmSettingIotCmd = async (req: Request) => {
    try {
        const { id, name, hex_symbols, decriptions, type, note } = req.body;

        let check_name_iot_cmd = await FindOneDataIotCmd({
            where: {
                name: name
            },
        });

        if (!id) {
            if (check_name_iot_cmd) {
                return {
                    status: 500,
                    message: 93
                };
            }

            await CreateDataIotCmd({
                name: name,
                hex_symbols: hex_symbols,
                decriptions: decriptions,
                type: type,
                note: note,
                isdelete: 0
            });

            return {
                status: 200,
                message: 94
            }
        }
        else {
            const check_iot_cmd = await FindOneDataIotCmd({
                where: {
                    id: id
                }
            });
            if (check_iot_cmd) {
                let data = {
                    name: name,
                    hex_symbols: hex_symbols,
                    decriptions: decriptions,
                    type: type,
                    note: note,
                };

                await UpdateDataIotCmd(
                    data,
                    { where: { id: id } }
                );

                return {
                    status: 200,
                    message: 94
                }
            }
            else {
                return {
                    status: 500,
                    message: 95
                }
            }
        }
    } catch (error) {
        return {
            status: 500,
            data: error
        }
    }
}

export const AlgorithmLockIotCmd = async (req: Request) => {
    const { id } = req.body;
    const get_data_iot_cmd: any = await FindOneDataIotCmd({
        where: {
            id: id,
        },
    });
    if (get_data_iot_cmd) {
        await UpdateDataIotCmd(
            {
                isdelete: get_data_iot_cmd.isdelete == 1 ? 0 : 1,
            },
            { where: { id: id } }
        );
        return {
            'status': 200,
            'message': get_data_iot_cmd.isdelete == 0 ? 96 : 97
        };
    }
    else {
        return {
            'status': 500,
            'message': 95
        };
    }
};

export const AlgorithmSettingIotCmdField = async (req: Request) => {
    const { cmd_id, cmd_field } = req.body;
    const check_iot_cmd = await FindOneDataIotCmd({
        where: {
            id: cmd_id
        }
    });

    if (check_iot_cmd) {

        await UpdateDataIotCmdField(
            {
                isdelete: 1
            },
            { where: { cmd_id: `${cmd_id}` } }
        );

        let data_iot_cmd_field = cmd_field.map(function (v: any) {
            return {
                cmd_id: cmd_id ?? null,
                name: v.name ?? null,
                decriptions: v.decriptions ?? null,
                isdelete: 0,
            };
        });

        if (data_iot_cmd_field.length > 0) {
            await BulkCreateIotCmdFile(data_iot_cmd_field);
        }

        return {
            status: 200,
            message: 94,
        };

    }
};
