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
import { Buffer } from 'buffer'; // Đảm bảo Buffer được import

const CMD_RESPOND_TIMESTAMP = 0x14;
const CMD_NOTIFY_TCP = 0x3C;
const CMD_NOTIFY_UDP = 0x3D;
const PAYLOAD_I32 = 0x06;
const PAYLOAD_STRING = 0x0A; // Vẫn giữ biến này theo code gốc, dù chưa sử dụng

const CMD_SERIAL = {
    "CMD_REQUEST_SERIAL_RS485": {
        "CMD": 0x11,
        dataType: {
            data: ["string"] as const // 'as const' giúp TypeScript hiểu đây là một tuple
        }
    },
    "CMD_REQUEST_SERIAL_RS232": {
        "CMD": 0x12,
        dataType: {
            data: ["string"] as const
        }
    },
    "CMD_REQUEST_SERIAL_TCP/UDP": {
        "CMD": 0x13,
        dataType: {
            id: ["string"] as const,
            data: ["string"] as const
        }
    },
    // CAN Commands (vẫn giữ id)
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
            id: ["u8"] as const,
            data: ["u8", "u16", "bool"] as const
        }
    },
    "CMD_REQUEST_MODBUS_TCP": {
        "CMD": 0x10,
        dataType: {
            id: ["string"] as const,
            data: ["u8", "u16", "bool"] as const
        }
    },
} as const;

const HEX_COMMANDS = {
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' }
} as const;

// Định nghĩa kiểu dữ liệu cho PAYLOAD_TYPES rõ ràng hơn
type NumericPayloadDetails = {
    hex: number;
    size: number;
    min: number;
    max: number;
};

type OtherPayloadDetails = {
    hex: number;
    size: number; // size -1 cho biến đổi (string)
};

const PAYLOAD_TYPES = {
    'uint8': { hex: 0x01, size: 1, min: 0, max: 255 } as NumericPayloadDetails,
    'uint16': { hex: 0x02, size: 2, min: 0, max: 65535 } as NumericPayloadDetails,
    'uint32': { hex: 0x03, size: 4, min: 0, max: 4294967295 } as NumericPayloadDetails,
    'int8': { hex: 0x04, size: 1, min: -128, max: 127 } as NumericPayloadDetails,
    'int16': { hex: 0x05, size: 2, min: -32768, max: 32767 } as NumericPayloadDetails,
    'int32': { hex: 0x06, size: 4, min: -2147483648, max: 2147483647 } as NumericPayloadDetails,
    'bool': { hex: 0x07, size: 1, min: 0, max: 1 } as NumericPayloadDetails, // Boolean cũng có min/max
    'float': { hex: 0x08, size: 4 } as OtherPayloadDetails, // Float không có min/max rõ ràng cho việc suy luận range
    'char': { hex: 0x09, size: 1 } as OtherPayloadDetails,
    'string': { hex: 0x0A, size: -1 } as OtherPayloadDetails
} as const;

// Sử dụng keyof typeof PAYLOAD_TYPES để đảm bảo an toàn kiểu
type PayloadTypeKey = keyof typeof PAYLOAD_TYPES;

