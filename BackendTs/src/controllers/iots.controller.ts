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
import {ConvertDatatoHex} from "../global/convertData.global";
import logger from "../config/logger";
import IotSettings from "../models/sql/iot_settings.models";

const CMD_RESPOND_TIMESTAMP = 0x14; // Trong C++ code của bạn, CMD_RESPOND_TIMESTAMP là 0x14 (decimal 20)
const CMD_NOTIFY_TCP = 0x3C;
const CMD_NOTIFY_UDP = 0x3D;
const PAYLOAD_I32 = 0x06;           // int32 (Timestamp là số nguyên 32-bit)
const PAYLOAD_STRING = 0x0A;

const CMD_SERIAL = {
    "serial_rs485": 0x11,
    "serial_rs232": 0x12,
    "serial_tcp": 0x13
}

const HEX_COMMANDS = {
    tcp: { on: '15 01 00 00 93', off: '16 01 00 00 A9' },
    udp: { on: '17 01 00 00 BF', off: '18 01 00 00 6D' }
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

export const controlSerialCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type: serialType, command, ipTcpSerial } = req.body;

        if (!mac || !serialType || !command) {
            res.status(400).send({ message: "Missing required parameters: mac, type, or command." });
            return;
        }

        // Nếu là serial_tcp, ipTcpSerial vẫn là bắt buộc
        if (serialType === 'serial_tcp') {
            if (!ipTcpSerial) {
                res.status(400).send({ message: "ipTcpSerial is required for serial_tcp type." });
                return;
            }
            // THÊM VALIDATE IP TẠI ĐÂY
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

        // Chuyển đổi command (data) sang buffer và hex
        const commandBuffer = Buffer.from(command, 'utf8');
        const dataHex = commandBuffer.toString('hex').toUpperCase();
        const stringCommandLength = commandBuffer.length;

        let payloadPart = ''; // Phần payload tổng thể (IP + Data hoặc chỉ Data)
        let hexToSend = ''; // Gói hex hoàn chỉnh để gửi

        const cmdHex = cmd.toString(16).toUpperCase().padStart(2, '0');

        if (serialType === 'serial_tcp' && ipTcpSerial) {
            // Xử lý ipTcpSerial là một chuỗi (string)
            const ipBuffer = Buffer.from(ipTcpSerial, 'utf8');
            const ipHex = ipBuffer.toString('hex').toUpperCase();
            const ipLength = ipBuffer.length;

            const ipLengthHex = ipLength.toString(16).toUpperCase().padStart(2, '0');
            const ipTypeHex = PAYLOAD_STRING.toString(16).toUpperCase().padStart(2, '0'); // Kiểu payload cho IP cũng là STRING
            const ipSegment = `${ipLengthHex}${ipTypeHex}${ipHex}`;

            // Xử lý command (data) là một chuỗi (string)
            const stringCommandLengthHex = stringCommandLength.toString(16).toUpperCase().padStart(2, '0');
            const stringCommandTypeHex = PAYLOAD_STRING.toString(16).toUpperCase().padStart(2, '0');
            const stringSegment = `${stringCommandLengthHex}${stringCommandTypeHex}${dataHex}`;

            // Nối segment IP và segment chuỗi data
            payloadPart = `${ipSegment}${stringSegment}`;

        } else {
            // Đối với các loại serial khác, chỉ là segment chuỗi command
            const stringCommandLengthHex = stringCommandLength.toString(16).toUpperCase().padStart(2, '0');
            const stringCommandTypeHex = PAYLOAD_STRING.toString(16).toUpperCase().padStart(2, '0');
            payloadPart = `${stringCommandLengthHex}${stringCommandTypeHex}${dataHex}`;
        }

        // Tính toán CRC dựa trên CMD + tất cả các segment payload
        const dataForCrcCalculation = Buffer.from(`${cmdHex}${payloadPart}`, 'hex');
        // Giả định calculateCRC8 là một hàm đã được định nghĩa ở nơi khác
        const calculatedCrcValue = calculateCRC8(dataForCrcCalculation);
        const crcHex = calculatedCrcValue.toString(16).toUpperCase().padStart(2, '0');

        // Gói hex hoàn chỉnh
        hexToSend = `${cmdHex}${payloadPart}${crcHex}`;

        console.log(`[Serial Command] Type: ${serialType}, CMD: ${cmdHex}, Data: ${dataHex}, IP (as String): ${ipTcpSerial || 'N/A'}, Complete Packet: ${hexToSend}`);

        // Kiểm tra kết nối MQTT và gửi tin nhắn
        if (!client || !client.connected) {
            console.error("MQTT client not connected. Cannot publish message.");
            res.status(500).send({ message: "MQTT client not connected. Please try again later." });
            return;
        }
        // Giả định publishMessage và client đã được định nghĩa
        publishMessage(client, `device/response/${mac}`, hexToSend);

        res.status(200).send({
            message: "Serial command sent successfully",
            data: {
                serialType: serialType,
                originalCommand: command,
                ipTcpSerial: ipTcpSerial || null,
                hexCommand: hexToSend,
                breakdown: {
                    cmd: cmdHex,
                    // Cập nhật breakdown để phản ánh IP là dạng string payload
                    ipDataSegment: serialType === 'serial_tcp' && ipTcpSerial
                        ? `${Buffer.from(ipTcpSerial, 'utf8').length.toString(16).toUpperCase().padStart(2, '0')}${PAYLOAD_STRING.toString(16).toUpperCase().padStart(2, '0')}${Buffer.from(ipTcpSerial, 'utf8').toString('hex').toUpperCase()}`
                        : 'N/A',
                    stringDataSegment: `${stringCommandLength.toString(16).toUpperCase().padStart(2, '0')}${PAYLOAD_STRING.toString(16).toUpperCase().padStart(2, '0')}${dataHex}`,
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