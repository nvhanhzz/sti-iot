// controllers/iots.controller.ts

import { Request, Response } from "express";
import { UpdateDataIotsDetail, AlgorithmLockIot, AlgorithmGetIot } from "../algorithms/iots.algorithms";
import { ConvertDataHextoJson, ConvertDataJsonToHex } from "../algorithms/data.algorithms";
import { EmitData } from "../sockets/emit";
import { DistinctDataIot } from "../services/iot.services";
import { MasterIotGlobal, DataMsgGlobal } from "../global";
import publishMessage from "../mqtt/publish";
import client from "../mqtt";
import moment from "moment";
import { MasterIotInterface } from "../interface";
import { ConvertDatatoHex } from "../global/convertData.global";
import logger from "../config/logger";
import IotSettings from "../models/sql/iot_settings.models";
import { Buffer } from 'buffer';

const CMD_RESPOND_TIMESTAMP = 0x14;
const CMD_NOTIFY_TCP = 0x3C;
const CMD_NOTIFY_UDP = 0x3D;
const PAYLOAD_I32 = 0x06;
const PAYLOAD_STRING = 0x0A;

const CMD_SERIAL = {
    "CMD_REQUEST_SERIAL_RS485": {
        "CMD": 0x11,
        dataType: {
            data: ["string"] as const
        }
    },
    "CMD_REQUEST_SERIAL_RS232": {
        "CMD": 0x12,
        dataType: {
            data: ["string"] as const
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
            port: ["u16"] as const,
            data: ["string"] as const
        }
    },
    "CMD_CAN": {
        "CMD": 0x3d,
        dataType: {
            id: ["u32"] as const,
            data: ["string", "u8", "u16", "bool", "float"] as const
        }
    },
    "CMD_WRITE_IO_DO1": {
        "CMD": 0x22,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    },
    "CMD_WRITE_IO_DO2": {
        "CMD": 0x23,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    },
    "CMD_WRITE_IO_DO3": {
        "CMD": 0x24,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    },
    "CMD_WRITE_IO_DO4": {
        "CMD": 0x25,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    },
    "CMD_WRITE_IO_DO5": {
        "CMD": 0x26,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    },
    "CMD_WRITE_IO_DO6": {
        "CMD": 0x27,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    },
    "CMD_WRITE_IO_DO7": {
        "CMD": 0x28,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    },
    "CMD_WRITE_IO_DO8": {
        "CMD": 0x29,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    },
    "CMD_WRITE_IO_AO1": {
        "CMD": 0x32,
        dataType: {
            id: ["u32"] as const,
            data: ["bool", "u8", "u16", "float"] as const
        }
    },
    "CMD_WRITE_IO_AO2": {
        "CMD": 0x33,
        dataType: {
            id: ["u32"] as const,
            data: ["bool", "u8", "u16", "float"] as const
        }
    },
    "CMD_WRITE_IO_AO3": {
        "CMD": 0x34,
        dataType: {
            id: ["u32"] as const,
            data: ["bool", "u8", "u16", "float"] as const
        }
    },
    "CMD_WRITE_IO_AO4": {
        "CMD": 0x35,
        dataType: {
            id: ["u32"] as const,
            data: ["bool", "u8", "u16", "float"] as const
        }
    },
    "CMD_WRITE_IO_AO5": {
        "CMD": 0x36,
        dataType: {
            id: ["u32"] as const,
            data: ["bool", "u8", "u16", "float"] as const
        }
    },
    "CMD_WRITE_IO_AO6": {
        "CMD": 0x37,
        dataType: {
            id: ["u32"] as const,
            data: ["bool", "u8", "u16", "float"] as const
        }
    },
    "CMD_WRITE_IO_AO7": {
        "CMD": 0x38,
        dataType: {
            id: ["u32"] as const,
            data: ["bool", "u8", "u16", "float"] as const
        }
    },
    "CMD_WRITE_IO_AO8": {
        "CMD": 0x39,
        dataType: {
            id: ["u32"] as const,
            data: ["bool", "u8", "u16", "float"] as const
        }
    },
    "CMD_WRITE_IO_RS232": {
        "CMD": 0x3A,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    },
    "CMD_WRITE_IO_RS485": {
        "CMD": 0x3B,
        dataType: {
            id: ["u32"] as const,
            data: ["payload", "data"] as const
        }
    }
} as const;


