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
import logger from "../../config/logger";
import models from "../../models/sql";
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
        const dataObj: any = await FindOneData({ mac: clientid });
        if (dataObj) {
            const IotStatusObj: any =
                {
                    iotId: dataObj.id,
                    firm_ware: '',
                    connected: true,
                    input: false,
                    output: false,
                }
            await EmitData("iot_update_status", [IotStatusObj]);
            await updateStatusClient(IotStatusObj);
        }
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
            await EmitData("iot_update_status", [IotStatusObj]);
            await updateStatusClient(IotStatusObj);
        }
    }
};

interface RegisterMessageRequest {
    mac: string;
    version: string;
    wifi: object;
    mqtt: object;
}

export const registerClient = async (messageRequest: RegisterMessageRequest) => {
    logger.info(`[RegisterClient] Received registration request for MAC: ${messageRequest.mac}`);

    try {
        const { mac, version, wifi, mqtt } = messageRequest;

        if (!isValidMAC(mac)) {
            return;
        }

        const firmwareVersionRecord = await models.FirmwareVersion.findOne({
            where: { versionNumber: version }
        });

        if (!firmwareVersionRecord) {
            logger.warn(`[RegisterClient] Registration rejected for MAC ${mac}: Firmware version '${version}' not found in the system.`);
            return;
        }
        logger.info(`[RegisterClient] Firmware version '${version}' found (ID: ${firmwareVersionRecord.id}).`);

        let iotDevice = await models.IotSettings.findOne({
            where: { mac: mac }
        });

        if (iotDevice) {
            logger.warn(`[RegisterClient] Registration rejected for MAC ${mac}: Device already exists. Creation of new devices is only allowed.`);
            return;
        }

        logger.info(`[RegisterClient] Registering new device with MAC: ${mac}.`);

        const createPayload: { [key: string]: any } = {
            mac: mac,
            name: '',
            device_id: uid(32),
            ip: null,
            wifiConfig: wifi,
            mqttConfig: mqtt,
            firmware_version_id: firmwareVersionRecord.id,
            type: 0,
            isdelete: true,
            tcp_status: 'closed',
            udp_status: 'closed',
            ethernetConfig: null,
            rs485Config: null,
            tcpConfig: null,
            canConfig: null,
            rs232Config: null,
        };

        const filteredCreatePayload: { [key: string]: any } = {};
        for (const key in createPayload) {
            if (createPayload.hasOwnProperty(key)) {
                const value = createPayload[key];
                if (value !== null && typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0)) {
                    filteredCreatePayload[key] = value;
                }
            }
        }

        iotDevice = await models.IotSettings.create(filteredCreatePayload);
        logger.info(`[RegisterClient] Successfully registered new device with MAC: ${mac} and ID: ${iotDevice.id}.`);

        MasterIotGlobal.update(iotDevice);
        await EmitData("iot_update_client", iotDevice);
        logger.info(`[RegisterClient] Updated MasterIotGlobal for new device ${mac}.`);

    } catch (error: any) {
        logger.error(`[RegisterClient] Error processing registration for MAC ${messageRequest.mac}:`, error);
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
    updateData(clientStatusObj);
    IotStatusGlobal.update(clientStatusObj);
};
