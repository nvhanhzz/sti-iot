import { iotsLogger } from "../config/logger/iots.logger";
import { getDataIotCmdGlobal } from "../global/Iot_cmd.global";
import { getPayloadTypeGlobal } from "../global/payload_type.global";
import { ConvertHextoData, ConvertDatatoHex } from "../global/convertData.global";
import { MasterPayloadGlobal, MasterIotCMDGlobal } from "../global";
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

export const ConvertDataHextoJson = async (buffer: Buffer) => {
    try {
        iotsLogger.info(buffer);
        if (!Buffer.isBuffer(buffer)) {
            iotsLogger.info("Input is not a Buffer!");
            return null;
        }
        const IotCmdGlobal = MasterIotCMDGlobal.getAll();
        const PayloadType = MasterPayloadGlobal.getAll();
        const cmdCode = buffer[0];
        const cmdIndex = IotCmdGlobal.findIndex((item: any) => item.hex_symbols == String(cmdCode));
        const cmdPaket = IotCmdGlobal[cmdIndex] || { name: "UNKNOWN_CMD", decriptions: "UNKNOWN_CMD" };
        const cmdField = IotCmdGlobal[cmdIndex] ? (IotCmdGlobal[cmdIndex].iot_cmd_field ? IotCmdGlobal[cmdIndex].iot_cmd_field : []) : [];

        const payload = [];
        let crc = null;
        let index = 1;
        let dataNumber = 0;

        while (index < buffer.length - 1) {
            if ((buffer.length - 1) - index > 1) {
                let textdataLength = `${buffer[index].toString(16).toUpperCase().padStart(2, '0')}`;
                let dataLength = Number(ConvertHextoData(textdataLength, 'uint32'));
                let sensorType = buffer[index + 1];
                let PayloadTypeIndex = PayloadType.findIndex((item: any) => item.hex_symbols == sensorType);
                let dataTypeFirst: any = PayloadType[PayloadTypeIndex];

                if (dataTypeFirst) {
                    let dataType = dataTypeFirst.js_type;
                    let dataPayload = null;
                    let dataHexPayload = null;

                    if (dataLength > 0) {
                        let strData = '';
                        for (let i = 0; i < dataLength; i++) {
                            strData += `${buffer[index + 2 + i].toString(16).toUpperCase().padStart(2, '0')}`;
                        }
                        dataHexPayload = strData;
                        let dataAfter = ConvertHextoData(strData, dataType);
                        dataPayload = dataAfter;
                    }

                    // FIX: Kiểm tra xem cmdField[dataNumber] có tồn tại không
                    if (cmdField && cmdField.length > dataNumber && cmdField[dataNumber]) {
                        payload.push({
                            [`${cmdField[dataNumber].name}`]: dataPayload,
                            payload_name: `${cmdField[dataNumber].name}`,
                            payload_unit: `${cmdField[dataNumber].unit}`
                        });
                    } else {
                        // Trường hợp không tìm thấy field definition, sử dụng tên mặc định
                        console.warn(`Không tìm thấy field definition cho dataNumber: ${dataNumber}`);
                        payload.push({
                            [`unknown_field_${dataNumber}`]: dataPayload,
                            payload_name: `unknown_field_${dataNumber}`,
                            payload_unit: "unknown"
                        });
                    }

                    dataNumber++;
                    index += 2 + Number(dataLength);
                }
                else {
                    console.log('Không Tìm Được Kiểu Dữ Liệu : ' + sensorType);
                    index += buffer.length;
                    return {
                        status: false,
                        data: 'Không Tìm Được Kiểu Dữ Liệu : ' + sensorType
                    }
                }
            }
            else {
                console.log('Sai Form Data Dữ Liệu Gửi Lên');
                index += buffer.length;
                return {
                    status: false,
                    data: 'Sai Form Data Dữ Liệu Gửi Lên'
                }
            }
        }

        crc = `${buffer[buffer.length - 1]}`;
        return {
            "status": true,
            "CMD": cmdPaket.name,
            "CMD_Decriptions": cmdPaket.decriptions,
            "payload": payload,
            "crc": crc
        };
    } catch (error) {
        console.log(error);
        return {
            status: false,
            data: error
        }
    }
}

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