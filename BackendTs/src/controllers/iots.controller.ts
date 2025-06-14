// controllers/iots.controller.ts

import {Request, Response} from "express";
import {AlgorithmGetIot, AlgorithmLockIot, UpdateDataIotsDetail} from "../algorithms/iots.algorithms";
import {ConvertDataHextoJson, ConvertDataJsonToHex} from "../algorithms/data.algorithms";
import {EmitData} from "../sockets/emit";
import {DistinctDataIot} from "../services/iot.services";
import {DataMsgGlobal, MasterIotGlobal} from "../global";
import publishMessage from "../mqtt/publish";
import client from "../mqtt";
import moment from "moment";
import {MasterIotInterface} from "../interface";
import {ConvertDatatoHex} from "../global/convertData.global";
import logger from "../config/logger";
import IotSettings from "../models/sql/iot_settings.models";
import {Buffer} from 'buffer';
import IotStatistic from "../models/nosql/iot_statistic.models";
import {getCmdStatistics, incrementCmdStat} from "../services/iot_statistics.services";

const CMD_RESPOND_TIMESTAMP = 0x14;
const CMD_NOTIFY_TCP = 0x3C;
const CMD_NOTIFY_UDP = 0x3D;
const PAYLOAD_I32 = 0x06;
const MISSED_PACKET = 0xFE;

const CMD_SERIAL = {
    "CMD_REQUEST_SERIAL_RS485": {
        "CMD": 0x11,
        dataType: {
            data: ["string"] as const // Chỉ chấp nhận string
        }
    },
    "CMD_REQUEST_SERIAL_RS232": {
        "CMD": 0x12,
        dataType: {
            data: ["string"] as const // Chỉ chấp nhận string
        }
    },
    "CMD_REQUEST_SERIAL_TCP": {
        "CMD": 0x13,
        dataType: {
            id: ["string"] as const,
            data: ["string"] as const
        }
    },
    "CMD_REQUEST_SERIAL_UDP": {
        "CMD": 0x3c,
        dataType: {
            id: ["string"] as const,
            port: ["uint16"] as const, // Cần là unsigned 16-bit integer
            data: ["string"] as const
        }
    },
    "CMD_CAN": {
        "CMD": 0x3d,
        dataType: {
            // Thứ tự ưu tiên: uint8 -> uint16 -> uint32
            id: ["uint32"] as const,
            // Thứ tự ưu tiên: string -> uint8 -> uint16 -> bool -> float
            data: ["bool", "uint16", "float", "string"] as const
        }
    },
    "CMD_WRITE_IO_DO1": {
        "CMD": 0x22,
        dataType: {
            id: ["uint32"] as const,
            // Ví dụ: DO có thể nhận boolean (0/1) hoặc 1 byte giá trị (uint8)
            data: ["bool", "uint8"] as const // Ưu tiên bool, sau đó uint8
        }
    },
    "CMD_WRITE_IO_DO2": {
        "CMD": 0x23,
        dataType: {
            id: ["uint32"] as const,
            data: ["bool", "uint8"] as const
        }
    },
    "CMD_WRITE_IO_DO3": {
        "CMD": 0x24,
        dataType: {
            id: ["uint32"] as const,
            data: ["bool", "uint8"] as const
        }
    },
    "CMD_WRITE_IO_DO4": {
        "CMD": 0x25,
        dataType: {
            id: ["uint32"] as const,
            data: ["bool", "uint8"] as const
        }
    },
    "CMD_WRITE_IO_DO5": {
        "CMD": 0x26,
        dataType: {
            id: ["uint32"] as const,
            data: ["bool", "uint8"] as const
        }
    },
    "CMD_WRITE_IO_DO6": {
        "CMD": 0x27,
        dataType: {
            id: ["uint32"] as const,
            data: ["bool", "uint8"] as const
        }
    },
    "CMD_WRITE_IO_DO7": {
        "CMD": 0x28,
        dataType: {
            id: ["uint32"] as const,
            data: ["bool", "uint8"] as const
        }
    },
    "CMD_WRITE_IO_DO8": {
        "CMD": 0x29,
        dataType: {
            id: ["uint32"] as const,
            data: ["bool", "uint8"] as const
        }
    },
    "CMD_WRITE_IO_AO1": {
        "CMD": 0x32,
        dataType: {
            id: ["uint32"] as const,
            // Ưu tiên float, sau đó uint16, uint8, bool
            data: ["float", "uint16", "uint8", "bool"] as const
        }
    },
    "CMD_WRITE_IO_AO2": {
        "CMD": 0x33,
        dataType: {
            id: ["uint32"] as const,
            data: ["float", "uint16", "uint8", "bool"] as const
        }
    },
    "CMD_WRITE_IO_AO3": {
        "CMD": 0x34,
        dataType: {
            id: ["uint32"] as const,
            data: ["float", "uint16", "uint8", "bool"] as const
        }
    },
    "CMD_WRITE_IO_AO4": {
        "CMD": 0x35,
        dataType: {
            id: ["uint32"] as const,
            data: ["float", "uint16", "uint8", "bool"] as const
        }
    },
    "CMD_WRITE_IO_AO5": {
        "CMD": 0x36,
        dataType: {
            id: ["uint32"] as const,
            data: ["float", "uint16", "uint8", "bool"] as const
        }
    },
    "CMD_WRITE_IO_AO6": {
        "CMD": 0x37,
        dataType: {
            id: ["uint32"] as const,
            data: ["float", "uint16", "uint8", "bool"] as const
        }
    },
    "CMD_WRITE_IO_AO7": {
        "CMD": 0x38,
        dataType: {
            id: ["uint32"] as const,
            data: ["float", "uint16", "uint8", "bool"] as const
        }
    },
    "CMD_WRITE_IO_AO8": {
        "CMD": 0x39,
        dataType: {
            id: ["uint32"] as const,
            data: ["float", "uint16", "uint8", "bool"] as const
        }
    },
    "CMD_WRITE_IO_RS232": {
        "CMD": 0x3A,
        dataType: {
            id: ["uint32"] as const,
            // Thay thế bằng kiểu cụ thể mà RS232 có thể nhận
            data: ["string"] as const // Ví dụ: RS232 chỉ nhận string
        }
    },
    "CMD_WRITE_IO_RS485": {
        "CMD": 0x3B,
        dataType: {
            id: ["uint32"] as const,
            // Thay thế bằng kiểu cụ thể mà RS485 có thể nhận
            data: ["string"] as const // Ví dụ: RS485 chỉ nhận string
        }
    }
} as const;


