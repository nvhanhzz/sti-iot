import { iotsLogger } from "../config/logger/iots.logger";
import { getDataIotCmdGlobal } from "../global/Iot_cmd.global";
import { getPayloadTypeGlobal } from "../global/payload_type.global";
import { ConvertHextoData, ConvertDatatoHex } from "../global/convertData.global";
import { MasterPayloadGlobal, MasterIotCMDGlobal } from "../global";
import {CMDFieldInterface, MasterIotCMDInterface, MasterPayloadInterface} from "../interface";
//
// export const ConvertDataHextoJson = async (buffer: Buffer) => {
//     console.log("convert")
//     try {
//         iotsLogger.info(buffer);
//         if (!Buffer.isBuffer(buffer)) {
//             iotsLogger.info("Input is not a Buffer!");
//             return null;
//         }
//         const IotCmdGlobal = await MasterIotCMDGlobal.getAll();
//         const PayloadType = await MasterPayloadGlobal.getAll();
//         const cmdCode = buffer[0];
//         const cmdIndex = IotCmdGlobal.findIndex((item: any) => item.hex_symbols == String(cmdCode));
//         const cmdPaket = IotCmdGlobal[cmdIndex] || { name: "UNKNOWN_CMD", decriptions: "UNKNOWN_CMD" };
//         const cmdField = IotCmdGlobal[cmdIndex] ? (IotCmdGlobal[cmdIndex].iot_cmd_field ? IotCmdGlobal[cmdIndex].iot_cmd_field : []) : [];
//
//         const payload = [];
//         let crc = null;
//         let index = 1;
//         let dataNumber = 0;
//         while (index < buffer.length - 1) {
//             if ((buffer.length - 1) - index > 1) {
//                 let textdataLength = `${buffer[index].toString(16).toUpperCase().padStart(2, '0')}`;
//                 let dataLength = Number(await ConvertHextoData(textdataLength, 'uint32'));
//                 let sensorType = buffer[index + 1];
//                 let PayloadTypeIndex = PayloadType.findIndex((item: any) => item.hex_symbols == sensorType);
//                 let dataTypeFirst: any = PayloadType[PayloadTypeIndex];
//                 if (dataTypeFirst) {
//                     let dataType = dataTypeFirst.js_type;
//                     let dataPayload = null;
//                     let dataHexPayload = null;
//                     if (dataLength > 0) {
//                         let strData = '';
//                         for (let i = 0; i < dataLength; i++) {
//                             strData += `${buffer[index + 2 + i].toString(16).toUpperCase().padStart(2, '0')}`;
//                         }
//                         dataHexPayload = strData;
//                         let dataAfter = await ConvertHextoData(strData, dataType);
//                         dataPayload = dataAfter;
//                     }
//                     console.log(cmdField, dataNumber);
//
//                     debugger;
//                     payload.push({
//                         [`${cmdField[dataNumber].name}`]: dataPayload,
//                         payload_name: `${cmdField[dataNumber].name}`,
//                         payload_unit: `${cmdField[dataNumber].unit}`
//                     });
//                     dataNumber++;
//                     index += 2 + Number(dataLength);
//                 }
//                 else {
//                     console.log('Không Tìm Được Kiểu Dữ Liệu : ' + sensorType);
//                     index += buffer.length;
//                     return {
//                         status: false,
//                         data: 'Không Tìm Được Kiểu Dữ Liệu : ' + sensorType
//                     }
//                 }
//             }
//             else {
//                 console.log('Sai Form Data Dữ Liệu Gửi Lên');
//                 index += buffer.length;
//                 return {
//                     status: false,
//                     data: 'Sai Form Data Dữ Liệu Gửi Lên'
//                 }
//             }
//         }
//         crc = `${buffer[buffer.length - 1]}`;
//         return {
//             "status": true,
//             "CMD": cmdPaket.name,
//             "CMD_Decriptions": cmdPaket.decriptions,
//             "payload": payload,
//             "crc": crc
//         };
//     } catch (error) {
//         console.log(error);
//         return {
//             status: false,
//             data: error
//         }
//     }
//
// }
// --- Hàm tính CRC8 (giống hệt logic C++) ---
const calculateCRC8 = (data: Buffer): number => {
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

// Kiểu trả về cho hàm giải mã
interface ParsedPacketResult {
    status: boolean;
    CMD?: string;
    CMD_Decriptions?: string;
    payload?: { [key: string]: any; payload_name: string; payload_unit: string; raw_hex: string; }[];
    crc?: string;
    data?: string; // For error messages
}

export const ConvertDataHextoJson = async (buffer: Buffer): Promise<ParsedPacketResult> => {
    try {
        iotsLogger.info(`Received buffer (hex): ${buffer.toString('hex').toUpperCase()}`);
        iotsLogger.info(`Received buffer: ${buffer.toString().toUpperCase()}`)

        if (!Buffer.isBuffer(buffer)) {
            iotsLogger.error("Input is not a Buffer!");
            return { status: false, data: "Input is not a Buffer!" };
        }

        // Kiểm tra độ dài tối thiểu của packet (CMD + CRC = 2 bytes)
        if (buffer.length < 2) {
            iotsLogger.error("Buffer quá ngắn, không đủ dữ liệu cơ bản (cmdCode, CRC)");
            return { status: false, data: "Buffer quá ngắn, không đủ dữ liệu cơ bản!" };
        }

        const cmdCodeByte = buffer[0]; // Byte đầu tiên của gói tin (decimal)
        console.log("Code byte", buffer[0]);
        const receivedCRC = buffer[buffer.length - 1]; // Byte CRC cuối cùng

        // --- Bắt đầu kiểm tra CRC ---
        const dataForCrcCheck = buffer.slice(0, buffer.length - 1); // Lấy tất cả trừ byte CRC cuối cùng
        const calculatedCRC = calculateCRC8(dataForCrcCheck);

        if (calculatedCRC !== receivedCRC) {
            iotsLogger.error(`CRC mismatch! Calculated: 0x${calculatedCRC.toString(16).toUpperCase()}, Received: 0x${receivedCRC.toString(16).toUpperCase()}. Buffer: ${buffer.toString('hex')}`);
            return { status: false, data: `CRC mismatch! Calculated: 0x${calculatedCRC.toString(16).toUpperCase()}, Received: 0x${receivedCRC.toString(16).toUpperCase()}` };
        }
        // --- Kết thúc kiểm tra CRC ---

        // Lấy dữ liệu từ global stores
        const IotCmdGlobal: MasterIotCMDInterface[] = MasterIotCMDGlobal.getAll();
        const PayloadType: MasterPayloadInterface[] = MasterPayloadGlobal.getAll();

        // --- TÌM KIẾM CMD ---
        // So sánh cmdCodeByte (number) với item.hex_symbols (string số thập phân)
        const cmdIndex = IotCmdGlobal.findIndex((item: MasterIotCMDInterface) => {
            if (item.hex_symbols === undefined) return false;
            return parseInt(item.hex_symbols, 10) === cmdCodeByte;
        });

        const cmdPaket: MasterIotCMDInterface = (cmdIndex !== -1) ? IotCmdGlobal[cmdIndex] : { name: "UNKNOWN_CMD", decriptions: "UNKNOWN_CMD", iot_cmd_field: [] };
        const cmdFieldDefs: CMDFieldInterface[] = cmdPaket.iot_cmd_field || []; // Định nghĩa các trường trong payload

        const parsedPayloads: { [key: string]: any; payload_name: string; payload_unit: string; raw_hex: string; }[] = [];
        let currentBufferIndex = 1; // Bắt đầu từ byte thứ hai (sau cmdCode)
        let fieldDefCounter = 0; // Để ánh xạ với cmdFieldDefs

        while (currentBufferIndex < buffer.length - 1) { // Lặp cho đến byte trước CRC cuối cùng
            // Kiểm tra xem còn đủ byte để đọc dataLength (1 byte) và sensorType (1 byte) không
            if ((buffer.length - 1) - currentBufferIndex < 2) {
                iotsLogger.error(`Malformed data: Buffer ends abruptly at index ${currentBufferIndex}. Not enough bytes for dataLength and sensorType.`);
                return { status: false, data: 'Malformed data: Buffer ends abruptly!' };
            }

            const dataLengthByte = buffer[currentBufferIndex];     // Byte độ dài của payload hiện tại
            const sensorTypeByte = buffer[currentBufferIndex + 1]; // Byte kiểu của payload hiện tại

            // --- TÌM KIẾM KIỂU PAYLOAD ---
            // So sánh sensorTypeByte (number) với item.hex_symbols (string "0xXX")
            const payloadTypeDefinition = PayloadType.find((item: MasterPayloadInterface) => {
                if (item.hex_symbols === undefined) return false;
                // Chuyển đổi "0xXX" thành số nguyên thập phân để so sánh
                return parseInt(item.hex_symbols.replace('0x', ''), 16) === sensorTypeByte;
            });

            if (!payloadTypeDefinition) {
                iotsLogger.error(`Undefined payload type (js_type) for sensorType hex: 0x${sensorTypeByte.toString(16).toUpperCase()} at byte ${currentBufferIndex + 1}.`);
                return { status: false, data: `Undefined Payload Type: 0x${sensorTypeByte.toString(16).toUpperCase()}` };
            }

            const dataTypeJsString = payloadTypeDefinition.js_type; // Ví dụ: "int32", "string"

            // Kiểm tra đủ byte cho dữ liệu payload thực tế
            if (currentBufferIndex + 2 + dataLengthByte > buffer.length - 1) {
                iotsLogger.error(`Malformed data: Payload for sensorType 0x${sensorTypeByte.toString(16).toUpperCase()} truncated. Expected length: ${dataLengthByte} bytes, Actual remaining: ${buffer.length - 1 - (currentBufferIndex + 2)} bytes.`);
                return { status: false, data: `Malformed data: Payload truncated for sensorType 0x${sensorTypeByte.toString(16).toUpperCase()}` };
            }

            let parsedData: any = null;
            let rawHexPayload: string = '';

            if (dataLengthByte > 0) {
                const payloadDataBuffer = buffer.slice(currentBufferIndex + 2, currentBufferIndex + 2 + dataLengthByte);
                rawHexPayload = payloadDataBuffer.toString('hex').toUpperCase();

                try {
                    parsedData = ConvertHextoData(rawHexPayload, dataTypeJsString);
                } catch (convertError: any) {
                    iotsLogger.error(`Error converting hex '${rawHexPayload}' to dataType '${dataTypeJsString}' for sensorType 0x${sensorTypeByte.toString(16).toUpperCase()}: ${convertError.message}`);
                    parsedData = null; // Gán null nếu chuyển đổi lỗi
                }
            }

            // Gán tên payload từ cmdFieldDefs hoặc tên mặc định
            const currentFieldDef: CMDFieldInterface | undefined = cmdFieldDefs[fieldDefCounter];
            const payloadName = currentFieldDef ? (currentFieldDef.name || `unknown_field_${fieldDefCounter}`) : `unknown_field_${fieldDefCounter}`;
            const payloadUnit = currentFieldDef ? (currentFieldDef.unit || "unknown") : "unknown";

            parsedPayloads.push({
                [`${payloadName}`]: parsedData,
                payload_name: payloadName,
                payload_unit: payloadUnit,
                raw_hex: rawHexPayload
            });

            fieldDefCounter++; // Tăng bộ đếm cho định nghĩa trường tiếp theo
            currentBufferIndex += 2 + dataLengthByte; // Cập nhật index: +2 (length+type) + dataLength (payload data)
        }

        // Kiểm tra xem có byte nào còn lại sau khi parse tất cả các payload không
        if (currentBufferIndex !== buffer.length - 1) {
            iotsLogger.warn(`Warning: Remaining unparsed bytes in buffer after processing all payloads. Expected end at ${buffer.length - 1}, actual end at ${currentBufferIndex}. Remaining hex: ${buffer.slice(currentBufferIndex, buffer.length - 1).toString('hex').toUpperCase()}`);
        }

        return {
            "status": true,
            "CMD": cmdPaket.name,
            "CMD_Decriptions": cmdPaket.decriptions,
            "payload": parsedPayloads,
            "crc": receivedCRC.toString(16).toUpperCase().padStart(2, '0')
        };

    } catch (error: any) {
        iotsLogger.error(`Error in ConvertDataHextoJson: ${error.message}`, error);
        return { status: false, data: error.message || "An unknown error occurred during conversion." };
    }
};

function hexStringToBuffer(input: string): Buffer {
    const hexArray = input.trim().split(/\s+/);
    const normalizedHexArray = hexArray.map(h => h.length === 1 ? '0' + h : h);
    return Buffer.from(normalizedHexArray.join(''), 'hex');
}

export const ConvertDataJsonToHex = async (data: any) => {
    const IotCmdGlobal = MasterIotCMDGlobal.getAll();
    const PayloadType = MasterPayloadGlobal.getAll();
    const topic = data.topic;
    const mac = data.mac ? data.mac : '+';
    const cmd = data.cmd;
    const payload = data.payload;
    const crc = data.crc;
    const crcBuffer = Buffer.from(crc, 'hex');
    console.log(topic, mac, cmd, payload, crc);
    const cmdFind = IotCmdGlobal.find((e: any) => {
        return e.decriptions == cmd;
    });
    if (cmdFind) {
        const cmdHex = cmdFind.hex_symbols;
        const dataCMDHex = ConvertDatatoHex(cmdHex, 'int32');
        let dataPayload = '';
        for (let p of payload) {
            const payloadType = PayloadType.find((e: any) => {
                return e.js_type == p.payload_type;
            });
            if (payloadType) {
                const payloadTypeHex = payloadType.hex_symbols;
                const data = ConvertDatatoHex(p.data, p.payload_type);
                const dataLength = data.length / 2;
                dataPayload = `${dataPayload} ${dataLength} ${payloadTypeHex} ${data}`;
            }
        }
        const HexData = `${cmdHex} ${dataPayload} ${crc}`;
        const buffer = hexStringToBuffer(HexData);
        return {
            status: true,
            topic: topic,
            mac: mac,
            data: buffer,
            dataString: HexData
        }
    }
    return {
        status: false,
        data: null
    }
}