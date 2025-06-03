import axios from 'axios';
import { config } from '../../config';
import { pushData, updateData, findDataWithID } from '../../global/IotData.global';
import { uid } from 'uid';
import { Request, Response } from 'express';
import { iotsLogger } from '../../config/logger/iots.logger';
import { FindOneData, CreateData } from '../../services/iot.services';
import { EmitData } from '../../sockets/emit';
import { setMaxListeners } from 'winston-daily-rotate-file';
import { MasterIotGlobal, IotStatusGlobal } from '../../global';
const BROKER_HOST = `http://${config.mqtt.host}:18083`;

export const isValidMAC = (text: string): boolean => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(text);
};

export const checkActiveClients = async () => {

};

export const loginMqtt = async () => {
    const url = `${BROKER_HOST}/api/v5/login`;
    const data = {
        username: config.mqtt.username,
        password: config.mqtt.password,
    };
    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return {
            status: true,
            token: response.data.token
        };
    } catch (error: any) {
        return {
            status: false,
            token: error.response ? error.response.data : error.message
        };
    }
};

export const getListClients = async () => {
    const resToken = await loginMqtt();
    if (resToken.status) {
        try {
            const clientsRes = await axios.get(`${BROKER_HOST}/api/v5/clients`,
                {
                    headers: {
                        Authorization: `Bearer ${resToken.token}`
                    }
                });
            const clients = clientsRes.data.data;
            const clientsMap = new Map();
            for (const client of clients) {
                if (isValidMAC(client.clientid)) {
                    const IotObj: any =
                    {
                        name: '',
                        device_id: uid(32),
                        mac: client.clientid,
                        ip: client.ipaddress,
                        username: client.username,
                        isdelete: true,
                    }
                    let iot_id = 0;
                    const dataObj: any = await FindOneData({ mac: client.clientid });
                    if (!dataObj) {
                        const dataNew: any = await createNewClient(IotObj);
                        iot_id = dataNew.id;
                        IotObj.id = iot_id;
                        MasterIotGlobal.update(IotObj);
                        EmitData("iot_update_client", IotObj);
                    }
                    else {
                        iot_id = dataObj.id;
                    }
                    const IotStatusObj: any =
                    {
                        iotId: iot_id,
                        firm_ware: '',
                        connected: true,
                        input: false,
                        output: false,
                    }
                    EmitData("iot_update_status", [IotStatusObj]);
                    await updateStatusClient(IotStatusObj);
                }
            }
            return clientsMap;
        } catch (error: any) {
            console.error("Lỗi khi lấy danh sách clients:", error.response ? error.response.data : error.message);
        }
    } else {
        console.error("Lỗi đăng nhập MQTT:", resToken.token);
    }
};

export const connectedClients = async (req: Request, res: Response) => {
    const { clientid, username, ipaddress, event } = req.body;
    res.status(200).send("OK");
    if (isValidMAC(clientid)) {
        const IotObj: any =
        {
            name: '',
            device_id: uid(32),
            mac: clientid,
            ip: ipaddress,
            username: username,
            isdelete: true,
        }
        let iot_id = 0;
        const dataObj: any = await FindOneData({ mac: clientid });
        if (!dataObj) {
            const dataNew: any = await createNewClient(IotObj);
            iot_id = dataNew.id;
            IotObj.id = iot_id;
            MasterIotGlobal.update(IotObj);
            EmitData("iot_update_client", IotObj);
        }
        else {
            iot_id = dataObj.id;
        }
        const IotStatusObj: any =
        {
            iotId: iot_id,
            firm_ware: '',
            connected: true,
            input: false,
            output: false,
        }
        EmitData("iot_update_status", [IotStatusObj]);
        await updateStatusClient(IotStatusObj);
    }
};

export const disconnectedClients = async (req: Request, res: Response) => {
    const { clientid, username, ipaddress, event } = req.body;
    iotsLogger.info(`🔥 Client mất kết nối: ${clientid} (${username})`);
    res.status(200).send("OK");
    if (isValidMAC(clientid)) {
        const dataObj: any = await FindOneData({ mac: clientid });
        if (dataObj) {
            const IotStatusObj: any =
            {
                iotId: dataObj.id,
                firm_ware: '',
                connected: false,
                input: false,
                output: false,
            }
            EmitData("iot_update_status", [IotStatusObj]);
            await updateStatusClient(IotStatusObj);
        }
    }
};

export const createNewClient = async (clientObj: any) => {
    return await CreateData({
        name: clientObj.name,
        device_id: clientObj.device_id,
        mac: clientObj.mac,
        type: 0,
        isdelete: 1,
    });
};

export const updateStatusClient = async (clientStatusObj: any) => {
    await updateData(clientStatusObj);
    IotStatusGlobal.update(clientStatusObj);
};