const CMD_MODBUS_CONTROL = {
    "CMD_REQUEST_MODBUS_RS485": {
        "CMD": 0x08,
        dataType: {
            id: ["uint8"] as const, // Modbus Unit ID (unsigned 8-bit integer)
            address: ["uint16"] as const, // Modbus Register Address (unsigned 16-bit integer)
            function: ["uint8"] as const, // Modbus Function Code (unsigned 8-bit integer)
            // Thứ tự ưu tiên: uint16 -> uint8 -> bool
            data: ["bool", "uint16"] as const // Data to write (unsigned 16-bit, unsigned 8-bit, boolean)
        }
    },
    "CMD_REQUEST_MODBUS_TCP": {
        "CMD": 0x10,
        dataType: {
            id: ["string"] as const, // IP Address for Modbus TCP (string)
            address: ["uint16"] as const,
            function: ["uint8"] as const,
            data: ["bool", "uint16"] as const
        }
    },
} as const;

const HEX_COMMANDS = {
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' }
} as const;

type NumericPayloadDetails = {
    hex: number;
    size: number;
    min: number;
    max: number;
};

type OtherPayloadDetails = {
    hex: number;
    size: number;
};

const PAYLOAD_TYPES = {
    'uint8': { hex: 0x01, size: 1, min: 0, max: 255 } as NumericPayloadDetails,
    'uint16': { hex: 0x02, size: 2, min: 0, max: 65535 } as NumericPayloadDetails,
    'uint32': { hex: 0x03, size: 4, min: 0, max: 4294967295 } as NumericPayloadDetails,
    'int8': { hex: 0x04, size: 1, min: -128, max: 127 } as NumericPayloadDetails,
    'int16': { hex: 0x05, size: 2, min: -32768, max: 32767 } as NumericPayloadDetails,
    'int32': { hex: 0x06, size: 4, min: -2147483648, max: 2147483647 } as NumericPayloadDetails,
    'bool': { hex: 0x07, size: 1, min: 0, max: 1 } as NumericPayloadDetails, // Min/Max cho bool (0/1)
    'float': { hex: 0x08, size: 4 } as OtherPayloadDetails,
    'char': { hex: 0x09, size: 1 } as OtherPayloadDetails,
    'string': { hex: 0x0A, size: -1 } as OtherPayloadDetails
} as const;

