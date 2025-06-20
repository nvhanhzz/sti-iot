// controllers/iots.controller.ts

import {Request, Response} from "express";
import {AlgorithmGetIot, AlgorithmLockIot, UpdateDataIotsDetail} from "../algorithms/iots.algorithms";
import {ConvertDataHextoJson, ConvertDataJsonToHex} from "../algorithms/data.algorithms";
import {EmitData} from "../sockets/emit";
import {DistinctDataIot} from "../services/iot.services";
import {DataMsgGlobal, MasterIotGlobal} from "../global";
import publishMessage, {publishJson} from "../mqtt/publish";
import client from "../mqtt";
import moment from "moment";
import {MasterIotInterface} from "../interface";
import {ConvertDatatoHex} from "../global/convertData.global";
import logger from "../config/logger";
import models from "../models/sql";
import {Buffer} from 'buffer';
import IotStatistic, {IIotStatistic} from "../models/nosql/iot_statistic.models";
import {getCmdStatistics, incrementCmdStat} from "../services/iot_statistics.services";
import {pendingDeviceRequests} from "../mqtt/subcribe";
import { v4 as uuidv4 } from 'uuid';
import mongoose, { Types } from 'mongoose';

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

export const getStatisticsById = (req: Request, res: Response) => {
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

interface GetStatisticsQuery {
    page?: string;
    limit?: string;
    lastTimestamp?: string;
    lastId?: string;
    firstTimestamp?: string;
    firstId?: string;
    direction?: 'next' | 'prev' | 'jump';
    deviceId?: string;
    cmd?: string;
    startTime?: string;
    endTime?: string;
    sortBy?: 'timestamp' | 'id';
    sortOrder?: 'asc' | 'desc';
}

interface ExtendedIotStatistic extends IIotStatistic {
    deviceName?: string;
    mac?: string;
}

export const getStatistics = async (req: Request<{}, {}, {}, GetStatisticsQuery>, res: Response) => {
    try {
        const {
            page = '1',
            limit = '10',
            lastTimestamp,
            lastId,
            firstTimestamp,
            firstId,
            direction = 'next',
            deviceId,
            cmd,
            startTime,
            endTime,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = req.query;

        const pageNumber = parseInt(page as string);
        const limitNumber = parseInt(limit as string);

        if (isNaN(pageNumber) || pageNumber < 1) {
            res.status(400).send({ message: "Invalid 'page' parameter. Must be a positive number." });
            return;
        }
        if (isNaN(limitNumber) || limitNumber < 1) {
            res.status(400).send({ message: "Invalid 'limit' parameter. Must be a positive number." });
            return;
        }

        // --- Bổ sung: Lấy tất cả thông tin thiết bị và tạo mapping ---
        const allIots = MasterIotGlobal.getAll(); // Giả định hàm này trả về mảng các thiết bị
        // Tạo một Map để tra cứu deviceName và mac nhanh chóng bằng deviceId
        const deviceMap = new Map<number, { deviceName: string; mac: string }>();
        if (allIots && Array.isArray(allIots)) {
            allIots.forEach((device: any) => { // Giả định mỗi device có thuộc tính 'device_id', 'name', 'mac'
                if (device.id) {
                    deviceMap.set(device.id, {
                        deviceName: device.name || 'Unknown Device',
                        mac: device.mac || 'Unknown MAC'
                    });
                }
            });
        }
        // --- Kết thúc phần bổ sung ---

        let findQuery: any = {};
        let sortCriteria: any = {};

        if (deviceId) {
            findQuery.deviceId = deviceId;
        }
        if (cmd) {
            findQuery.cmd = cmd;
        }
        if (startTime || endTime) {
            findQuery.timestamp = {};
            if (startTime) {
                const parsedStartTime = parseInt(startTime as string);
                if (isNaN(parsedStartTime)) {
                    res.status(400).send({ message: "Invalid 'startTime' parameter." });
                    return;
                }
                findQuery.timestamp.$gte = parsedStartTime;
            }
            if (endTime) {
                const parsedEndTime = parseInt(endTime as string);
                if (isNaN(parsedEndTime)) {
                    res.status(400).send({message: "Invalid 'endTime' parameter."});
                    return;
                }
                findQuery.timestamp.$lte = parsedEndTime;
            }
        }

        const effectiveSortOrder = sortOrder === 'desc' ? -1 : 1;
        if (sortBy === 'timestamp') {
            sortCriteria = { timestamp: effectiveSortOrder, _id: effectiveSortOrder };
        } else if (sortBy === 'id') {
            sortCriteria = { _id: effectiveSortOrder, timestamp: effectiveSortOrder };
        } else {
            sortCriteria = { timestamp: -1, _id: -1 };
        }

        let totalRecords: number | undefined;
        let statistics: ExtendedIotStatistic[] = []; // Thay đổi kiểu dữ liệu sang ExtendedIotStatistic
        let hasNextPage: boolean = false;
        let hasPreviousPage: boolean = false;
        let nextCursor: { lastTimestamp: number; lastId: string } | null = null;
        let previousCursor: { firstTimestamp: number; firstId: string } | null = null;

        if (direction === 'jump') {
            logger.warn(`Using 'jump' direction (offset pagination) for potentially large dataset. This can be slow if 'page' is high and filters are broad.`);

            const skipAmount = (pageNumber - 1) * limitNumber;

            totalRecords = await IotStatistic.countDocuments(findQuery);

            const rawStatistics = await IotStatistic.find(findQuery)
                .sort(sortCriteria)
                .skip(skipAmount)
                .limit(limitNumber)
                .lean();

            // --- Bổ sung: Ánh xạ deviceName và mac vào rawStatistics ---
            statistics = rawStatistics.map(stat => {
                const device = deviceMap.get(parseInt(stat.deviceId));
                return {
                    ...stat,
                    deviceName: device?.deviceName,
                    mac: device?.mac
                };
            });
            // --- Kết thúc phần bổ sung ---

            hasNextPage = (skipAmount + statistics.length) < totalRecords;
            hasPreviousPage = pageNumber > 1;

        } else { // Keyset Pagination
            let queryBuilder = IotStatistic.find(findQuery);

            if (direction === 'next' && lastTimestamp && lastId) {
                const parsedLastTimestamp = parseInt(lastTimestamp as string);
                const parsedLastId = mongoose.Types.ObjectId.isValid(lastId) ? new mongoose.Types.ObjectId(lastId) : lastId;

                if (isNaN(parsedLastTimestamp)) {
                    res.status(400).send({message: "Invalid 'lastTimestamp' for keyset 'next'."});
                    return;
                }

                if (effectiveSortOrder === -1) {
                    queryBuilder = queryBuilder.where({
                        $or: [
                            { timestamp: { $lt: parsedLastTimestamp } },
                            { timestamp: parsedLastTimestamp, _id: { $lt: parsedLastId } }
                        ]
                    });
                } else {
                    queryBuilder = queryBuilder.where({
                        $or: [
                            { timestamp: { $gt: parsedLastTimestamp } },
                            { timestamp: parsedLastTimestamp, _id: { $gt: parsedLastId } }
                        ]
                    });
                }

            } else if (direction === 'prev' && firstTimestamp && firstId) {
                const parsedFirstTimestamp = parseInt(firstTimestamp as string);
                const parsedFirstId = mongoose.Types.ObjectId.isValid(firstId) ? new mongoose.Types.ObjectId(firstId) : firstId;

                if (isNaN(parsedFirstTimestamp)) {
                    res.status(400).send({message: "Invalid 'firstTimestamp' for keyset 'prev'."});
                    return;
                }

                const reverseSortCriteria: any = {};
                for (const key in sortCriteria) {
                    reverseSortCriteria[key] = sortCriteria[key] * -1;
                }

                const rawStatistics = await queryBuilder
                    .sort(reverseSortCriteria)
                    .limit(limitNumber + 1)
                    .lean();

                // --- Bổ sung: Ánh xạ deviceName và mac vào rawStatistics của 'prev' ---
                const mappedRawStatistics = rawStatistics.map(stat => {
                    const device = deviceMap.get(parseInt(stat.deviceId));
                    return {
                        ...stat,
                        deviceName: device?.deviceName,
                        mac: device?.mac
                    };
                });
                statistics = mappedRawStatistics.reverse();
                // --- Kết thúc phần bổ sung ---

                if (rawStatistics.length > limitNumber) {
                    hasPreviousPage = true;
                }
            }

            if (direction !== 'prev' || (!firstTimestamp && !firstId)) {
                const rawStatistics = await queryBuilder
                    .sort(sortCriteria)
                    .limit(limitNumber + 1)
                    .lean();

                // --- Bổ sung: Ánh xạ deviceName và mac vào rawStatistics của 'next' (bao gồm cả trang đầu) ---
                let mappedRawStatistics = rawStatistics.map(stat => {
                    const device = deviceMap.get(parseInt(stat.deviceId));
                    return {
                        ...stat,
                        deviceName: device?.deviceName,
                        mac: device?.mac
                    };
                });
                // --- Kết thúc phần bổ sung ---

                if (mappedRawStatistics.length > limitNumber) {
                    hasNextPage = true;
                    mappedRawStatistics.pop();
                }
                statistics = mappedRawStatistics; // Gán kết quả đã ánh xạ
            }
        }

        if (statistics.length > 0) {
            const firstDoc = statistics[0];
            const lastDoc = statistics[statistics.length - 1];

            nextCursor = {
                lastTimestamp: lastDoc.timestamp,
                lastId: (lastDoc._id as Types.ObjectId).toString()
            };
            previousCursor = {
                firstTimestamp: firstDoc.timestamp,
                firstId: (firstDoc._id as Types.ObjectId).toString()
            };

            hasPreviousPage = !!(firstTimestamp && firstId);
        }

        res.status(200).send({
            data: statistics,
            pagination: {
                method: direction === 'jump' ? 'offset' : 'keyset',
                totalRecords: totalRecords,
                currentPage: direction === 'jump' ? pageNumber : undefined,
                pageSize: limitNumber,
                hasNextPage: hasNextPage,
                hasPreviousPage: hasPreviousPage,
                nextCursor: nextCursor,
                previousCursor: previousCursor,
                sortBy: sortBy,
                sortOrder: sortOrder
            }
        });

    } catch (error) {
        logger.error("Error in getStatistics:", error);
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
            mergedPayloads.deviceName = dataIot.name || 'Unknow device';
            mergedPayloads.mac = dataIot.mac || 'Unknow MAC';
            await sendToMonitor(mergedPayloads);

            if (message[0] === CMD_NOTIFY_TCP || message[0] === CMD_NOTIFY_UDP) {
                const iotDevice = await models.IotSettings.findOne({
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

export const sendToMonitor = async (data: any) => {
    await EmitData("server_emit_monitor", data);
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
                        const iotDevice = await models.IotSettings.findOne({
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

        const iotDevice = await models.IotSettings.findOne({
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

// --- NEW CONTROLLERS FOR SECTION-SPECIFIC UPDATES ---

// Helper function for common update logic

interface DeviceConfigPayload {
    transactionId: string;
    [key: string]: any; // Cho phép thêm các thuộc tính động như 'wifi', 'ethernet', 'can', ...
}

export async function updateIotSection(
    req: Request,
    res: Response,
    sectionName: string // Ví dụ: 'wifi', 'ethernet', 'mqtt', 'rs485', 'rs232', 'tcp', 'can'
) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: `ID là bắt buộc để cập nhật ${sectionName}.` });
            return;
        }

        const iot = await models.IotSettings.findByPk(id);
        if (!iot) {
            res.status(404).json({ message: "Thiết bị IoT không tìm thấy." });
            return;
        }

        const deviceMAC = iot.mac;
        const requestBody = req.body; // Dữ liệu từ FE: { section_config: { ... } } hoặc { name: "..." } cho basic

        // Vẫn giữ kiểm tra này nếu requestBody hoàn toàn rỗng từ FE
        if (Object.keys(requestBody).length === 0) {
            res.status(400).json({ message: "Không có dữ liệu để cập nhật." });
            return;
        }

        let finalUpdatedIotRecord: any; // Biến để lưu trữ bản ghi IoT sau khi cập nhật DB

        if (sectionName === 'basic') {
            // Trường hợp 'basic': Cập nhật database trực tiếp và phản hồi ngay
            console.log(`[${sectionName}] Cập nhật trực tiếp database cho thiết bị ${deviceMAC}.`);
            // Lọc bỏ các giá trị null/undefined/empty string cho basic info
            const filteredBasicInfo: { [key: string]: any } = {};
            for (const key in requestBody) {
                if (requestBody.hasOwnProperty(key)) {
                    const value = requestBody[key];
                    if (value !== null && typeof value !== 'undefined' && value !== '') { // Thêm điều kiện value !== ''
                        filteredBasicInfo[key] = value;
                    }
                }
            }

            // Nếu sau khi lọc basic info không còn gì, vẫn coi là không có dữ liệu để cập nhật
            if (Object.keys(filteredBasicInfo).length === 0) {
                res.status(400).json({ message: "Không có dữ liệu hợp lệ (không null/undefined/empty) để cập nhật thông tin cơ bản." });
                return;
            }

            const updatedIot = await iot.update(filteredBasicInfo); // Cập nhật với dữ liệu đã lọc
            MasterIotGlobal.replaceById(updatedIot);

            finalUpdatedIotRecord = updatedIot;
            res.status(200).json({
                message: `Thông tin cơ bản đã cập nhật thành công (không qua MQTT).`,
                data: finalUpdatedIotRecord,
            });

        } else { // Xử lý tất cả các cấu hình khác (wifi, ethernet, mqtt, rs485, rs232, tcp, CAN, digitalInput) qua MQTT
            const configTopic = `device/config/${deviceMAC}`;
            const transactionId = uuidv4();

            const configPromise = new Promise(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    pendingDeviceRequests.delete(transactionId);
                    console.error(`[${sectionName}] Cấu hình thiết bị ${deviceMAC} hết thời gian chờ (ID: ${transactionId}).`);
                    reject(new Error(`Thiết bị ${deviceMAC} không phản hồi trong thời gian quy định.`));
                }, 10000);

                pendingDeviceRequests.set(transactionId, {
                    resolve,
                    reject,
                    timeout,
                    deviceMAC,
                    updateData: requestBody, // updateData vẫn giữ nguyên requestBody đầy đủ để cập nhật DB sau
                    sectionName,
                });

                const rawConfigDataToSend = requestBody[`${sectionName}Config`];

                // Bắt đầu phần lọc:
                // Nếu rawConfigDataToSend không phải là một đối tượng, hoặc là null/undefined,
                // ta sẽ coi như không có cấu hình cụ thể nào được gửi cho section này.
                // Trong trường hợp này, filteredConfigData sẽ là một đối tượng rỗng.
                let filteredConfigData: { [key: string]: any } = {};

                if (rawConfigDataToSend && typeof rawConfigDataToSend === 'object' && !Array.isArray(rawConfigDataToSend)) {
                    for (const key in rawConfigDataToSend) {
                        if (rawConfigDataToSend.hasOwnProperty(key)) {
                            const value = rawConfigDataToSend[key];
                            // Lọc bỏ null, undefined, mảng rỗng, chuỗi rỗng
                            if (value !== null && typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0) && value !== '') {
                                filteredConfigData[key] = value;
                            }
                        }
                    }
                } else if (Array.isArray(rawConfigDataToSend)) {
                    // Xử lý đặc biệt cho các trường hợp là mảng (ví dụ: tcpConfig.ipAddresses, rs485Config.idAddresses)
                    // Nếu là một mảng rỗng, nó sẽ bị lọc bỏ.
                    // Nếu là mảng có phần tử, hãy chắc chắn các phần tử được giữ lại.
                    // Phần này cần được xử lý cẩn thận tùy thuộc vào cấu trúc mảng cụ thể.
                    // Với ví dụ hiện tại, nếu mảng là rỗng nó đã bị lọc. Nếu không rỗng thì giữ nguyên.
                    if (rawConfigDataToSend.length > 0) {
                        filteredConfigData = rawConfigDataToSend; // Giữ lại mảng nếu có dữ liệu
                    }
                }
                // Nếu rawConfigDataToSend là một kiểu dữ liệu nguyên thủy (ví dụ: chỉ một số baudrate cho CAN)
                // và không được bọc trong object, thì logic này cần được điều chỉnh.
                // Hiện tại, giả định rằng mọi cấu hình (kể cả CAN) đều được bọc trong một object.

                // KHÔNG REJECT NẾU filteredConfigData RỖNG!
                // Vẫn tiếp tục tạo payload và gửi qua MQTT với cấu hình rỗng nếu không có gì để gửi.
                // Điều này cho phép thiết bị "reset" một phần cấu hình nếu cần.

                const payload: DeviceConfigPayload = {
                    transactionId: transactionId
                };
                // Đặt dữ liệu đã lọc vào trường sectionName trong payload
                // Nếu filteredConfigData là mảng, nó sẽ được gán trực tiếp.
                // Nếu là object, nó sẽ được gán.
                payload[sectionName] = filteredConfigData;

                const publishSuccess = publishJson(client, configTopic, payload);

                if (!publishSuccess) {
                    console.error(`Lỗi khi gửi cấu hình MQTT đến ${deviceMAC} bằng publishJson.`);
                    clearTimeout(timeout);
                    pendingDeviceRequests.delete(transactionId);
                    reject(new Error(`Không thể gửi lệnh cấu hình qua MQTT: Lỗi nội bộ khi publish JSON.`));
                } else {
                    console.log(`[${sectionName}] Đã gửi lệnh cấu hình đến ${deviceMAC} với transaction ID: ${transactionId}. Payload:`, JSON.stringify(payload));
                }
            });

            await configPromise; // Chờ thiết bị phản hồi
            console.log(`[${sectionName}] Thiết bị ${deviceMAC} đã xác nhận cấu hình. Cập nhật database.`);

            // Cập nhật database sau khi thiết bị xác nhận
            // Sử dụng requestBody gốc từ FE để cập nhật database
            // Lý do: Nếu FE gửi { wifiConfig: { ssid: "mywifi", pw: "" } }
            // Filtered payload MQTT sẽ chỉ là { wifi: { ssid: "mywifi" } }
            // Nhưng DB cần lưu cả { ssid: "mywifi", pw: "" } để phản ánh trạng thái chính xác.
            // Hoặc nếu bạn muốn DB chỉ lưu các giá trị không rỗng, bạn cần áp dụng lại logic lọc cho DB.
            // Giả định bạn muốn DB lưu những gì FE đã gửi, bao gồm cả rỗng/null,
            // chỉ MQTT payload là được lọc.
            // Nếu muốn DB cũng lọc theo logic tương tự MQTT, hãy áp dụng filteredConfigData cho DB.

            // Để phù hợp với việc bạn muốn "bỏ" các giá trị undefined/null/empty/[] khỏi DB,
            // chúng ta cần áp dụng lại logic lọc cho `requestBody` trước khi cập nhật DB.
            let updatedIotDataForDb: { [key: string]: any } = {};

            // Lấy ra phần cấu hình liên quan (ví dụ: wifiConfig) từ requestBody
            const configForDb = requestBody[`${sectionName}Config`];
            if (configForDb && typeof configForDb === 'object' && !Array.isArray(configForDb)) {
                // Lọc các giá trị cho phần config của DB
                const filteredConfigForDb: { [key: string]: any } = {};
                for (const key in configForDb) {
                    if (configForDb.hasOwnProperty(key)) {
                        const value = configForDb[key];
                        // Lọc bỏ null, undefined, mảng rỗng, chuỗi rỗng
                        if (value !== null && typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0) && value !== '') {
                            filteredConfigForDb[key] = value;
                        }
                    }
                }
                updatedIotDataForDb[`${sectionName}Config`] = filteredConfigForDb;
            } else if (Array.isArray(configForDb) && configForDb.length > 0) {
                // Nếu là mảng có dữ liệu, giữ nguyên cho DB
                updatedIotDataForDb[`${sectionName}Config`] = configForDb;
            } else if (Array.isArray(configForDb) && configForDb.length === 0) {
                // Nếu là mảng rỗng, bạn muốn nó được "bỏ" khỏi DB, có nghĩa là set nó thành null hoặc undefined
                // Tùy thuộc vào cách Sequelize/Mongoose xử lý việc này.
                // Với Sequelize, nếu bạn gửi { field: null }, nó sẽ lưu null.
                // Để "bỏ", có thể không gửi trường đó, hoặc gửi { field: undefined }.
                // Trong trường hợp này, nếu `filteredConfigForDb` là rỗng (sau khi lọc),
                // nó sẽ được gán `{}` cho trường config, điều này có thể mong muốn.
                // Nếu muốn hoàn toàn xóa trường đó khỏi bản ghi DB nếu nó rỗng, cần logic phức tạp hơn.
                // Hiện tại, `{}` là hành vi phổ biến.
                updatedIotDataForDb[`${sectionName}Config`] = {}; // Lưu rỗng object nếu tất cả bị lọc
            }

            const updatedIot = await iot.update(updatedIotDataForDb); // Cập nhật DB với dữ liệu đã lọc
            MasterIotGlobal.replaceById(updatedIot);

            finalUpdatedIotRecord = updatedIot;
            res.status(200).json({
                message: `${sectionName} đã cập nhật thành công sau xác nhận từ thiết bị.`,
                data: finalUpdatedIotRecord,
            });
        }

    } catch (error: any) {
        console.error(`Lỗi khi cập nhật ${sectionName}:`, error);
        let statusCode = 500;
        let errorMessage: string;

        if (error.message.includes('không phản hồi')) {
            statusCode = 504; // Gateway Timeout
            errorMessage = error.message;
        } else if (error.message.includes('Không thể gửi lệnh')) {
            statusCode = 502; // Bad Gateway
            errorMessage = error.message;
        } else if (error.message.includes('Không có dữ liệu')) {
            statusCode = 400; // Bad Request
            errorMessage = error.message;
        } else {
            errorMessage = `Có lỗi xảy ra khi cập nhật ${sectionName}: ` + error.message;
        }

        res.status(statusCode).json({
            message: errorMessage,
            error: error.message,
        });
    }
}

// 1. Thông tin cơ bản (name, mac)
export const updateBasicInfo = async (req: Request, res: Response) => {
    // FE gửi { name: "New Name", mac: "AA:BB:CC..." }
    await updateIotSection(req, res, "basic");
};

// 2. Cài đặt WiFi
export const updateWifiSettings = async (req: Request, res: Response) => {
    // FE gửi { wifi_config: { SSID: "MyWifi", PW: "password", ... } }
    await updateIotSection(req, res, "wifi");
};

// 3. Cài đặt Ethernet
export const updateEthernetSettings = async (req: Request, res: Response) => {
    // FE gửi { ethernet_config: { IP: "...", GATEWAY: "...", ... } }
    await updateIotSection(req, res, "ethernet");
};

// 4. Cài đặt MQTT
export const updateMqttSettings = async (req: Request, res: Response) => {
    // FE gửi { mqtt_config: { SERVER: "...", PORT: ..., ... } }
    await updateIotSection(req, res, "mqtt");
};

// 5. Cài đặt RS485
export const updateRs485Settings = async (req: Request, res: Response) => {
    // FE gửi { rs485_config: { baudrate: ..., serialConfig: ..., idAddresses: [...] } }
    await updateIotSection(req, res, "rs485");
};

// 6. Cài đặt TCP
export const updateTcpSettings = async (req: Request, res: Response) => {
    // FE gửi { tcp_config: { ips: [...] } }
    await updateIotSection(req, res, "tcp");
};

// 7. Cài đặt RS232
export const updateRs232Settings = async (req: Request, res: Response) => {
    // FE gửi { rs232_config: { baudrate: ..., serialConfig: "..." } }
    await updateIotSection(req, res, "rs232");
};

// 8. Cài đặt CAN
export const updateCanSettings = async (req: Request, res: Response) => {
    // FE cần gửi { can_config: { baudrate: ... } } để khớp với logic mới
    await updateIotSection(req, res, "can");
};

// 9. Cài đặt CAN
export const updateInputSettings = async (req: Request, res: Response) => {
    await updateIotSection(req, res, "digitalInput");
};

// 10. Phiên bản Firmware
export const updateFirmwareVersion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: `ID là bắt buộc để cập nhật Phiên bản Firmware.` });
            return;
        }

        const iot = await models.IotSettings.findByPk(id);
        if (!iot) {
            res.status(404).json({ message: "Thiết bị IoT không tìm thấy." });
            return;
        }

        const { version } = req.body; // Lấy version string hoặc number từ FE
        let firmwareVersionToUpdate: number | null = null;

        if (typeof version === 'number') {
            firmwareVersionToUpdate = version;
        } else if (typeof version === 'string') {
            const parsedId = parseInt(version);
            if (!isNaN(parsedId)) {
                firmwareVersionToUpdate = parsedId;
            } else {
                res.status(400).json({ message: "Phiên bản firmware gửi từ FE không hợp lệ. Vui lòng gửi ID số." });
                return;
            }
        } else {
            res.status(400).json({ message: "Định dạng phiên bản firmware không hợp lệ." });
            return;
        }

        await iot.update({ firmware_version_id: firmwareVersionToUpdate });

        res.status(200).json({
            message: `Phiên bản Firmware đã cập nhật thành công.`,
            data: iot, // Trả về bản ghi đã cập nhật
        });
    } catch (error: any) {
        console.error(`Lỗi khi cập nhật Phiên bản Firmware:`, error);
        res.status(500).json({
            message: `Có lỗi xảy ra khi cập nhật Phiên bản Firmware.`,
            error: error.message,
        });
    }
};