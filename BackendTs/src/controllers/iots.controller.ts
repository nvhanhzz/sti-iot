import { Request, Response } from "express";
import { getDataIotGlobal } from "../global/IotData.global";
import { UpdateDataIotsDetail, AlgorithmLockIot, AlgorithmGetIot } from "../algorithms/iots.algorithms";
import { ConvertDataHextoJson, ConvertDataJsonToHex } from "../algorithms/data.algorithms";
import { sendIOTMsgPush, EmitData } from "../sockets/emit";
import { getIotPayloadGlobal, updateDataIotPayload } from "../global/Io_payload.globals";
import { iotsLogger } from "../config/logger/iots.logger";
import { GetDataIot, DistinctDataIot } from "../services/iot.services";
import { MasterIotGlobal, DataMsgGlobal } from "../global";
import publishMessage from "../mqtt/publish";
import client from "../mqtt";
import moment from "moment";
import {MasterIotInterface} from "../interface";


export const sendDataIots = async (req: Request, res: Response) => {
    try {
        const dataIots: any = await AlgorithmGetIot();
        res.status(200).send(dataIots);
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const SendDistinctIots = async (req: Request, res: Response) => {
    try {
        const data = await DistinctDataIot(req);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const UpdateDataIots = async (req: Request, res: Response) => {
    try {
        const dataIots: any = await UpdateDataIotsDetail(req);
        res.status(200).send(dataIots);
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const LockIots = async (req: Request, res: Response) => {
    try {
        const data = await AlgorithmLockIot(req);

        if (data.status === 200 && data.data) {
            const iotDataToReplace = data.data as MasterIotInterface;

            if (iotDataToReplace && typeof iotDataToReplace.id !== 'undefined') {
                const replaced = MasterIotGlobal.replaceById(iotDataToReplace);

                if (replaced) {
                    console.log(`Successfully replaced item with ID: ${iotDataToReplace.id} in MasterIotGlobal.`);
                } else {
                    console.warn(`Item with ID: ${iotDataToReplace.id} was NOT replaced in MasterIotGlobal. It might not exist in the global store, or the ID was missing in the data intended for replacement.`);
                }
            } else {
                console.warn("Data from AlgorithmLockIot (algorithmResult.data) is missing the 'id' property or is null/undefined. Cannot perform replacement in global store.");
            }
        } else {
            console.warn(`AlgorithmLockIot indicated an issue: status ${data.status}, message code ${data.message}.`);
        }

        res.status(200).send(data);
    } catch (error) {
        console.error("Error in Lock IotCmd:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const deviceUpdateData = async (topic: string, message: Buffer) => {
    const dataJson: any = await ConvertDataHextoJson(message);
    // iotsLogger.info(dataJson);
    if (dataJson.status) {
        dataJson.mac = (topic.split('/')).length > 1 ? (topic.split('/'))[1] : '';
        const dataIot = await MasterIotGlobal.findByMac(dataJson.mac);
        if (dataIot) {
            dataJson.topic = topic;
            dataJson.status = 'in';
            dataJson.type = 2;
            // dataJson.time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            for (const payload of dataJson.payload) {
                if (payload.payload_name === 'timestamp') {
                    const dateObject = new Date(payload.timestamp * 1000);

                    const adjustedHour = (dateObject.getHours() - 7 + 24) % 24;
                    const hours = String(adjustedHour).padStart(2, '0');
                    const minutes = String(dateObject.getMinutes()).padStart(2, '0');
                    const seconds = String(dateObject.getSeconds()).padStart(2, '0');
                    const milliseconds = String(dateObject.getMilliseconds()).padStart(3, '0');

                    dataJson.time = `${hours}:${minutes}:${seconds}.${milliseconds}`;
                    break;
                }
            }

            for (const payload of dataJson.payload) {
                if (payload.payload_name != 'timestamp') {
                    const dataMsgDetail = {
                        device_id: dataIot.id,
                        CMD: dataJson.CMD,
                        CMD_Decriptions: dataJson.CMD_Decriptions,
                        dataName: `${dataJson.CMD_Decriptions} : ${payload.payload_name}`,
                        payload_name: payload.payload_name,
                        data: payload[payload.payload_name],
                        unit: payload.payload_unit,
                        time: dataJson.time
                    };
                    DataMsgGlobal.updateMultipleKey(dataMsgDetail, ['device_id', 'dataName']);
                }
            }
            sendDataRealTime(dataIot.id);
        }
    }
};

export const sendDataRealTime = async (id: any) => {
    const dataIots = MasterIotGlobal.fillById(id);
    for (const data of dataIots) {
        const dataPayload = DataMsgGlobal.fillById(data.id);
        if (dataPayload.length > 0) {
            const dataMsgDetail =
            {
                device_id: data.id,
                payload: dataPayload
            }
            await EmitData("iot_send_data_" + data.id, dataMsgDetail);
        }
    }
};

export const deviceSendData = async (req: Request, res: Response) => {
    try {
        const dataHex = await ConvertDataJsonToHex(req.body);
        let dataIots = await MasterIotGlobal.getAll();
        let dataSend: any = [];

        if (dataHex.status) {
            if (dataHex.mac !== '+') {
                const dataFill = dataIots.filter((item: any) => {
                    const matchMAC = dataHex.mac?.length ? dataHex.mac.includes(item.mac) : true;
                    return matchMAC;
                });
                dataIots = dataFill;
            }
            for (const dataDetail of dataIots) {
                const topic = `${dataHex.topic}/${dataDetail.mac}`;
                const publicData = await publishMessage(client, topic, dataHex.data);
                dataSend.push({
                    title: moment().format('YYYY-MM-DD HH:mm:ss'),
                    topic: topic,
                    data: dataHex.dataString,
                    status: true
                });
            }
        }
        res.status(200).send({ message: 106, data: dataSend });
    } catch (error) {
        console.error("Error in Lock IotCmd:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const serverPublish = async (req: Request, res: Response) => {
    try {
        const hexToSend = req.body.hex;
        const mac = req.body.mac;
        publishMessage(client, `device/response/${mac}`, hexToSend);
        res.status(200).send("OK");
    } catch (error) {
        console.error("Error in Lock IotCmd:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};