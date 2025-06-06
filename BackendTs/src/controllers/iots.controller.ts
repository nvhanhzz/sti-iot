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

const CMD_RESPOND_TIMESTAMP = 0x14; // Trong C++ code của bạn, CMD_RESPOND_TIMESTAMP là 0x14 (decimal 20)
const PAYLOAD_I32 = 0x06;           // int32 (Timestamp là số nguyên 32-bit)
const PAYLOAD_STRING = 0x0A;

const CMD_SERIAL = {
    "serial_rs485": 0x11,
    "serial_rs232": 0x12,
    "serial_tcp": 0x13
}

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
    if (message[0] === CMD_RESPOND_TIMESTAMP) { // Kiểm tra nếu lệnh là yêu cầu timestamp (CMD_RESPOND_TIMESTAMP có giá trị 0x14 = 20)
        const mac = (topic.split('/')).length > 1 ? (topic.split('/'))[1] : '';

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

                    // if (hours === '07') {
                    //     console.log("7777");
                    // } else {
                    //     console.log(123);
                    // }

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

export const controlSerialCommand = async (req: Request, res: Response) => {
    try {
        const { mac, type: serialType, command, ipTcpSerial } = req.body;

        if (!mac || !serialType || !command) {
            res.status(400).send({ message: "Missing required parameters: mac, type, or command." });
            return;
        }

        // Nếu là serial_tcp, ipTcpSerial vẫn là bắt buộc
        if (serialType === 'serial_tcp' && !ipTcpSerial) {
            res.status(400).send({ message: "ipTcpSerial is required for serial_tcp type." });
            return;
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