export const sendDataIots = async (req: Request, res: Response) => {
    try {
        const dataIots: any = await AlgorithmGetIot(); // Cân nhắc định nghĩa kiểu trả về của AlgorithmGetIot
        res.status(200).send(dataIots);
    } catch (error) {
        logger.error("Error in sendDataIots:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const SendDistinctIots = async (req: Request, res: Response) => {
    try {
        const data = await DistinctDataIot(req); // Cân nhắc định nghĩa kiểu trả về của DistinctDataIot
        res.status(200).send(data);
    } catch (error) {
        logger.error("Error in SendDistinctIots:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const UpdateDataIots = async (req: Request, res: Response) => {
    try {
        const dataIots: any = await UpdateDataIotsDetail(req); // Cân nhắc định nghĩa kiểu trả về của UpdateDataIotsDetail
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
                    payload: await Promise.all(dataPayload.map(async (item: any) => { // Cân nhắc kiểu item
                        const iotDevice = await IotSettings.findOne({
                            where: { id: item.device_id }
                        });
                        if (item.CMD === "CMD_NOTIFY_TCP" && iotDevice && iotDevice.toJSON().tcp_status !== "opened") {
                            return null;
                        }
                        if (item.CMD === "CMD_NOTIFY_UDP" && iotDevice && iotDevice.toJSON().udp_status !== "opened") { // Sửa thành udp_status
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
                await publishMessage(client, topic, dataHex.data); // publicData không cần gán vào biến
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

// --- START: HÀM SỬA LỖI TS2367 VÀ LOGIC KIỂM TRA KIỂU DỮ LIỆU ---

const inferNumericPayloadType = (value: number): PayloadTypeKey => {
    if (!Number.isInteger(value)) {
        return 'float';
    }

    // Đảm bảo các kiểm tra range dựa trên PAYLOAD_TYPES
    // Không dùng ! ở đây nữa, mà dùng guard để đảm bảo type an toàn
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
    // TypeScript sẽ phàn nàn về `min` hoặc `max` vì `typeInfo` có thể là `OtherPayloadDetails`
    // Cách giải quyết: dùng type guards hoặc ép kiểu
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
            // Với các kiểu số nguyên và bool, chúng ta biết chắc chắn có min/max
            // Cần đảm bảo `value` nằm trong phạm vi đã định nghĩa cho `typeInfo`
            const numericInfo = typeInfo as NumericPayloadDetails; // Ép kiểu an toàn hơn
            if (typeof value !== 'number' && typeof value !== 'boolean') {
                throw new Error(`Value for '${payloadTypeKey}' type must be a number or boolean.`);
            }
            // Đối với bool, giá trị `value` có thể là true/false
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
            else if (payloadTypeKey === 'bool') dataBuffer.writeUInt8(numValue); // Giá trị bool là 0 hoặc 1
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
            // Bỏ qua các kiểu logic như 'payload', 'data'
            // Nếu bạn có các kiểu này trong PAYLOAD_TYPES, bạn phải xử lý chúng hoặc loại bỏ chúng khỏi PayloadTypeKey
            throw new Error(`Unhandled payload type during buffer creation: ${payloadTypeKey}`);
    }

    const lengthHex = payloadLength.toString(16).toUpperCase().padStart(2, '0');
    const typeHex = typeInfo.hex.toString(16).toUpperCase().padStart(2, '0');
    const dataHex = dataBuffer.toString('hex').toUpperCase();

    return Buffer.from(`${lengthHex}${typeHex}${dataHex}`, 'hex');
};

// --- END: HÀM SỬA LỖI TS2367 VÀ LOGIC KIỂM TRA KIỂU DỮ LIỆU ---

export const controlSerialCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type: serialType, id, data: rawData, ipTcpSerial } = req.body;

        if (!mac || !serialType || rawData === undefined) {
            return res.status(400).send({ message: "Missing required parameters: mac, type, or data." });
        }

        let data: any = rawData;

        if (typeof rawData === 'string') {
            const numericValue = parseFloat(rawData);
            if (!isNaN(numericValue) && String(numericValue) === rawData) {
                data = numericValue;
            } else if (rawData.toLowerCase() === 'true') {
                data = true;
            } else if (rawData.toLowerCase() === 'false') {
                data = false;
            }
        }

        // Đảm bảo serialType là một key hợp lệ của CMD_SERIAL
        const cmdInfo = CMD_SERIAL[serialType as keyof typeof CMD_SERIAL];
        if (cmdInfo === undefined) {
            return res.status(400).send({ message: `Invalid serial type: "${serialType}".` });
        }

        const cmdHex = cmdInfo.CMD.toString(16).toUpperCase().padStart(2, '0');
        let totalPayloadsBuffer = Buffer.alloc(0);
        let idSegmentHex: string = 'N/A';
        let ipDataSegmentHex: string = 'N/A'; // Sẽ không dùng trực tiếp nữa nếu ipTcpSerial được tích hợp vào id
        let dataSegmentHex: string = 'N/A';
        let inferredDataType: PayloadTypeKey | null = null;


        // --- Bắt đầu thêm ID vào payload ---
        // Kiểm tra nếu `id` tồn tại trong dataType của cmdInfo
        if ('id' in cmdInfo.dataType && Array.isArray(cmdInfo.dataType.id) && cmdInfo.dataType.id.length > 0) {
            if (id === undefined || id === null) {
                return res.status(400).send({ message: `Missing required parameter: id for serial type "${serialType}".` });
            }

            const idType = cmdInfo.dataType.id[0]; // Lấy kiểu đầu tiên trong list id

            if (idType === 'u32') { // Đây là trường hợp ID CAN
                try {
                    const numericId = parseInt(id, 10);
                    if (isNaN(numericId)) {
                        return res.status(400).send({ message: "ID must be a valid number or convertible to a number for u32 payload type." });
                    }
                    const idBuffer = buildPayloadSegment(numericId, "uint32"); // Sử dụng "uint32" là PayloadTypeKey
                    totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, idBuffer]);
                    idSegmentHex = idBuffer.toString('hex').toUpperCase();
                } catch (error) {
                    logger.error(`Error processing ID as u32: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    return res.status(500).send({ message: `Error processing ID as u32: ${error instanceof Error ? error.message : 'Unknown error'}` });
                }
            } else if (idType === 'string') { // Đây là trường hợp ID/IP của CMD_REQUEST_SERIAL_TCP_UDP
                if (typeof id !== 'string' || !isValidIpAddress(id)) { // Giả định ID string là IP address
                    return res.status(400).send({ message: `Invalid ID format for string type. Must be a valid IPv4 address string.` });
                }
                try {
                    const idBuffer = buildPayloadSegment(id, 'string');
                    totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, idBuffer]);
                    idSegmentHex = idBuffer.toString('hex').toUpperCase();
                    // ipDataSegmentHex không còn cần thiết nếu id đã xử lý IP
                } catch (error) {
                    logger.error(`Error processing ID as string (IP): ${error instanceof Error ? error.message : 'Unknown error'}`);
                    return res.status(500).send({ message: `Error processing ID as string (IP): ${error instanceof Error ? error.message : 'Unknown error'}` });
                }
            } else {
                return res.status(400).send({ message: `Unsupported ID type defined for "${serialType}": '${idType}'.` });
            }
        } else if (id !== undefined && id !== null) {
            // Nếu id được cung cấp nhưng định nghĩa CMD_SERIAL không yêu cầu (nghĩa là không phải lệnh CAN hoặc TCP_UDP ID), đây là lỗi
            return res.status(400).send({ message: `ID is not expected for serial type "${serialType}".` });
        }
        // --- Kết thúc thêm ID vào payload ---

        // --- BỎ PHẦN XỬ LÝ IP TCP NÀY, VÌ NÓ ĐÃ ĐƯỢC TÍCH HỢP VÀO LOGIC XỬ LÝ ID BÊN TRÊN ---
        // if (serialType === 'CMD_REQUEST_SERIAL_TCP') { ... }
        // Thay vào đó, nếu bạn có lệnh TCP riêng (CMD_REQUEST_SERIAL_TCP_UDP) và muốn id là địa chỉ IP,
        // thì logic phía trên đã xử lý. Nếu bạn muốn `ipTcpSerial` là một payload riêng biệt,
        // bạn cần định nghĩa nó trong `dataType.data` của lệnh tương ứng.
        // Dựa trên định nghĩa mới, CMD_REQUEST_SERIAL_TCP_UDP có ID là string (IP), nên không cần ipTcpSerial riêng nữa.
        // Nếu `ipTcpSerial` vẫn là một tham số riêng biệt cho các lệnh TCP khác, hãy định nghĩa nó trong `dataType.data` của lệnh đó.
        // Hiện tại, tôi sẽ giả định `ipTcpSerial` là thừa nếu `id` đã là IP.
        // Nếu bạn muốn ipTcpSerial riêng, bạn cần thay đổi định nghĩa CMD_SERIAL.
        if (ipTcpSerial !== undefined && ipTcpSerial !== null && serialType !== 'CMD_REQUEST_SERIAL_TCP_UDP') {
            // Cảnh báo nếu ipTcpSerial được gửi cho lệnh không yêu cầu nó.
            logger.warn(`ipTcpSerial provided for serial type "${serialType}" which does not expect it.`);
        }
        // --- KẾT THÚC BỎ PHẦN XỬ LÝ IP TCP ---


        // --- Xử lý Data (dữ liệu lệnh) với suy luận kiểu ---
        const expectedDataTypes = cmdInfo.dataType.data;
        if (!expectedDataTypes) { // Thêm kiểm tra length cho an toàn
            return res.status(500).send({ message: `No data types defined for command ${serialType}.` });
        }

        let dataProcessed = false;
        for (const expectedType of expectedDataTypes) {
            try {
                let currentDataPayloadType: PayloadTypeKey;

                if (expectedType === 'string') {
                    if (typeof data !== 'string') {
                        throw new Error(`Expected string data for type '${serialType}', but got ${typeof data}.`);
                    }
                    currentDataPayloadType = 'string';
                } else if (expectedType === 'bool') {
                    if (typeof data !== 'boolean') {
                        throw new Error(`Expected boolean data for type '${serialType}', but got ${typeof data}.`);
                    }
                    currentDataPayloadType = 'bool';
                } else if (typeof data === 'number') {
                    // Logic suy luận kiểu số như cũ
                    if (expectedType === 'u16') {
                        currentDataPayloadType = checkU16(data);
                    } else if (expectedType === 'float') {
                        currentDataPayloadType = checkFloatOrU16(data);
                    } else {
                        currentDataPayloadType = inferNumericPayloadType(data);
                    }

                    // Loại bỏ kiểm tra chặt chẽ gây lỗi TS2367
                    // if (['u8', 'u16', 'u32', 'int8', 'int16', 'int32', 'float'].includes(expectedType) && expectedType !== currentDataPayloadType) {
                    //     // Removed strict comparison that caused TS2367
                    // }
                } else if (expectedType === 'payload' || expectedType === 'data') {
                    // Đây là các placeholder, suy luận từ giá trị `data` thực tế.
                    if (typeof data === 'number') {
                        currentDataPayloadType = inferNumericPayloadType(data);
                    } else if (typeof data === 'boolean') {
                        currentDataPayloadType = 'bool';
                    } else if (typeof data === 'string') {
                        currentDataPayloadType = 'string';
                    } else {
                        throw new Error(`Unsupported data type for 'data' field when expected 'payload'/'data' type: ${typeof data}.`);
                    }
                } else {
                    throw new Error(`Unsupported expected data type in definition: ${expectedType}.`);
                }

                const dataBuffer = buildPayloadSegment(data, currentDataPayloadType);
                totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, dataBuffer]);
                dataSegmentHex = dataBuffer.toString('hex').toUpperCase();
                inferredDataType = currentDataPayloadType;
                dataProcessed = true;
                break;
            } catch (error) {
                logger.warn(`Failed to process data as ${expectedType} for serial type "${serialType}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        if (!dataProcessed) {
            return res.status(400).send({ message: `Data value "${rawData}" is not compatible with any defined types for command "${serialType}".` });
        }
        // --- Kết thúc xử lý Data ---

        const dataForCrcCalculation = Buffer.concat([Buffer.from(cmdHex, 'hex'), totalPayloadsBuffer]);
        const calculatedCrcValue = calculateCRC8(dataForCrcCalculation);
        const crcHex = calculatedCrcValue.toString(16).toUpperCase().padStart(2, '0');

        const hexToSend = `${cmdHex}${totalPayloadsBuffer.toString('hex').toUpperCase()}${crcHex}`;

        logger.info(`[Serial Command] Type: ${serialType}, CMD: ${cmdHex}, ID: ${id || 'N/A'}, Data: ${data}, IP (as String): ${ipTcpSerial || 'N/A'}, Complete Packet: ${hexToSend}`);

        if (!client || !client.connected) {
            logger.error("MQTT client not connected. Cannot publish message.");
            return res.status(500).send({ message: "MQTT client not connected. Please try again later." });
        }
        publishMessage(client, `device/response/${mac}`, hexToSend);

        res.status(200).send({
            message: "Serial command sent successfully",
            data: {
                serialType: serialType,
                id: id || null,
                originalCommand: rawData,
                ipTcpSerial: ipTcpSerial || null, // Vẫn trả về nếu có, dù không dùng để tạo hex
                hexCommand: hexToSend,
                breakdown: {
                    cmd: cmdHex,
                    idSegment: idSegmentHex,
                    ipDataSegment: ipDataSegmentHex, // Có thể vẫn N/A nếu ID đã xử lý IP
                    dataSegment: dataSegmentHex,
                    inferredDataType: inferredDataType,
                    crc: crcHex
                }
            }
        });
    } catch (error) {
        logger.error("Error in controlSerialCommand:", error);
        return res.status(500).send({ message: `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
};

export const controlModbusCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type, id, address, function: modbusFunction, data: rawData, ipAddress } = req.body; // ipAddress không dùng, giữ nguyên theo code gốc

        let data: any = rawData;

        // Chuyển đổi rawData nếu cần
        if (typeof rawData === 'string') {
            if (rawData.toLowerCase() === 'true') {
                data = true;
            } else if (rawData.toLowerCase() === 'false') {
                data = false;
            } else if (/^\d+$/.test(rawData.trim())) {
                data = parseInt(rawData, 10);
            } else {
                data = rawData;
            }
        }

        if (!mac || !type || address === undefined || modbusFunction === undefined || data === undefined) {
            return res.status(400).send({ message: "Missing required Modbus parameters: mac, type, address, function, or data." });
        }

        const cmdInfo = CMD_MODBUS_CONTROL[type as keyof typeof CMD_MODBUS_CONTROL];
        if (cmdInfo === undefined) {
            return res.status(400).send({ message: `Invalid Modbus command type: "${type}".` });
        }
        const cmdHex = cmdInfo.CMD.toString(16).toUpperCase().padStart(2, '0');

        let totalPayloadsBuffer = Buffer.alloc(0);
        let finalModbusUnitId: number | string | null = null;
        let finalIpAddressForTCP: string | undefined = undefined;


        // Xử lý ID (Unit ID hoặc IP) dựa trên định nghĩa Modbus
        const expectedIdTypes = cmdInfo.dataType.id;
        if (!expectedIdTypes) {
            return res.status(500).send({ message: `No ID types defined for Modbus command ${type}.` });
        }

        let idProcessed = false;
        for (const expectedIdType of expectedIdTypes) {
            try {
                let currentIdPayloadType: PayloadTypeKey;

                if (expectedIdType === 'u8') { // Modbus RTU ID
                    // Sửa lỗi TS2345: đảm bảo id là số nguyên hoặc chuyển đổi được
                    const parsedId = typeof id === 'string' ? parseInt(id, 10) : id;
                    if (parsedId === null || parsedId === undefined || !Number.isInteger(parsedId) || parsedId < PAYLOAD_TYPES.uint8.min!.valueOf() || parsedId > PAYLOAD_TYPES.uint8.max!.valueOf()) {
                        throw new Error("Slave ID (ID) is required and must be a number 0-255 or a non-empty convertible string for Modbus RTU.");
                    }
                    currentIdPayloadType = 'uint8';
                    const idBuffer = buildPayloadSegment(parsedId, currentIdPayloadType);
                    totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, idBuffer]);
                    finalModbusUnitId = parsedId;
                    idProcessed = true;
                    break;
                } else if (expectedIdType === 'string') { // Modbus TCP IP
                    if (!id || typeof id !== 'string' || !isValidIpAddress(id)) {
                        throw new Error("IP address (ID) is required and must be a valid string for Modbus TCP.");
                    }
                    currentIdPayloadType = 'string';
                    const idBuffer = buildPayloadSegment(id, currentIdPayloadType);
                    totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, idBuffer]);
                    finalIpAddressForTCP = id;
                    idProcessed = true;
                    break;
                } else {
                    throw new Error(`Unsupported expected ID type in definition: ${expectedIdType}.`);
                }
            } catch (error) {
                logger.warn(`Failed to process Modbus ID as ${expectedIdType} for command "${type}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        if (!idProcessed) {
            return res.status(400).send({ message: `ID value "${id}" is not compatible with any defined ID types for Modbus command "${type}".` });
        }


        // Xử lý Address (luôn là uint16)
        try {
            if (address === undefined || typeof address !== 'number' || !Number.isInteger(address) || address < PAYLOAD_TYPES.uint16.min!.valueOf() || address > PAYLOAD_TYPES.uint16.max!.valueOf()) {
                return res.status(400).send({ message: "Address is required and must be a valid UInt16 number (0-65535)." });
            }
            const addressBuffer = buildPayloadSegment(address, 'uint16');
            totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, addressBuffer]);
        } catch (error) {
            logger.error(`Error processing Modbus address: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return res.status(400).send({ message: `Error processing address: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }


        // Xử lý Function (luôn là uint8)
        try {
            if (modbusFunction === undefined || typeof modbusFunction !== 'number' || !Number.isInteger(modbusFunction) || modbusFunction < PAYLOAD_TYPES.uint8.min!.valueOf() || modbusFunction > PAYLOAD_TYPES.uint8.max!.valueOf()) {
                return res.status(400).send({ message: "Function code is required and must be a valid UInt8 number (0-255)." });
            }
            const functionBuffer = buildPayloadSegment(modbusFunction, 'uint8');
            totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, functionBuffer]);
        } catch (error) {
            logger.error(`Error processing Modbus function code: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return res.status(400).send({ message: `Error processing function: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }


        // Xử lý Data
        const expectedDataTypes = cmdInfo.dataType.data;
        if (!expectedDataTypes) {
            return res.status(500).send({ message: `No data types defined for Modbus command ${type}.` });
        }

        let dataProcessed = false;
        let inferredDataType: PayloadTypeKey | null = null;
        for (const expectedType of expectedDataTypes) {
            try {
                let currentDataPayloadType: PayloadTypeKey;

                if (typeof data === 'number') {
                    if (expectedType === 'u8') {
                        currentDataPayloadType = inferNumericPayloadType(data);
                        if (currentDataPayloadType !== 'uint8') { // Chỉ chấp nhận uint8 nếu rõ ràng
                            throw new Error(`Data ${data} is not compatible with uint8 for Modbus.`);
                        }
                    } else if (expectedType === 'u16') {
                        currentDataPayloadType = checkU16(data);
                    } else { // 'bool' hoặc các kiểu số khác
                        currentDataPayloadType = inferNumericPayloadType(data);
                    }
                } else if (typeof data === 'boolean') {
                    if (expectedType !== 'bool') { // Nếu data là bool nhưng expected không phải bool
                        throw new Error(`Expected boolean data for Modbus type 'bool', but got ${typeof data}.`);
                    }
                    currentDataPayloadType = 'bool';
                } else { // Nếu data là string
                    // Modbus không có kiểu string trực tiếp cho data như thế này, nhưng để giữ logic ban đầu,
                    // nếu `data` là string và `expectedType` không xử lý, nó sẽ throw lỗi.
                    throw new Error(`Unsupported data type for 'data' field: ${typeof data}.`);
                }

                const dataBuffer = buildPayloadSegment(data, currentDataPayloadType);
                totalPayloadsBuffer = Buffer.concat([totalPayloadsBuffer, dataBuffer]);
                inferredDataType = currentDataPayloadType;
                dataProcessed = true;
                break;
            } catch (error) {
                logger.warn(`Failed to process Modbus data as ${expectedType} for command "${type}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        if (!dataProcessed) {
            return res.status(400).send({ message: `Modbus data value "${rawData}" is not compatible with any defined types for command "${type}".` });
        }


        // Tính toán CRC
        const dataForCrcCalculation = Buffer.concat([Buffer.from(cmdHex, 'hex'), totalPayloadsBuffer]);
        const calculatedCrcValue = calculateCRC8(dataForCrcCalculation);
        const crcHex = calculatedCrcValue.toString(16).toUpperCase().padStart(2, '0');

        const hexToSend = `${cmdHex}${totalPayloadsBuffer.toString('hex').toUpperCase()}${crcHex}`;

        logger.info(`[Modbus Command] MAC: ${mac}, Type: ${type}, Complete Hex: ${hexToSend}`);

        if (!client || !client.connected) {
            logger.error("MQTT client not connected. Cannot publish message.");
            return res.status(500).send({ message: "MQTT client not connected. Please try again later." });
        }

        publishMessage(client, `device/response/${mac}`, hexToSend);


        res.status(200).send({
            message: "Modbus command sent successfully",
            data: {
                type: type,
                mac: mac,
                id: finalModbusUnitId,
                ipAddress: finalIpAddressForTCP,
                address: address,
                function: modbusFunction,
                data: rawData,
                inferredDataType: inferredDataType,
                hexCommand: hexToSend,
            }
        });

    } catch (error) {
        logger.error("Error in controlModbusCommand:", error);
        return res.status(500).send({ message: `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
};