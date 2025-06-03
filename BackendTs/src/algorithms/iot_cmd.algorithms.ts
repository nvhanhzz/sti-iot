import { Request, Response } from "express";
import { MasterIotCMDGlobal } from "../global";
import { FindOneDataIotCmd, CreateDataIotCmd, UpdateDataIotCmd, UpdateDataIotCmdField, BulkCreateIotCmdFile } from "../services/iot_cmd.services";

export const AlgorithmGetIotCMD = async (req: Request) => {
    try {
        const allCMD = MasterIotCMDGlobal.getAll();
        return {
            status: true,
            data: allCMD
        };
    }
    catch (error) {
        return {
            status: false,
            msg: error
        };
    }
};

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
            const data: any = {
                name: name,
                hex_symbols: hex_symbols,
                decriptions: decriptions,
                type: type,
                note: note,
                isdelete: 0,
            }
            const dataNew: any = await CreateDataIotCmd(data);
            data.id = dataNew.id;
            MasterIotCMDGlobal.update(data);
            return {
                status: 200,
                message: 94,
                data: data
            }
        }
        else {
            const check_iot_cmd = await FindOneDataIotCmd({
                where:
                {
                    id: id
                }
            });
            if (check_iot_cmd) {
                let data: any = {
                    id: id,
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
                MasterIotCMDGlobal.update(data);
                return {
                    status: 200,
                    message: 94,
                    data: data
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