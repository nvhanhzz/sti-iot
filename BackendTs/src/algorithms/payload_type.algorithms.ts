import { Request, Response } from "express";
import { getPayloadTypeGlobal } from "../global/payload_type.global";
import { FindOneDataPayloadType, CreateDataPayloadType, UpdateDataPayloadType } from "../services/payload_type.services";
import { MasterPayloadGlobal } from "../global";

export const AlgorithmGetPayloadType = async (req: Request) => {
    try {
        const allPayloadType = MasterPayloadGlobal.getAll();
        return {
            status: true,
            data: allPayloadType
        };
    }
    catch (error) {
        return {
            status: false,
            msg: error
        };
    }
};

export const algorithmsUpdateDataPayloadType = async (req: Request) => {
    const payloadTypeGlobal = await getPayloadTypeGlobal();
    const { data } = req.body;
    if (data.id) {
        const findIndex = payloadTypeGlobal.findIndex((e: any) => e.id == data.id);
        if (findIndex >= 0) {

        }
    }
    else {

    }
}

export const AlgorithmSettingPayloadType = async (req: Request) => {
    try {
        const { id, name, hex_symbols, decriptions, js_type, note } = req.body;
        let check_name_payload_type = await FindOneDataPayloadType({
            where:
            {
                name: name
            },
        });
        if (!id) {
            if (check_name_payload_type) {
                return {
                    status: 500,
                    message: 98
                };
            }
            let data: any = {
                name: name,
                hex_symbols: hex_symbols,
                decriptions: decriptions,
                js_type: js_type,
                note: note,
            };
            const dataNew: any = await CreateDataPayloadType({
                name: name,
                hex_symbols: hex_symbols,
                decriptions: decriptions,
                js_type: js_type,
                note: note,
                isdelete: 0
            });
            data.id = dataNew.id;
            MasterPayloadGlobal.update(data);
            return {
                status: 200,
                message: 99,
                data: data
            }
        }
        else {
            const check_payload_type = await FindOneDataPayloadType({
                where:
                {
                    id: id
                }
            });
            if (check_payload_type) {
                let data = {
                    id: id,
                    name: name,
                    hex_symbols: hex_symbols,
                    decriptions: decriptions,
                    js_type: js_type,
                    note: note,
                };
                await UpdateDataPayloadType(
                    data,
                    {
                        where:
                        {
                            id: id
                        }
                    }
                );
                MasterPayloadGlobal.update(data);
                return {
                    status: 200,
                    message: 99,
                    data: data
                }
            }
            else {
                return {
                    status: 500,
                    message: 100
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

export const AlgorithmLockPayloadType = async (req: Request) => {
    const { id } = req.body;
    const get_data_payload_type: any = await FindOneDataPayloadType({
        where: {
            id: id,
        },
    });
    if (get_data_payload_type) {
        await UpdateDataPayloadType
            (
                {
                    isdelete: get_data_payload_type.isdelete == 1 ? 0 : 1,
                },
                { where: { id: id } }
            );
        return {
            'status': 200,
            'message': get_data_payload_type.isdelete == 0 ? 101 : 102
        };
    }
    else {
        return {
            'status': 500,
            'message': 100
        };
    }
};
