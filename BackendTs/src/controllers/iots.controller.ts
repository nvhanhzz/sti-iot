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
import {MasterIotInterface} from "../interface";
import {ConvertDatatoHex} from "../global/convertData.global";
import logger from "../config/logger";
import IotSettings from "../models/sql/iot_settings.models";

const CMD_RESPOND_TIMESTAMP = 0x14; // Trong C++ code của bạn, CMD_RESPOND_TIMESTAMP là 0x14 (decimal 20)
const CMD_NOTIFY_TCP = 0x3C;
const CMD_NOTIFY_UDP = 0x3D;
const PAYLOAD_I32 = 0x06;           // int32 (Timestamp là số nguyên 32-bit)
const PAYLOAD_STRING = 0x0A;

const CMD_SERIAL = {
    "CMD_REQUEST_SERIAL_RS485": 0x11,
    "CMD_REQUEST_SERIAL_RS232": 0x12,
    "CMD_REQUEST_SERIAL_TCP": 0x13,
    "CMD_WRITE_IO_DO1": 0x22,
    "CMD_WRITE_IO_DO2": 0x23,
    "CMD_WRITE_IO_DO3": 0x24,
    "CMD_WRITE_IO_DO4": 0x25,
    "CMD_WRITE_IO_DO5": 0x26,
    "CMD_WRITE_IO_DO6": 0x27,
    "CMD_WRITE_IO_DO7": 0x28,
    "CMD_WRITE_IO_DO8": 0x29,
    "CMD_WRITE_IO_AO1": 0x32,
    "CMD_WRITE_IO_AO2": 0x33,
    "CMD_WRITE_IO_AO3": 0x34,
    "CMD_WRITE_IO_AO4": 0x35,
    "CMD_WRITE_IO_AO5": 0x36,
    "CMD_WRITE_IO_AO6": 0x37,
    "CMD_WRITE_IO_AO7": 0x38,
    "CMD_WRITE_IO_AO8": 0x39,
    "CMD_WRITE_IO_RS232": 0x3A,
    "CMD_WRITE_IO_RS485": 0x3B
} as const;

const CMD_MODBUS_CONTROL = {
    "CMD_REQUEST_MODBUS_RS485": 0x08,
    "CMD_REQUEST_MODBUS_TCP": 0x10,
} as const;

const HEX_COMMANDS = {
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' }
} as const;

const PAYLOAD_TYPES = {
    'uint8': { hex: 0x01, size: 1, min: 0, max: 255 }, // Thêm min/max cho suy luận
    'uint16': { hex: 0x02, size: 2, min: 0, max: 65535 }, // Thêm min/max cho suy luận
    'uint32': { hex: 0x03, size: 4, min: 0, max: 4294967295 }, // Thêm min/max cho suy luận
    'int8': { hex: 0x04, size: 1, min: -128, max: 127 },
    'int16': { hex: 0x05, size: 2, min: -32768, max: 32767 },
    'int32': { hex: 0x06, size: 4, min: -2147483648, max: 2147483647 },
    'bool': { hex: 0x07, size: 1, min: 0, max: 1 },
    'float': { hex: 0x08, size: 4 },
    'char': { hex: 0x09, size: 1 },
    'string': { hex: 0x0A, size: -1 }
} as const;

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

export const calculateCRC8 = (data: Buffer): number => {
    let crc = 0xFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let bit = 8; bit > 0; bit--) {
            if (crc & 0x80) {
                crc = ((crc << 1) ^ 0x07) & 0xFF; // '& 0xFF' để giữ 8 bit
            } else {
                crc = (crc << 1) & 0xFF; // '& 0xFF' để giữ 8 bit
            }
        }
    }
    return crc;
};