type PayloadTypeKey = keyof typeof PAYLOAD_TYPES;

export const getStatistics = (req: Request, res: Response) => {
    try {
        const deviceId: string = req.params.id;

        if (!deviceId) {
            res.status(400).send({ message: "Device ID is required." });
            return;
        }

        const statistics = getCmdStatistics(deviceId);

        res.status(200).json(statistics);
    } catch (error) {
        logger.error("Error in getStatistics:", error); // Sửa tên hàm trong log
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const sendDataIots = async (req: Request, res: Response) => {
    try {
        const dataIots: any = await AlgorithmGetIot();
        res.status(200).send(dataIots);
    } catch (error) {
        logger.error("Error in sendDataIots:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const SendDistinctIots = async (req: Request, res: Response) => {
    try {
        const data = await DistinctDataIot(req);
        res.status(200).send(data);
    } catch (error) {
        logger.error("Error in SendDistinctIots:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const UpdateDataIots = async (req: Request, res: Response) => {
    try {
        const dataIots: any = await UpdateDataIotsDetail(req);
        res.status(200).send(dataIots);
    } catch (error) {
        logger.error("Error in UpdateDataIots:", error);
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
                    logger.info(`Successfully replaced item with ID: ${iotDataToReplace.id} in MasterIotGlobal.`);
                } else {
                    logger.warn(`Item with ID: ${iotDataToReplace.id} was NOT replaced in MasterIotGlobal. It might not exist in the global store, or the ID was missing in the data intended for replacement.`);
                }
            } else {
                logger.warn("Data from AlgorithmLockIot (algorithmResult.data) is missing the 'id' property or is null/undefined. Cannot perform replacement in global store.");
            }
        } else {
            logger.warn(`AlgorithmLockIot indicated an issue: status ${data.status}, message code ${data.message}.`);
        }

        res.status(200).send(data);
    } catch (error) {
        logger.error("Error in LockIots:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const calculateCRC8 = (data: Buffer): number => {
    let crc = 0xFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let bit = 8; bit > 0; bit--) {
            if (crc & 0x80) {
                crc = ((crc << 1) ^ 0x07) & 0xFF;
            } else {
                crc = (crc << 1) & 0xFF;
            }
        }
    }
    return crc;
};

export const deviceUpdateData = async (topic: string, message: Buffer) => {
    const mergedPayloads: any = {
        isMissed: false
    };
    if (message[0] === MISSED_PACKET) {
        mergedPayloads.isMissed = true;
        message = message.slice(1);
    }

    const mac = (topic.split('/')).length > 1 ? (topic.split('/'))[1] : '';
    if (message[0] === CMD_RESPOND_TIMESTAMP) {
        const currentEpochTimestamp = Math.floor(Date.now() / 1000);

        const timestampDataHex = ConvertDatatoHex(currentEpochTimestamp, 'int32');

        const cmdHex = CMD_RESPOND_TIMESTAMP.toString(16).toUpperCase().padStart(2, '0');
        const lengthHex = '04';
        const typeHex = PAYLOAD_I32.toString(16).toUpperCase().padStart(2, '0');

        const payloadPart = `${lengthHex}${typeHex}${timestampDataHex}`;

        const dataForCrcCalculation = Buffer.from(`${cmdHex}${payloadPart}`, 'hex');
        const calculatedCrcValue = calculateCRC8(dataForCrcCalculation);
        const crcHex = calculatedCrcValue.toString(16).toUpperCase().padStart(2, '0');

        const hexToSend = `${cmdHex}${payloadPart}${crcHex}`;

        logger.info(`Generated Timestamp Response for ${mac}: ${hexToSend}`);

        publishMessage(client, `device/response/${mac}`, hexToSend);
        return;
    }

    const dataJson: any = await ConvertDataHextoJson(message);

    if (dataJson.status) {
        dataJson.mac = mac;
        const dataIot = MasterIotGlobal.findByMac(dataJson.mac);
        if (dataIot) {
            dataJson.topic = topic;
            dataJson.status = 'in';
            dataJson.type = 2;

            for (const payload of dataJson.payload) {
                if (payload.payload_name === 'timestamp') {
                    dataJson.time = payload.timestamp;
                } else {
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
                    DataMsgGlobal.replaceByMultipleKeys(dataMsgDetail, ['device_id', 'dataName']);
                }
            }
            DataMsgGlobal.replaceByMultipleKeys({
                device_id: dataIot.id,
                CMD: dataJson.CMD,
                CMD_Decriptions: dataJson.CMD_Decriptions,
                dataName: `${dataJson.CMD_Decriptions} : isMissed`,
                payload_name: 'isMissed',
                data: mergedPayloads.isMissed,
                time: dataJson.time
            }, ['device_id', 'dataName']);

            mergedPayloads.cmd = dataJson.CMD;
            mergedPayloads.deviceId = dataIot.id;
            for (const payload of dataJson.payload) {
                if (payload.payload_name === 'timestamp') {
                    mergedPayloads.timestamp = payload.timestamp;
                } else {
                    mergedPayloads[payload.payload_name] = payload[payload.payload_name];
                }
            }
            const iotStatistic = new IotStatistic(mergedPayloads);
            await iotStatistic.save();
            incrementCmdStat(mergedPayloads.deviceId, mergedPayloads.cmd, mergedPayloads.isMissed);
            await sendStatistics(mergedPayloads.deviceId);

            if (message[0] === CMD_NOTIFY_TCP || message[0] === CMD_NOTIFY_UDP) {
                const iotDevice = await IotSettings.findOne({
                    where: { mac: mac }
                });

                if (iotDevice) {
                    const updateField = message[0] === CMD_NOTIFY_TCP ? 'tcp_status' : 'udp_status';
                    const updateStatus = dataJson.payload[0][dataJson.payload[0].payload_name] === 1 ? 'opened' : 'closed';

                    iotDevice.set(updateField, updateStatus);
                    await iotDevice.save();

                    MasterIotGlobal.update(iotDevice.toJSON());
                }
            }
            await sendDataRealTime(dataIot.id as number);
        }
    }
};

export const sendStatistics = async (deviceId: string) => {
    const statistics = getCmdStatistics(deviceId);
    await EmitData("server_emit_statistics", statistics);
};

export const sendDataRealTime = async (id: number) => {
    const dataIots = MasterIotGlobal.fillById(id);
    for (const data of dataIots) {
        const dataPayload = DataMsgGlobal.fillById(data.id);
        if (dataPayload.length > 0) {
            const dataMsgDetail =
                {
                    device_id: data.id,
                    payload: await Promise.all(dataPayload.map(async (item: any) => {
                        const iotDevice = await IotSettings.findOne({
                            where: { id: item.device_id }
                        });
                        if (item.CMD === "CMD_NOTIFY_TCP" && iotDevice && iotDevice.toJSON().tcp_status !== "opened") {
                            return null;
                        }
                        if (item.CMD === "CMD_NOTIFY_UDP" && iotDevice && iotDevice.toJSON().udp_status !== "opened") {
                            return null;
                        }

                        return item;
                    }))
                        .then(results => results.filter(item => item !== null))
                };
            await EmitData("iot_send_data_" + data.id, dataMsgDetail);
        }
    }
};

export const deviceSendData = async (req: Request, res: Response) => {
    try {
        const dataHex: any = await ConvertDataJsonToHex(req.body);
        let dataIots: any[] = MasterIotGlobal.getAll();
        const dataSend: any[] = [];

        if (dataHex.status) {
            if (dataHex.mac && dataHex.mac !== '+') {
                dataIots = dataIots.filter((item: any) => {
                    return dataHex.mac.includes(item.mac);
                });
            }
            for (const dataDetail of dataIots) {
                const topic = `${dataHex.topic}/${dataDetail.mac}`;
                publishMessage(client, topic, dataHex.data);
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
        logger.error("Error in deviceSendData:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const serverPublish = async (req: Request, res: Response) => {
    try {
        const hexToSend: string = req.body.hex;
        const mac: string = req.body.mac;

        if (!mac || !hexToSend) {
            res.status(400).send({ message: "MAC and hex command are required." });
            return;
        }

        const iotDevice = await IotSettings.findOne({
            where: { mac: mac }
        });

        if (!iotDevice) {
            res.status(404).send({ message: `IoT device with MAC ${mac} not found.` });
            return;
        }

        let updateStatus: 'requestOpen' | 'requestClose' | null = null;
        let updateField: 'tcp_status' | 'udp_status' | null = null;

        if (hexToSend === HEX_COMMANDS.tcp.on) {
            updateStatus = 'requestOpen';
            updateField = 'tcp_status';
        } else if (hexToSend === HEX_COMMANDS.tcp.off) {
            updateStatus = 'requestClose';
            updateField = 'tcp_status';
        } else if (hexToSend === HEX_COMMANDS.udp.on) {
            updateStatus = 'requestOpen';
            updateField = 'udp_status';
        } else if (hexToSend === HEX_COMMANDS.udp.off) {
            updateStatus = 'requestClose';
            updateField = 'udp_status';
        } else {
            logger.warn(`Unknown HEX command received for MAC ${mac}: ${hexToSend}. No status update performed.`);
        }

        if (updateField && updateStatus) {
            iotDevice.set(updateField, updateStatus);
            await iotDevice.save();
            logger.info(`Updated ${updateField} for device ${mac} in DB to ${updateStatus}.`);

            MasterIotGlobal.update(iotDevice.toJSON());
            logger.info(`Updated ${updateField} for device ${mac} in global storage to ${updateStatus}.`);
        }

        publishMessage(client, `device/response/${mac}`, hexToSend);
        logger.info(`Published HEX command ${hexToSend} to device/response/${mac}`);

        res.status(200).send("OK");

    } catch (error) {
        logger.error("Error in serverPublish:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

// --- Bắt đầu các hàm kiểm tra và xây dựng payload mới ---

/**
 * Checks if a given value can be cast to and strictly conforms to a specified payload type,
 * including range checks, type conversions, and strict string format validation for numbers.
 * @param value The raw value from the request body.
 * @param expectedType The specific payload type to check against (e.g., 'uint8', 'string', 'bool').
 * @param fieldName The name of the field for clearer error messages.
 * @returns The converted/validated value if it matches the type, throws an error otherwise.
 */
const checkPayloadType = (value: any, expectedType: PayloadTypeKey, fieldName: string): any => {
    const typeInfo = PAYLOAD_TYPES[expectedType];
    let convertedValue: any;

    // Regex cho số nguyên: chỉ chấp nhận số nguyên, có thể có dấu âm, không có dấu thập phân.
    const integerRegex = /^-?\d+$/;
    // Regex cho số thực: chấp nhận số nguyên hoặc số thập phân, có thể có dấu âm.
    // Kiểm tra thêm để không có dấu chấm thập phân nếu không có chữ số sau nó (vd: "123.")
    const floatRegex = /^-?\d+(\.\d+)?$/;


    switch (expectedType) {
        case 'string':
            // Giá trị phải là string. Không cố gắng chuyển đổi từ các kiểu khác sang string một cách tự động.
            if (typeof value !== 'string') {
                throw new Error(`Expected 'string' for field '${fieldName}', but got ${typeof value}.`);
            }
            convertedValue = value;
            break;

        case 'bool':
            // Chấp nhận boolean, hoặc "true"/"false" string, hoặc số 0/1
            if (typeof value === 'boolean') {
                convertedValue = value ? 1 : 0;
            } else if (typeof value === 'string') {
                const lowerValue = value.toLowerCase(); // Chắc chắn value là string ở đây
                if (lowerValue === 'true') {
                    convertedValue = 1;
                } else if (lowerValue === 'false') {
                    convertedValue = 0;
                } else {
                    throw new Error(`Expected 'boolean' (true/false, "true"/"false", 0/1, "0"/"1") for field '${fieldName}', but got string "${value}".`);
                }
            } else {
                throw new Error(`Expected 'boolean' (true/false, 0/1) for field '${fieldName}', but got ${typeof value}.`);
            }
            break;

        case 'uint8':
        case 'int8':
        case 'uint16':
        case 'int16':
        case 'uint32':
        case 'int32':
            // Kiểm tra số nguyên
            if (typeof value === 'string') {
                if (!integerRegex.test(value)) {
                    throw new Error(`Expected 'integer' for field '${fieldName}' (${expectedType}), but string "${value}" is not a valid integer format.`);
                }
            } else if (typeof value !== 'number') {
                throw new Error(`Expected 'number' for field '${fieldName}' (${expectedType}), but got ${typeof value}.`);
            }

            // Nếu là chuỗi số nguyên hợp lệ hoặc đã là number, tiến hành parse và kiểm tra phạm vi
            const intValue = Number(value); // Dùng Number() để nghiêm ngặt hơn parseFloat/parseInt
            if (isNaN(intValue) || !Number.isInteger(intValue)) { // Kiểm tra nếu nó vẫn không phải số nguyên
                throw new Error(`Value "${value}" for field '${fieldName}' is not a valid integer or cannot be converted.`);
            }
            convertedValue = intValue;

            // Kiểm tra phạm vi cho các kiểu số nguyên
            const numericInfoInt = typeInfo as NumericPayloadDetails;
            if (convertedValue < numericInfoInt.min || convertedValue > numericInfoInt.max) {
                throw new Error(`Value ${convertedValue} for field '${fieldName}' is out of range for '${expectedType}' (min: ${numericInfoInt.min}, max: ${numericInfoInt.max}).`);
            }
            break;

        case 'float':
            // Kiểm tra số thực (float)
            if (typeof value === 'string') {
                if (!floatRegex.test(value)) {
                    throw new Error(`Expected 'float' for field '${fieldName}' (${expectedType}), but string "${value}" is not a valid float format.`);
                }
            } else if (typeof value !== 'number') {
                throw new Error(`Expected 'number' for field '${fieldName}' (${expectedType}), but got ${typeof value}.`);
            }

            // Nếu là chuỗi số thực hợp lệ hoặc đã là number, tiến hành parse
            const floatValue = Number(value); // Dùng Number() để nghiêm ngặt hơn parseFloat
            if (isNaN(floatValue)) {
                throw new Error(`Value "${value}" for field '${fieldName}' is not a valid float or cannot be converted.`);
            }
            convertedValue = floatValue;
            // Không cần kiểm tra min/max cho float trừ khi bạn có yêu cầu cụ thể về IEEE 754

            break;

        case 'char':
            // 'char' phải là một chuỗi có độ dài đúng 1 ký tự
            if (typeof value !== 'string' || value.length !== 1) {
                throw new Error(`Expected a single character string for field '${fieldName}' ('char'), but got ${typeof value} or length ${value?.length}.`);
            }
            convertedValue = value;
            break;

        default:
            throw new Error(`Unsupported payload type '${expectedType}' for field '${fieldName}' during strict checking.`);
    }
    return convertedValue; // Trả về giá trị đã được chuyển đổi và xác thực
};

/**
 * Builds a binary Buffer segment for a payload based on the specified type and value.
 * Assumes the value has already been validated against the payloadTypeKey.
 * @param value The value to convert into a Buffer.
 * @param payloadTypeKey The specific payload type (e.g., 'uint8', 'string').
 * @returns A Buffer representing the payload segment.
 * @throws Error if an unhandled payload type is encountered (should not happen if validation is correct).
 */
const buildPayloadSegment = (value: any, payloadTypeKey: PayloadTypeKey): Buffer => {
    const typeInfo = PAYLOAD_TYPES[payloadTypeKey];
    let dataBuffer: Buffer;
    let payloadLength: number;

    switch (payloadTypeKey) {
        case 'uint8':
        case 'int8':
        case 'uint16':
        case 'int16':
        case 'uint32':
        case 'int32':
        case 'bool':
            // Giá trị đã được chuẩn hóa và xác thực bởi checkPayloadType
            const numValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
            dataBuffer = Buffer.alloc(typeInfo.size);
            payloadLength = typeInfo.size;
            if (payloadTypeKey === 'uint8') dataBuffer.writeUInt8(numValue);
            else if (payloadTypeKey === 'int8') dataBuffer.writeInt8(numValue);
            else if (payloadTypeKey === 'uint16') dataBuffer.writeUInt16BE(numValue);
            else if (payloadTypeKey === 'int16') dataBuffer.writeInt16BE(numValue);
            else if (payloadTypeKey === 'uint32') dataBuffer.writeUInt32BE(numValue);
            else if (payloadTypeKey === 'int32') dataBuffer.writeInt32BE(numValue);
            else if (payloadTypeKey === 'bool') dataBuffer.writeUInt8(numValue);
            break;

        case 'float':
            dataBuffer = Buffer.alloc(4);
            dataBuffer.writeFloatBE(value);
            payloadLength = 4;
            break;
        case 'char':
            dataBuffer = Buffer.alloc(1);
            dataBuffer.writeUInt8(value.charCodeAt(0));
            payloadLength = 1;
            break;
        case 'string':
            dataBuffer = Buffer.from(value.toString(), 'utf8');
            payloadLength = dataBuffer.length;
            break;
        default:
            // Lỗi này lẽ ra không xảy ra nếu checkPayloadType đã hoạt động đúng
            throw new Error(`Internal error: Unhandled payload type '${payloadTypeKey}' during buffer creation.`);
    }

    const lengthHex = payloadLength.toString(16).toUpperCase().padStart(2, '0');
    const typeHex = typeInfo.hex.toString(16).toUpperCase().padStart(2, '0');
    const dataHex = dataBuffer.toString('hex').toUpperCase();

    return Buffer.from(`${lengthHex}${typeHex}${dataHex}`, 'hex');
};

/**
 * Processes and builds a payload segment by strictly checking against expected types in order.
 * It passes the raw value to the checker function, which handles type conversion and validation.
 * @param value The raw value from the request body.
 * @param expectedTypes An array of specific payload types to check against, in order of preference.
 * @param fieldName The name of the field being processed (for error messages).
 * @returns An object containing the built buffer, its hex representation, and the matched payload type.
 * @throws Error if the value does not match any of the expected types.
 */
const processAndBuildPayload = (value: any, expectedTypes: readonly string[], fieldName: string) => {
    // Không còn bước chuyển đổi processedValue ở đây.
    // Giá trị 'value' gốc sẽ được truyền thẳng vào checkPayloadType.

    let lastError: Error | null = null; // Lưu lỗi của lần thử gần nhất

    for (const expectedType of expectedTypes) {
        const currentPayloadType = expectedType as PayloadTypeKey;
        try {
            // Bước 1: Kiểm tra và chuyển đổi giá trị.
            // checkPayloadType giờ đây trả về giá trị đã được chuyển đổi và xác thực.
            const validatedValue = checkPayloadType(value, currentPayloadType, fieldName);

            // Bước 2: Nếu khớp và chuyển đổi thành công, xây dựng buffer với giá trị đã được validate.
            const builtBuffer = buildPayloadSegment(validatedValue, currentPayloadType);
             // Loại này không còn là "suy luận" mà là "khớp đầu tiên"
            return {
                buffer: builtBuffer,
                hex: builtBuffer.toString('hex').toUpperCase(),
                inferredType: currentPayloadType
            }; // Thành công, thoát khỏi vòng lặp và trả về
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logger.warn(`Value for '${fieldName}' failed type check for '${expectedType}': ${lastError.message}`);
            // Tiếp tục thử kiểu tiếp theo trong mảng expectedTypes
        }
    }

    // Nếu vòng lặp kết thúc mà không có kiểu nào match
    throw new Error(`Value "${value}" for field '${fieldName}' is not compatible with any of the defined types ${expectedTypes.join(', ')}. Last error: ${lastError?.message || 'None'}`);
};


export const controlSerialCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type: serialType } = req.body; // Extract mac and serialType initially
        const requestBody = req.body; // Keep the whole body for dynamic access

        if (!mac || !serialType) {
            res.status(400).send({ message: "Missing required parameters: mac or type." });
            return;
        }

        const cmdInfo = CMD_SERIAL[serialType as keyof typeof CMD_SERIAL];
        if (cmdInfo === undefined) {
            res.status(400).send({ message: `Invalid serial type: "${serialType}".` });
            return;
        }

        const cmdHex = cmdInfo.CMD.toString(16).toUpperCase().padStart(2, '0');
        let totalPayloadsBuffer = Buffer.alloc(0);
        const breakdown: { [key: string]: string | PayloadTypeKey | null } = { cmd: cmdHex };
        const responseData: { [key: string]: any } = { serialType, mac };

        // Dynamically process fields based on cmdInfo.dataType
        for (const key in cmdInfo.dataType) {
            if (Object.prototype.hasOwnProperty.call(cmdInfo.dataType, key)) {
                const expectedTypes = cmdInfo.dataType[key as keyof typeof cmdInfo.dataType];
                const value = requestBody[key]; // Get the value from the request body dynamically

                if (value === undefined || value === null) {
                    res.status(400).send({ message: `Missing required parameter: "${key}" for serial type "${serialType}".` });
                    return;
                }

                try {
                    const { buffer, hex, inferredType } = processAndBuildPayload(value, expectedTypes, key);
                    totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, buffer]);
                    breakdown[`${key}Segment`] = hex;
                    breakdown[`${key}InferredType`] = inferredType;
                    responseData[key] = value; // Store the original value in response
                } catch (error) {
                    logger.error(`Error processing field '${key}' for serial command: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    res.status(400).send({ message: `Invalid value for field '${key}': ${error instanceof Error ? error.message : 'Unknown error'}` });
                    return;
                }
            }
        }

        const dataForCrcCalculation = Buffer.concat([Buffer.from(cmdHex, 'hex'), totalPayloadsBuffer]);
        const calculatedCrcValue = calculateCRC8(dataForCrcCalculation);
        const crcHex = calculatedCrcValue.toString(16).toUpperCase().padStart(2, '0');
        breakdown.crc = crcHex;

        const hexToSend = `${cmdHex}${totalPayloadsBuffer.toString('hex').toUpperCase()}${crcHex}`;
        responseData.hexCommand = hexToSend;
        responseData.breakdown = breakdown;

        logger.info(`[Serial Command] MAC: ${mac}, Type: ${serialType}, Complete Packet: ${hexToSend}`);

        if (!client || !client.connected) {
            logger.error("MQTT client not connected. Cannot publish message.");
            res.status(500).send({ message: "MQTT client not connected. Please try again later." });
            return;
        }
        publishMessage(client, `device/response/${mac}`, hexToSend);

        res.status(200).send({
            message: "Serial command sent successfully",
            data: responseData
        });
    } catch (error) {
        logger.error("Error in controlSerialCommand:", error);
        res.status(500).send({ message: `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        return;
    }
};

export const controlModbusCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type: modbusType } = req.body;
        const requestBody = req.body;

        if (!mac || !modbusType) {
            res.status(400).send({ message: "Missing required parameters: mac or type." });
            return;
        }

        const cmdInfo = CMD_MODBUS_CONTROL[modbusType as keyof typeof CMD_MODBUS_CONTROL];
        if (cmdInfo === undefined) {
            res.status(400).send({ message: `Invalid Modbus command type: "${modbusType}".` });
            return;
        }
        const cmdHex = cmdInfo.CMD.toString(16).toUpperCase().padStart(2, '0');

        let totalPayloadsBuffer = Buffer.alloc(0);
        const responseData: { [key: string]: any } = { type: modbusType, mac };
        const breakdown: { [key: string]: string | PayloadTypeKey | null } = { cmd: cmdHex };

        // Process fields in the order defined in cmdInfo.dataType
        // CHÚ Ý: Đảm bảo các key trong orderedKeys khớp với các key trong dataType của CMD_MODBUS_CONTROL
        const orderedKeys: (keyof typeof cmdInfo.dataType)[] = ['id', 'address', 'function', 'data']; // Define explicit order

        for (const key of orderedKeys) {
            const expectedTypes = cmdInfo.dataType[key];
            const value = requestBody[key];

            if (value === undefined || value === null) {
                res.status(400).send({ message: `Missing required Modbus parameter: "${key}" for command "${modbusType}".` });
                return;
            }

            try {
                const { buffer, hex, inferredType } = processAndBuildPayload(value, expectedTypes, key);
                totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, buffer]);
                breakdown[`${key}Segment`] = hex;
                breakdown[`${key}InferredType`] = inferredType;
                responseData[key] = value; // Store the original value in response
            } catch (error) {
                logger.error(`Error processing field '${key}' for Modbus command: ${error instanceof Error ? error.message : 'Unknown error'}`);
                res.status(400).send({ message: `Invalid value for Modbus field '${key}': ${error instanceof Error ? error.message : 'Unknown error'}` });
                return;
            }
        }

        // Calculate CRC
        const dataForCrcCalculation = Buffer.concat([Buffer.from(cmdHex, 'hex'), totalPayloadsBuffer]);
        const calculatedCrcValue = calculateCRC8(dataForCrcCalculation);
        const crcHex = calculatedCrcValue.toString(16).toUpperCase().padStart(2, '0');
        breakdown.crc = crcHex;

        const hexToSend = `${cmdHex}${totalPayloadsBuffer.toString('hex').toUpperCase()}${crcHex}`;
        responseData.hexCommand = hexToSend;
        responseData.breakdown = breakdown;

        logger.info(`[Modbus Command] MAC: ${mac}, Type: ${modbusType}, Complete Hex: ${hexToSend}`);

        if (!client || !client.connected) {
            logger.error("MQTT client not connected. Cannot publish message.");
            res.status(500).send({ message: "MQTT client not connected. Please try again later." });
            return;
        }

        publishMessage(client, `device/response/${mac}`, hexToSend);

        res.status(200).send({
            message: "Modbus command sent successfully",
            data: responseData
        });

    } catch (error) {
        logger.error("Error in controlModbusCommand:", error);
        res.status(500).send({ message: `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        return;
    }
};