const CMD_MODBUS_CONTROL = {
    "CMD_REQUEST_MODBUS_RS485": {
        "CMD": 0x08,
        dataType: {
            id: ["u8"] as const, // Modbus Unit ID
            address: ["u16"] as const, // Modbus Register Address
            function: ["u8"] as const, // Modbus Function Code
            data: ["u8", "u16", "bool"] as const // Data to write
        }
    },
    "CMD_REQUEST_MODBUS_TCP": {
        "CMD": 0x10,
        dataType: {
            id: ["string"] as const, // IP Address for Modbus TCP
            address: ["u16"] as const,
            function: ["u8"] as const,
            data: ["u8", "u16", "bool"] as const
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
    'bool': { hex: 0x07, size: 1, min: 0, max: 1 } as NumericPayloadDetails,
    'float': { hex: 0x08, size: 4 } as OtherPayloadDetails,
    'char': { hex: 0x09, size: 1 } as OtherPayloadDetails,
    'string': { hex: 0x0A, size: -1 } as OtherPayloadDetails
} as const;

type PayloadTypeKey = keyof typeof PAYLOAD_TYPES;

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
        let dataIots: any[] = await MasterIotGlobal.getAll();
        const dataSend: any[] = [];

        if (dataHex.status) {
            if (dataHex.mac && dataHex.mac !== '+') {
                const dataFill = dataIots.filter((item: any) => {
                    return dataHex.mac.includes(item.mac);
                });
                dataIots = dataFill;
            }
            for (const dataDetail of dataIots) {
                const topic = `${dataHex.topic}/${dataDetail.mac}`;
                await publishMessage(client, topic, dataHex.data);
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

const isValidIpAddress = (ip: string): boolean => {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
};

const inferNumericPayloadType = (value: number): PayloadTypeKey => {
    if (!Number.isInteger(value)) {
        return 'float';
    }

    const int8Info = PAYLOAD_TYPES['int8'];
    if (int8Info.min !== undefined && int8Info.max !== undefined && value >= int8Info.min && value <= int8Info.max) {
        return 'int8';
    }
    const uint8Info = PAYLOAD_TYPES['uint8'];
    if (uint8Info.min !== undefined && uint8Info.max !== undefined && value >= uint8Info.min && value <= uint8Info.max) {
        return 'uint8';
    }
    const int16Info = PAYLOAD_TYPES['int16'];
    if (int16Info.min !== undefined && int16Info.max !== undefined && value >= int16Info.min && value <= int16Info.max) {
        return 'int16';
    }
    const uint16Info = PAYLOAD_TYPES['uint16'];
    if (uint16Info.min !== undefined && uint16Info.max !== undefined && value >= uint16Info.min && value <= uint16Info.max) {
        return 'uint16';
    }
    const int32Info = PAYLOAD_TYPES['int32'];
    if (int32Info.min !== undefined && int32Info.max !== undefined && value >= int32Info.min && value <= int32Info.max) {
        return 'int32';
    }
    const uint32Info = PAYLOAD_TYPES['uint32'];
    if (uint32Info.min !== undefined && uint32Info.max !== undefined && value >= uint32Info.min && value <= uint32Info.max) {
        return 'uint32';
    }

    throw new Error(`Data value ${value} is out of supported integer range.`);
};

const checkU16 = (value: number): PayloadTypeKey => {
    const uint16Info = PAYLOAD_TYPES['uint16'];
    if (Number.isInteger(value) && uint16Info.min !== undefined && uint16Info.max !== undefined && value >= uint16Info.min && value <= uint16Info.max) {
        return 'uint16';
    }

    throw new Error(`Data value ${value} is out of supported integer range for UInt16.`);
};

const checkFloatOrU16 = (value: number): PayloadTypeKey => {
    if (!Number.isInteger(value)) {
        return 'float';
    }

    const uint16Info = PAYLOAD_TYPES['uint16'];
    if (uint16Info.min !== undefined && uint16Info.max !== undefined && value >= uint16Info.min && value <= uint16Info.max) {
        return 'uint16';
    }

    throw new Error(`Data value ${value} is out of supported integer range for Float or UInt16.`);
};


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
            const numericInfo = typeInfo as NumericPayloadDetails;
            if (typeof value !== 'number' && typeof value !== 'boolean') {
                throw new Error(`Value for '${payloadTypeKey}' type must be a number or boolean.`);
            }
            const numValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;

            if (numericInfo.min !== undefined && numericInfo.max !== undefined) {
                if (numValue < numericInfo.min || numValue > numericInfo.max) {
                    throw new Error(`Value ${numValue} is out of range for ${payloadTypeKey} (min: ${numericInfo.min}, max: ${numericInfo.max}).`);
                }
            }

            dataBuffer = Buffer.alloc(numericInfo.size);
            payloadLength = numericInfo.size;
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
            if (typeof value !== 'string' || value.length !== 1) {
                throw new Error("Value for 'char' type must be a single character string.");
            }
            dataBuffer = Buffer.alloc(1);
            dataBuffer.writeUInt8(value.charCodeAt(0));
            payloadLength = 1;
            break;
        case 'string':
            dataBuffer = Buffer.from(value.toString(), 'utf8');
            payloadLength = dataBuffer.length;
            break;
        default:
            throw new Error(`Unhandled payload type during buffer creation: ${payloadTypeKey}`);
    }

    const lengthHex = payloadLength.toString(16).toUpperCase().padStart(2, '0');
    const typeHex = typeInfo.hex.toString(16).toUpperCase().padStart(2, '0');
    const dataHex = dataBuffer.toString('hex').toUpperCase();

    return Buffer.from(`${lengthHex}${typeHex}${dataHex}`, 'hex');
};

/**
 * Dynamically processes and builds a payload segment based on expected types.
 * @param value The raw value from the request body.
 * @param expectedTypes An array of expected payload types (e.g., ["string", "u16"]).
 * @param fieldName The name of the field being processed (for error messages).
 * @returns An object containing the built buffer, its hex representation, and the inferred payload type.
 */
const processAndBuildPayload = (value: any, expectedTypes: readonly string[], fieldName: string) => {
    let processedValue = value;

    // Attempt to convert string "true"/"false" or numeric strings to their actual types
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
            processedValue = true;
        } else if (value.toLowerCase() === 'false') {
            processedValue = false;
        } else if (!isNaN(parseFloat(value)) && String(parseFloat(value)) === value) { // Check if it's a numeric string
            processedValue = parseFloat(value);
        }
    }

    let builtBuffer: Buffer | null = null;
    let inferredType: PayloadTypeKey | null = null;

    for (const expectedType of expectedTypes) {
        try {
            let currentPayloadType: PayloadTypeKey;

            switch (expectedType) {
                case 'string':
                    if (typeof processedValue !== 'string') {
                        throw new Error(`Expected string for ${fieldName}, but got ${typeof processedValue}.`);
                    }
                    currentPayloadType = 'string';
                    break;
                case 'bool':
                    if (typeof processedValue !== 'boolean') {
                        throw new Error(`Expected boolean for ${fieldName}, but got ${typeof processedValue}.`);
                    }
                    currentPayloadType = 'bool';
                    break;
                case 'u8':
                    if (typeof processedValue !== 'number' || !Number.isInteger(processedValue)) {
                        throw new Error(`Expected integer for ${fieldName} (u8), but got ${typeof processedValue}.`);
                    }
                    currentPayloadType = inferNumericPayloadType(processedValue);
                    if (currentPayloadType !== 'uint8' && currentPayloadType !== 'int8') {
                        throw new Error(`Value ${processedValue} is out of range for u8 for ${fieldName}.`);
                    }
                    break;
                case 'u16':
                    if (typeof processedValue !== 'number' || !Number.isInteger(processedValue)) {
                        throw new Error(`Expected integer for ${fieldName} (u16), but got ${typeof processedValue}.`);
                    }
                    currentPayloadType = checkU16(processedValue);
                    break;
                case 'u32':
                    if (typeof processedValue !== 'number' || !Number.isInteger(processedValue)) {
                        throw new Error(`Expected integer for ${fieldName} (u32), but got ${typeof processedValue}.`);
                    }
                    currentPayloadType = inferNumericPayloadType(processedValue);
                    if (currentPayloadType !== 'uint32') {
                        throw new Error(`Value ${processedValue} is out of range for u32 for ${fieldName}.`);
                    }
                    break;
                case 'float':
                    if (typeof processedValue !== 'number') {
                        throw new Error(`Expected number for ${fieldName} (float), but got ${typeof processedValue}.`);
                    }
                    currentPayloadType = 'float';
                    break;
                case 'payload': // Generic numeric/boolean/string
                case 'data': // Generic numeric/boolean/string
                    if (typeof processedValue === 'number') {
                        currentPayloadType = inferNumericPayloadType(processedValue);
                    } else if (typeof processedValue === 'boolean') {
                        currentPayloadType = 'bool';
                    } else if (typeof processedValue === 'string') {
                        currentPayloadType = 'string';
                    } else {
                        throw new Error(`Unsupported data type for generic '${fieldName}' field: ${typeof processedValue}.`);
                    }
                    break;
                default:
                    throw new Error(`Unsupported expected data type in definition for ${fieldName}: ${expectedType}.`);
            }

            builtBuffer = buildPayloadSegment(processedValue, currentPayloadType);
            inferredType = currentPayloadType;
            break; // Successfully processed, exit loop
        } catch (error) {
            logger.warn(`Failed to process ${fieldName} as ${expectedType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Continue to try other expected types if available
        }
    }

    if (!builtBuffer) {
        throw new Error(`Value "${value}" is not compatible with any defined types for ${fieldName}.`);
    }

    return {
        buffer: builtBuffer,
        hex: builtBuffer.toString('hex').toUpperCase(),
        inferredType: inferredType
    };
};

export const controlSerialCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type: serialType } = req.body; // Extract mac and serialType initially
        const requestBody = req.body; // Keep the whole body for dynamic access

        if (!mac || !serialType) {
            return res.status(400).send({ message: "Missing required parameters: mac or type." });
        }

        const cmdInfo = CMD_SERIAL[serialType as keyof typeof CMD_SERIAL];
        if (cmdInfo === undefined) {
            return res.status(400).send({ message: `Invalid serial type: "${serialType}".` });
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
                    return res.status(400).send({ message: `Missing required parameter: "${key}" for serial type "${serialType}".` });
                }

                try {
                    const { buffer, hex, inferredType } = processAndBuildPayload(value, expectedTypes, key);
                    totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, buffer]);
                    breakdown[`${key}Segment`] = hex;
                    breakdown[`${key}InferredType`] = inferredType;
                    responseData[key] = value; // Store the original value in response
                } catch (error) {
                    logger.error(`Error processing field '${key}' for serial command: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    return res.status(400).send({ message: `Invalid value for field '${key}': ${error instanceof Error ? error.message : 'Unknown error'}` });
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
            return res.status(500).send({ message: "MQTT client not connected. Please try again later." });
        }
        publishMessage(client, `device/response/${mac}`, hexToSend);

        res.status(200).send({
            message: "Serial command sent successfully",
            data: responseData
        });
    } catch (error) {
        logger.error("Error in controlSerialCommand:", error);
        return res.status(500).send({ message: `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
};

export const controlModbusCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type: modbusType } = req.body;
        const requestBody = req.body;

        if (!mac || !modbusType) {
            return res.status(400).send({ message: "Missing required parameters: mac or type." });
        }

        const cmdInfo = CMD_MODBUS_CONTROL[modbusType as keyof typeof CMD_MODBUS_CONTROL];
        if (cmdInfo === undefined) {
            return res.status(400).send({ message: `Invalid Modbus command type: "${modbusType}".` });
        }
        const cmdHex = cmdInfo.CMD.toString(16).toUpperCase().padStart(2, '0');

        let totalPayloadsBuffer = Buffer.alloc(0);
        const responseData: { [key: string]: any } = { type: modbusType, mac };
        const breakdown: { [key: string]: string | PayloadTypeKey | null } = { cmd: cmdHex };

        // Process fields in the order defined in cmdInfo.dataType
        const orderedKeys: (keyof typeof cmdInfo.dataType)[] = ['id', 'address', 'function', 'data']; // Define explicit order

        for (const key of orderedKeys) {
            const expectedTypes = cmdInfo.dataType[key];
            const value = requestBody[key];

            if (value === undefined || value === null) {
                return res.status(400).send({ message: `Missing required Modbus parameter: "${key}" for command "${modbusType}".` });
            }

            try {
                const { buffer, hex, inferredType } = processAndBuildPayload(value, expectedTypes, key);
                totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, buffer]);
                breakdown[`${key}Segment`] = hex;
                breakdown[`${key}InferredType`] = inferredType;
                responseData[key] = value; // Store the original value in response
            } catch (error) {
                logger.error(`Error processing field '${key}' for Modbus command: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return res.status(400).send({ message: `Invalid value for Modbus field '${key}': ${error instanceof Error ? error.message : 'Unknown error'}` });
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
            return res.status(500).send({ message: "MQTT client not connected. Please try again later." });
        }

        publishMessage(client, `device/response/${mac}`, hexToSend);

        res.status(200).send({
            message: "Modbus command sent successfully",
            data: responseData
        });

    } catch (error) {
        logger.error("Error in controlModbusCommand:", error);
        return res.status(500).send({ message: `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
};