export const deviceUpdateData = async (topic: string, message: Buffer) => {
    const mac = (topic.split('/')).length > 1 ? (topic.split('/'))[1] : '';
    if (message[0] === CMD_RESPOND_TIMESTAMP) { // Kiểm tra nếu lệnh là yêu cầu timestamp (CMD_RESPOND_TIMESTAMP có giá trị 0x14 = 20)

        // 1. Lấy Timestamp hiện tại (số giây kể từ Epoch)
        const currentEpochTimestamp = Math.floor(Date.now() / 1000); // Ví dụ: 1717408476

        // 2. Chuyển đổi Timestamp thành chuỗi hex data
        // Sử dụng PAYLOAD_I32 vì Timestamp là số nguyên 32-bit
        // ConvertDatatoHex cần đảm bảo Big-Endian (4 bytes)
        const timestampDataHex = ConvertDatatoHex(currentEpochTimestamp, 'int32'); // Ví dụ: "683FFA1C"

        // 3. Xây dựng các phần của gói tin hex
        const cmdHex = CMD_RESPOND_TIMESTAMP.toString(16).toUpperCase().padStart(2, '0'); // "14"
        const lengthHex = '04'; // Timestamp là 4 byte (cho int32/uint32)
        const typeHex = PAYLOAD_I32.toString(16).toUpperCase().padStart(2, '0'); // "06"

        // Ghép nối các phần payload: length | type | data
        const payloadPart = `${lengthHex}${typeHex}${timestampDataHex}`; // Ví dụ: "0407683FFA1C"

        // 4. Tính toán CRC cho phần CMD + Payload
        const dataForCrcCalculation = Buffer.from(`${cmdHex}${payloadPart}`, 'hex');
        const calculatedCrcValue = calculateCRC8(dataForCrcCalculation);
        const crcHex = calculatedCrcValue.toString(16).toUpperCase().padStart(2, '0'); // Ví dụ: "C5"

        // 5. Ghép nối để tạo gói tin hex hoàn chỉnh
        const hexToSend = `${cmdHex}${payloadPart}${crcHex}`; // Ví dụ: "140407683FFA1CC5"

        console.log(`Generated Timestamp Response: ${hexToSend}`);

        // Gửi gói tin hex qua MQTT broker
        publishMessage(client, `device/response/${mac}`, hexToSend);

        // Dừng xử lý tiếp nếu đây là lệnh yêu cầu Timestamp
        return;
    }

    const dataJson: any = await ConvertDataHextoJson(message);

    // iotsLogger.info(dataJson);
    if (dataJson.status) {
        dataJson.mac = (topic.split('/')).length > 1 ? (topic.split('/'))[1] : '';
        const dataIot = MasterIotGlobal.findByMac(dataJson.mac);
        if (dataIot) {
            dataJson.topic = topic;
            dataJson.status = 'in';
            dataJson.type = 2;
            // dataJson.time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            for (const payload of dataJson.payload) {
                if (payload.payload_name === 'timestamp') {
                    const dateObject = new Date(payload.timestamp * 1000);

                    // const adjustedHour = (dateObject.getHours() - 7 + 24) % 24;
                    const hours = String(dateObject.getHours()).padStart(2, '0');
                    const minutes = String(dateObject.getMinutes()).padStart(2, '0');
                    const seconds = String(dateObject.getMinutes()).padStart(2, '0');
                    const milliseconds = String(dateObject.getMilliseconds()).padStart(3, '0');

                    dataJson.time = `${hours}:${minutes}:${seconds}.${milliseconds}`;
                    // dataJson.time = payload.timestamp;
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
            await sendDataRealTime(dataIot.id);
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
                    payload: await Promise.all(dataPayload.map(async (item) => {
                        const iotDevice = await IotSettings.findOne({
                            where: { id: item.device_id }
                        });
                        if (item.CMD === "CMD_PUSH_TCP" && iotDevice && iotDevice.toJSON().tcp_status !== "opened") {
                            return null;
                        }
                        if (item.CMD === "CMD_PUSH_UDP" && iotDevice && iotDevice.toJSON().tcp_status !== "opened") {
                            return null;
                        }

                        return item;
                    }))
                        .then(results => results.filter(item => item !== null))
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
            // Cập nhật trạng thái trong database
            iotDevice.set(updateField, updateStatus);
            await iotDevice.save();
            logger.info(`Updated ${updateField} for device ${mac} in DB to ${updateStatus}.`);

            // <-- Cập nhật dữ liệu trong global storage sử dụng phương thức 'update' có sẵn -->
            // Chuyển đối tượng Sequelize model thành plain object bằng .toJSON()
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

// Hàm kiểm tra định dạng IP v4
const isValidIpAddress = (ip: string): boolean => {
    // Regex cho IPv4 đơn giản
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
};

const inferNumericPayloadType = (value: number): keyof typeof PAYLOAD_TYPES => {
    // Logic này hiện chỉ suy luận uint. Cần điều chỉnh nếu bạn muốn suy luận cả int.
    // Đối với int, bạn cần kiểm tra cả min/max của int8, int16, int32.
    // Ví dụ, để xử lý số âm:
    if (!Number.isInteger(value)) {
        // Nếu là số thập phân, coi là float
        return 'float';
    }

    if (value >= PAYLOAD_TYPES.int8.min && value <= PAYLOAD_TYPES.int8.max) {
        return 'int8';
    }
    if (value >= PAYLOAD_TYPES.uint8.min && value <= PAYLOAD_TYPES.uint8.max) {
        return 'uint8';
    }
    if (value >= PAYLOAD_TYPES.int16.min && value <= PAYLOAD_TYPES.int16.max) {
        return 'int16';
    }
    if (value >= PAYLOAD_TYPES.uint16.min && value <= PAYLOAD_TYPES.uint16.max) {
        return 'uint16';
    }
    if (value >= PAYLOAD_TYPES.int32.min && value <= PAYLOAD_TYPES.int32.max) {
        return 'int32';
    }
    if (value >= PAYLOAD_TYPES.uint32.min && value <= PAYLOAD_TYPES.uint32.max) {
        return 'uint32';
    }

    throw new Error(`Data value ${value} is out of supported integer range.`);
};

const checkU16 = (value: number): keyof typeof PAYLOAD_TYPES => {
    if (Number.isInteger(value) && value >= PAYLOAD_TYPES.uint16.min && value <= PAYLOAD_TYPES.uint16.max) {
        return 'uint16';
    }

    throw new Error(`Data value ${value} is out of supported integer range.`);
};

const checkFloatOrU16 = (value: number): keyof typeof PAYLOAD_TYPES => {
    if (!Number.isInteger(value)) {
        return 'float';
    }

    if (value >= PAYLOAD_TYPES.uint16.min && value <= PAYLOAD_TYPES.uint16.max) {
        return 'uint16';
    }

    throw new Error(`Data value ${value} is out of supported integer range.`);
};

const buildPayloadSegment = (value: any, payloadTypeKey: keyof typeof PAYLOAD_TYPES): Buffer => {
    const typeInfo = PAYLOAD_TYPES[payloadTypeKey];
    if (!typeInfo) {
        throw new Error(`Unsupported payload type key: ${payloadTypeKey}`);
    }

    let dataBuffer: Buffer;
    let payloadLength: number;

    switch (payloadTypeKey) {
        case 'uint8':
            dataBuffer = Buffer.alloc(1);
            dataBuffer.writeUInt8(value);
            payloadLength = 1;
            break;
        case 'int8':
            dataBuffer = Buffer.alloc(1);
            dataBuffer.writeInt8(value);
            payloadLength = 1;
            break;
        case 'uint16':
            dataBuffer = Buffer.alloc(2);
            dataBuffer.writeUInt16BE(value);
            payloadLength = 2;
            break;
        case 'int16':
            dataBuffer = Buffer.alloc(2);
            dataBuffer.writeInt16BE(value);
            payloadLength = 2;
            break;
        case 'uint32':
            dataBuffer = Buffer.alloc(4);
            dataBuffer.writeUInt32BE(value);
            payloadLength = 4;
            break;
        case 'int32':
            dataBuffer = Buffer.alloc(4);
            dataBuffer.writeInt32BE(value); // <-- Sử dụng cho ID mặc định
            payloadLength = 4;
            break;
        case 'bool':
            dataBuffer = Buffer.alloc(1);
            dataBuffer.writeUInt8(value ? 1 : 0);
            payloadLength = 1;
            break;
        case 'float':
            dataBuffer = Buffer.alloc(4);
            dataBuffer.writeFloatBE(value);
            payloadLength = 4;
            break;
        case 'char': // Xử lý ký tự đơn
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

export const controlSerialCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type: serialType, id, data: rawData, ipTcpSerial } = req.body;

        if (!mac || !serialType || rawData === undefined) { // `data` có thể là 0, false, null, nên kiểm tra `undefined`
            res.status(400).send({ message: "Missing required parameters: mac, type, or data." });
            return;
        }

        let data: any = rawData;

        if (typeof rawData === 'string') {
            const numericValue = parseFloat(rawData);
            if (!isNaN(numericValue)) {
                data = numericValue;
            } else if (rawData.toLowerCase() === 'true') {
                data = true;
            } else if (rawData.toLowerCase() === 'false') {
                data = false;
            }
        }

        if (id === undefined && serialType !== "CMD_REQUEST_SERIAL_RS485" && serialType !== "CMD_REQUEST_SERIAL_RS232" && serialType !== "CMD_REQUEST_SERIAL_TCP") {
            res.status(400).send({ message: "Missing required parameter: id for this serial type." });
            return;
        }

        if (serialType.toUpperCase() === 'CMD_REQUEST_SERIAL_TCP') {
            if (!ipTcpSerial) {
                res.status(400).send({ message: "ipTcpSerial is required for CMD_PUSH_SERIAL_TCP type." });
                return;
            }
            if (typeof ipTcpSerial !== 'string' || !isValidIpAddress(ipTcpSerial)) {
                res.status(400).send({ message: `Invalid ipTcpSerial format. Must be a valid IPv4 address string.` });
                return;
            }
        }

        const cmd = CMD_SERIAL[serialType as keyof typeof CMD_SERIAL];
        if (cmd === undefined) {
            res.status(400).send({ message: `Invalid serial type: "${serialType}".` });
            return;
        }

        const cmdHex = cmd.toString(16).toUpperCase().padStart(2, '0');
        let totalPayloadsBuffer = Buffer.alloc(0); // Sử dụng Buffer để nối các payload

        // --- Bắt đầu thêm ID vào payload (luôn là int32 nếu ID tồn tại) ---
        if (id !== undefined && id !== null) { // Kiểm tra id không phải là null hoặc undefined
            try {
                // Chuyển đổi ID sang số nguyên, sau đó đóng gói là int32
                const numericId = parseInt(id, 10);
                if (isNaN(numericId)) {
                    res.status(400).send({ message: "ID must be a valid number or convertible to a number for int32 payload type." });
                    return;
                }
                totalPayloadsBuffer = Buffer.concat([
                    totalPayloadsBuffer,
                    buildPayloadSegment(numericId, 'int32') // Mặc định ID là int32
                ]);
            } catch (error) {
                res.status(500).send({ message: `Error processing ID as int32: ${error instanceof Error ? error.message : 'Unknown error'}` });
                return;
            }
        }
        // --- Kết thúc thêm ID vào payload ---

        // --- Xử lý IP TCP nếu có ---
        if (serialType.toUpperCase() === 'CMD_PUSH_SERIAL_TCP' && ipTcpSerial) {
            totalPayloadsBuffer = Buffer.concat([
                totalPayloadsBuffer,
                buildPayloadSegment(ipTcpSerial, 'string')
            ]);
        }
        // --- Kết thúc xử lý IP TCP ---

        // --- Xử lý Data (dữ liệu lệnh) với suy luận kiểu ---
        let dataPayloadType: keyof typeof PAYLOAD_TYPES;
        try {
            if (typeof data === 'number') {
                dataPayloadType = checkFloatOrU16(data); // Suy luận kiểu số
            } else if (typeof data === 'string' && data.length === 1) {
                dataPayloadType = 'char'; // Ký tự đơn
            } else if (typeof data === 'string') {
                dataPayloadType = 'string'; // Chuỗi
            } else if (typeof data === 'boolean') {
                dataPayloadType = 'bool'; // Boolean
            } else {
                res.status(400).send({ message: `Unsupported data type for 'data' field: ${typeof data}.` });
                return;
            }
            totalPayloadsBuffer = Buffer.concat([
                totalPayloadsBuffer,
                buildPayloadSegment(data, dataPayloadType) // Sử dụng kiểu dữ liệu đã suy luận
            ]);
        } catch (error) {
            res.status(400).send({ message: `Error processing data: ${error instanceof Error ? error.message : 'Unknown error'}` });
            return;
        }
        // --- Kết thúc xử lý Data ---


        // Tính toán CRC dựa trên CMD + tất cả các segment payload
        const dataForCrcCalculation = Buffer.concat([Buffer.from(cmdHex, 'hex'), totalPayloadsBuffer]);
        const calculatedCrcValue = calculateCRC8(dataForCrcCalculation);
        const crcHex = calculatedCrcValue.toString(16).toUpperCase().padStart(2, '0');

        // Gói hex hoàn chỉnh
        const hexToSend = `${cmdHex}${totalPayloadsBuffer.toString('hex').toUpperCase()}${crcHex}`;

        console.log(`[Serial Command] Type: ${serialType}, CMD: ${cmdHex}, ID: ${id || 'N/A'}, Data: ${data}, IP (as String): ${ipTcpSerial || 'N/A'}, Complete Packet: ${hexToSend}`);

        // Kiểm tra kết nối MQTT và gửi tin nhắn
        if (!client || !client.connected) {
            console.error("MQTT client not connected. Cannot publish message.");
            res.status(500).send({ message: "MQTT client not connected. Please try again later." });
            return;
        }
        publishMessage(client, `device/response/${mac}`, hexToSend);

        res.status(200).send({
            message: "Serial command sent successfully",
            data: {
                serialType: serialType,
                id: id || null,
                originalCommand: data,
                ipTcpSerial: ipTcpSerial || null,
                hexCommand: hexToSend,
                breakdown: {
                    cmd: cmdHex,
                    idSegment: (id !== undefined && id !== null) ? buildPayloadSegment(parseInt(id, 10), 'int32').toString('hex').toUpperCase() : 'N/A', // Hiển thị segment ID
                    ipDataSegment: (serialType.toUpperCase() === 'CMD_PUSH_SERIAL_TCP' && ipTcpSerial)
                        ? buildPayloadSegment(ipTcpSerial, 'string').toString('hex').toUpperCase()
                        : 'N/A',
                    dataSegment: buildPayloadSegment(data, dataPayloadType).toString('hex').toUpperCase(), // Hiển thị segment Data
                    crc: crcHex
                }
            }
        });
    } catch (error) {
        console.error("Error in controlSerialCommand:", error);
        if (error instanceof Error) {
            res.status(500).send({ message: `Internal Server Error: ${error.message}` });
        } else {
            res.status(500).send({ message: "Internal Server Error" });
        }
    }
};

export const controlModbusCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type, id, address, function: modbusFunction, data: rawData, ipAddress } = req.body;

        let data: any = rawData;

        if (typeof rawData === 'string') {
            if (rawData.toLowerCase() === 'true') {
                data = true;
            } else if (rawData.toLowerCase() === 'false') {
                data = false;
            }
        }

        if (!mac || !type || address === undefined || modbusFunction === undefined || data === undefined) {
            res.status(400).send({ message: "Missing required Modbus parameters: mac, type, address, function, or data." });
            return;
        }

        const cmdHexValue = CMD_MODBUS_CONTROL[type as keyof typeof CMD_MODBUS_CONTROL];
        if (cmdHexValue === undefined) {
            res.status(400).send({ message: `Invalid Modbus command type: "${type}".` });
            return;
        }
        const cmdHex = cmdHexValue.toString(16).toUpperCase().padStart(2, '0');

        let totalPayloadsBuffer = Buffer.alloc(0);
        let finalModbusUnitId: number | string | null = null;
        let finalIpAddressForTCP: string | undefined = undefined;

        if (type === "CMD_REQUEST_MODBUS_RS485") {
            if (id === null || (typeof id === 'number' && (id < 0 || id > 255 || !Number.isInteger(id))) || (typeof id === 'string' && id.trim() === '')) {
                res.status(400).send({ message: "Slave ID (ID) is required and must be a number 0-255 or a non-empty string for Modbus RTU." });
                return;
            }
            totalPayloadsBuffer = Buffer.concat([
                totalPayloadsBuffer,
                buildPayloadSegment(id, 'uint8')
            ]);
            finalModbusUnitId = id;
        } else if (type === "CMD_REQUEST_MODBUS_TCP") {
            if (!id || !isValidIpAddress(id)) {
                res.status(400).send({ message: "IP address is required and must be valid for Modbus TCP." });
                return;
            }
            totalPayloadsBuffer = Buffer.concat([
                totalPayloadsBuffer,
                buildPayloadSegment(id, 'string')
            ]);
            finalIpAddressForTCP = id;
        } else {
            res.status(400).send({ message: `Unsupported Modbus command type: "${type}".` });
            return;
        }

        totalPayloadsBuffer = Buffer.concat([
            totalPayloadsBuffer,
            buildPayloadSegment(address, 'uint16')
        ]);

        totalPayloadsBuffer = Buffer.concat([
            totalPayloadsBuffer,
            buildPayloadSegment(modbusFunction, 'uint8')
        ]);

        // === ĐÂY LÀ PHẦN SỬA ĐỔI ĐỂ SUY LUẬN KIỂU DỮ LIỆU CHO 'DATA' ===
        let dataPayloadType: keyof typeof PAYLOAD_TYPES;
        if (typeof data === 'number') {
            try {
                dataPayloadType = checkU16(data);
            } catch (error) {
                res.status(400).send({ message: `Data value ${data} is not valid for inferred unsigned integer types: ${error instanceof Error ? error.message : 'Unknown error'}` });
                return;
            }
        } else if (typeof data === 'boolean') {
            dataPayloadType = 'bool'; // Nếu bạn có thể gửi boolean
        } else {
            res.status(400).send({ message: `Unsupported data type for 'data' field: ${typeof data}.` });
            return;
        }

        totalPayloadsBuffer = Buffer.concat([
            totalPayloadsBuffer,
            buildPayloadSegment(data, dataPayloadType) // Sử dụng kiểu dữ liệu đã suy luận
        ]);
        // === KẾT THÚC PHẦN SỬA ĐỔI ===

        const dataForCrcCalculation = Buffer.concat([Buffer.from(cmdHex, 'hex'), totalPayloadsBuffer]);
        const calculatedCrcValue = calculateCRC8(dataForCrcCalculation);
        const crcHex = calculatedCrcValue.toString(16).toUpperCase().padStart(2, '0');

        const hexToSend = `${cmdHex}${totalPayloadsBuffer.toString('hex').toUpperCase()}${crcHex}`;

        console.log(`[Modbus Command] MAC: ${mac}, Type: ${type}, Complete Hex: ${hexToSend}`);

        if (!client || !client.connected) {
            console.error("MQTT client not connected. Cannot publish message.");
            res.status(500).send({ message: "MQTT client not connected. Please try again later." });
            return;
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
                data: data,
                hexCommand: hexToSend,
            }
        });

    } catch (error) {
        console.error("Error in controlModbusCommand:", error);
        if (error instanceof Error) {
            res.status(500).send({ message: `Internal Server Error: ${error.message}` });
        } else {
            res.status(500).send({ message: "Internal Server Error" });
        }
    }
};