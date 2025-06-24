export interface IotCmdField {
    name: string;
    descriptions: string | null;
    unit?: string | null;
    isDeleted: boolean;
    message_id?: string;
}

export interface Command {
    name: string;
    hex_symbols?: string;
    descriptions: string;
    type?: number | null;
    isDeleted?: boolean;
    iot_cmd_field: IotCmdField[];
}

export const commands: Command[] = [
    {
        "name": "CMD_CONNECT",
        "hex_symbols": "0",
        "descriptions": "Gửi định kỳ để báo kết nối, chứa thời gian và trạng thái kết nối.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian gửi lệnh.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "status",
                "descriptions": "Trạng thái kết nối (ví dụ: 0 cho ngắt kết nối, 1 cho kết nối).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_VERSION",
        "hex_symbols": "1",
        "descriptions": "Phiên bản Firmware hiện tại của thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "version",
                "descriptions": "Chuỗi ký tự thể hiện phiên bản firmware.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_ADC_CHANNEL1",
        "hex_symbols": "2",
        "descriptions": "Gửi giá trị đọc được từ kênh ADC 1 (0 - 10V) kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc giá trị.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "value",
                "descriptions": "Giá trị analog đọc được từ kênh ADC 1.",
                "unit": "V",
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_ADC_CHANNEL2",
        "hex_symbols": "3",
        "descriptions": "Gửi giá trị đọc được từ kênh ADC 2 (4 - 20mA) kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc giá trị.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "value",
                "descriptions": "Giá trị analog đọc được từ kênh ADC 2.",
                "unit": "mA",
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI1_STATUS",
        "hex_symbols": "6",
        "descriptions": "Gửi trạng thái của Digital Input 1 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc trạng thái.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "status",
                "descriptions": "Trạng thái của Digital Input 1 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI2_STATUS",
        "hex_symbols": "7",
        "descriptions": "Gửi trạng thái của Digital Input 2 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc trạng thái.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "status",
                "descriptions": "Trạng thái của Digital Input 2 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI3_STATUS",
        "hex_symbols": "8",
        "descriptions": "Gửi trạng thái của Digital Input 3 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc trạng thái.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "status",
                "descriptions": "Trạng thái của Digital Input 3 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI4_STATUS",
        "hex_symbols": "9",
        "descriptions": "Gửi trạng thái của Digital Input 4 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc trạng thái.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "status",
                "descriptions": "Trạng thái của Digital Input 4 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_OUTPUT_CHANNEL1",
        "hex_symbols": "10",
        "descriptions": "Gửi trạng thái của Output 1 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc trạng thái.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "status",
                "descriptions": "Trạng thái của Output 1 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_OUTPUT_CHANNEL2",
        "hex_symbols": "11",
        "descriptions": "Gửi trạng thái của Output 2 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc trạng thái.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "status",
                "descriptions": "Trạng thái của Output 2 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_OUTPUT_CHANNEL3",
        "hex_symbols": "12",
        "descriptions": "Gửi trạng thái của Output 3 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc trạng thái.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "status",
                "descriptions": "Trạng thái của Output 3 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_OUTPUT_CHANNEL4",
        "hex_symbols": "13",
        "descriptions": "Gửi trạng thái của Output 4 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian đọc trạng thái.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "status",
                "descriptions": "Trạng thái của Output 4 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_MODBUS_RS485",
        "hex_symbols": "14",
        "descriptions": "Gửi dữ liệu Modbus đọc được từ cổng RS485, bao gồm thời gian, ID, địa chỉ, chức năng và dữ liệu.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian dữ liệu được ghi nhận.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị Modbus.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "address",
                "descriptions": "Địa chỉ thanh ghi Modbus.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "function",
                "descriptions": "Mã chức năng Modbus.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu đọc được từ Modbus.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_MODBUS_RS232",
        "hex_symbols": "15",
        "descriptions": "Gửi dữ liệu Modbus đọc được từ cổng RS232, bao gồm thời gian, ID, địa chỉ, chức năng và dữ liệu.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian dữ liệu được ghi nhận.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị Modbus.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "address",
                "descriptions": "Địa chỉ thanh ghi Modbus.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "function",
                "descriptions": "Mã chức năng Modbus.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu đọc được từ Modbus.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_MODBUS_TCP",
        "hex_symbols": "16",
        "descriptions": "Gửi dữ liệu Modbus TCP, bao gồm ID, địa chỉ, chức năng và dữ liệu.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian dữ liệu được ghi nhận.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị Modbus TCP.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "address",
                "descriptions": "Địa chỉ thanh ghi Modbus TCP.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "function",
                "descriptions": "Mã chức năng Modbus TCP.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu đọc được từ Modbus TCP.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_SERIAL_RS485",
        "hex_symbols": "17",
        "descriptions": "Gửi dữ liệu serial đọc được từ cổng RS485 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian dữ liệu được ghi nhận.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu serial đọc được từ RS485.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_SERIAL_RS232",
        "hex_symbols": "18",
        "descriptions": "Gửi dữ liệu serial đọc được từ cổng RS232 kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian dữ liệu được ghi nhận.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu serial đọc được từ RS232.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_SERIAL_TCP",
        "hex_symbols": "19",
        "descriptions": "Gửi dữ liệu serial đọc được từ TCP kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian dữ liệu được ghi nhận.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu serial đọc được từ TCP.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_REQUEST_TIMESTAMP",
        "hex_symbols": "20",
        "descriptions": "Gửi yêu cầu cập nhật thời gian từ server.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "request",
                "descriptions": "Trường yêu cầu timestamp.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_TCP",
        "hex_symbols": "21",
        "descriptions": "Gửi dữ liệu qua kết nối TCP, bao gồm thời gian, địa chỉ IP và dữ liệu.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian dữ liệu được gửi.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "ip",
                "descriptions": "Địa chỉ IP của thiết bị gửi.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu được gửi qua TCP.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_UDP",
        "hex_symbols": "22",
        "descriptions": "Gửi dữ liệu qua kết nối UDP, bao gồm thời gian, địa chỉ IP và dữ liệu.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian dữ liệu được gửi.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "ip",
                "descriptions": "Địa chỉ IP của thiết bị gửi.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu được gửi qua UDP.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI1",
        "hex_symbols": "26",
        "descriptions": "Gửi trạng thái Digital Input 1 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Input 1.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI2",
        "hex_symbols": "27",
        "descriptions": "Gửi trạng thái Digital Input 2 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Input 2.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI3",
        "hex_symbols": "28",
        "descriptions": "Gửi trạng thái Digital Input 3 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Input 3.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI4",
        "hex_symbols": "29",
        "descriptions": "Gửi trạng thái Digital Input 4 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Input 4.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI5",
        "hex_symbols": "30",
        "descriptions": "Gửi trạng thái Digital Input 5 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Input 5.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI6",
        "hex_symbols": "31",
        "descriptions": "Gửi trạng thái Digital Input 6 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Input 6.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI7",
        "hex_symbols": "32",
        "descriptions": "Gửi trạng thái Digital Input 7 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Input 7.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI8",
        "hex_symbols": "33",
        "descriptions": "Gửi trạng thái Digital Input 8 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Input 8.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DO1",
        "hex_symbols": "34",
        "descriptions": "Gửi trạng thái Digital Output 1 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Output 1.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DO2",
        "hex_symbols": "35",
        "descriptions": "Gửi trạng thái Digital Output 2 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Output 2.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DO3",
        "hex_symbols": "36",
        "descriptions": "Gửi trạng thái Digital Output 3 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Output 3.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DO4",
        "hex_symbols": "37",
        "descriptions": "Gửi trạng thái Digital Output 4 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Output 4.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DO5",
        "hex_symbols": "38",
        "descriptions": "Gửi trạng thái Digital Output 5 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Output 5.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DO6",
        "hex_symbols": "39",
        "descriptions": "Gửi trạng thái Digital Output 6 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Output 6.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DO7",
        "hex_symbols": "40",
        "descriptions": "Gửi trạng thái Digital Output 7 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Output 7.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DO8",
        "hex_symbols": "41",
        "descriptions": "Gửi trạng thái Digital Output 8 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) của Digital Output 8.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AI1",
        "hex_symbols": "42",
        "descriptions": "Gửi dữ liệu Analog Input 1 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Input 1.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AI2",
        "hex_symbols": "43",
        "descriptions": "Gửi dữ liệu Analog Input 2 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Input 2.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AI3",
        "hex_symbols": "44",
        "descriptions": "Gửi dữ liệu Analog Input 3 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Input 3.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AI4",
        "hex_symbols": "45",
        "descriptions": "Gửi dữ liệu Analog Input 4 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Input 4.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AI5",
        "hex_symbols": "46",
        "descriptions": "Gửi dữ liệu Analog Input 5 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Input 5.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AI6",
        "hex_symbols": "47",
        "descriptions": "Gửi dữ liệu Analog Input 6 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Input 6.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AI7",
        "hex_symbols": "48",
        "descriptions": "Gửi dữ liệu Analog Input 7 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Input 7.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AI8",
        "hex_symbols": "49",
        "descriptions": "Gửi dữ liệu Analog Input 8 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Input 8.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AO1",
        "hex_symbols": "50",
        "descriptions": "Gửi dữ liệu Analog Output 1 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Output 1.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AO2",
        "hex_symbols": "51",
        "descriptions": "Gửi dữ liệu Analog Output 2 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Output 2.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AO3",
        "hex_symbols": "52",
        "descriptions": "Gửi dữ liệu Analog Output 3 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Output 3.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AO4",
        "hex_symbols": "53",
        "descriptions": "Gửi dữ liệu Analog Output 4 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Output 4.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AO5",
        "hex_symbols": "54",
        "descriptions": "Gửi dữ liệu Analog Output 5 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Output 5.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AO6",
        "hex_symbols": "55",
        "descriptions": "Gửi dữ liệu Analog Output 6 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Output 6.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AO7",
        "hex_symbols": "56",
        "descriptions": "Gửi dữ liệu Analog Output 7 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Output 7.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_AO8",
        "hex_symbols": "57",
        "descriptions": "Gửi dữ liệu Analog Output 8 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu của Analog Output 8.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_RS232",
        "hex_symbols": "58",
        "descriptions": "Gửi dữ liệu từ cổng RS232 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu đọc được từ RS232.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_RS485",
        "hex_symbols": "59",
        "descriptions": "Gửi dữ liệu từ cổng RS485 của thiết bị I/O kèm theo thời gian và ID thiết bị.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận dữ liệu.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu đọc được từ RS485.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_RESET_DEVICE",
        "hex_symbols": "0",
        "descriptions": "Gửi lệnh khởi động lại thiết bị.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "command",
                "descriptions": "Lệnh khởi động lại thiết bị (ví dụ: 'reset').",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_READ_VERSION",
        "hex_symbols": "1",
        "descriptions": "Yêu cầu thiết bị gửi lại thông tin phiên bản firmware hiện tại.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "request",
                "descriptions": "Yêu cầu đọc phiên bản firmware.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_PING",
        "hex_symbols": "2",
        "descriptions": "Gửi một tín hiệu ping để kiểm tra kết nối với thiết bị.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "ping",
                "descriptions": "Giá trị ping để kiểm tra kết nối.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_OUT1",
        "hex_symbols": "3",
        "descriptions": "Ghi giá trị điều khiển cho Output 1.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "value",
                "descriptions": "Giá trị để ghi vào Output 1 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_OUT2",
        "hex_symbols": "4",
        "descriptions": "Ghi giá trị điều khiển cho Output 2.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "value",
                "descriptions": "Giá trị để ghi vào Output 2 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_OUT3",
        "hex_symbols": "5",
        "descriptions": "Ghi giá trị điều khiển cho Output 3.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "value",
                "descriptions": "Giá trị để ghi vào Output 3 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_OUT4",
        "hex_symbols": "6",
        "descriptions": "Ghi giá trị điều khiển cho Output 4.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "value",
                "descriptions": "Giá trị để ghi vào Output 4 (ví dụ: 0 cho OFF, 1 cho ON).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_VERSION_UPDATE",
        "hex_symbols": "7",
        "descriptions": "Gửi lệnh cập nhật phần mềm (firmware) cho thiết bị.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "firmware",
                "descriptions": "Dữ liệu firmware để cập nhật thiết bị.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_REQUEST_MODBUS_RS485",
        "hex_symbols": "8",
        "descriptions": "Gửi yêu cầu đọc/ghi dữ liệu Modbus qua cổng RS485.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị Modbus cần tương tác.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "address",
                "descriptions": "Địa chỉ thanh ghi Modbus cần đọc hoặc ghi.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "function",
                "descriptions": "Mã chức năng Modbus (ví dụ: đọc holding registers, ghi single coil).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu cần ghi (nếu là lệnh ghi).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_REQUEST_MODBUS_RS232",
        "hex_symbols": "9",
        "descriptions": "Gửi yêu cầu đọc/ghi dữ liệu Modbus qua cổng RS232.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị Modbus cần tương tác.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "address",
                "descriptions": "Địa chỉ thanh ghi Modbus cần đọc hoặc ghi.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "function",
                "descriptions": "Mã chức năng Modbus.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu cần ghi (nếu là lệnh ghi).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_REQUEST_MODBUS_TCP",
        "hex_symbols": "16",
        "descriptions": "Gửi yêu cầu đọc/ghi dữ liệu Modbus qua TCP.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị Modbus TCP cần tương tác.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "address",
                "descriptions": "Địa chỉ thanh ghi Modbus TCP cần đọc hoặc ghi.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "function",
                "descriptions": "Mã chức năng Modbus TCP.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu cần ghi (nếu là lệnh ghi).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_REQUEST_SERIAL_RS485",
        "hex_symbols": "17",
        "descriptions": "Gửi dữ liệu qua cổng Serial RS485.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "data",
                "descriptions": "Dữ liệu muốn gửi qua cổng Serial RS485.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_REQUEST_SERIAL_RS232",
        "hex_symbols": "18",
        "descriptions": "Gửi dữ liệu qua cổng Serial RS232.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "data",
                "descriptions": "Dữ liệu muốn gửi qua cổng Serial RS232.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_REQUEST_SERIAL_TCP",
        "hex_symbols": "19",
        "descriptions": "Gửi dữ liệu qua kết nối Serial TCP.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "data",
                "descriptions": "Dữ liệu muốn gửi qua Serial TCP.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_RESPOND_TIMESTAMP",
        "hex_symbols": "20",
        "descriptions": "Gửi phản hồi timestamp từ server xuống client.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Giá trị timestamp phản hồi từ server.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_TCP_SERVER_ON",
        "hex_symbols": "21",
        "descriptions": "Bật chức năng TCP server trên thiết bị.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "status",
                "descriptions": "Trạng thái mong muốn của TCP Server (ví dụ: 1 để bật).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_TCP_SERVER_OFF",
        "hex_symbols": "22",
        "descriptions": "Tắt chức năng TCP server trên thiết bị.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "status",
                "descriptions": "Trạng thái mong muốn của TCP Server (ví dụ: 0 để tắt).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_UDP_SERVER_ON",
        "hex_symbols": "23",
        "descriptions": "Bật chức năng UDP server trên thiết bị.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "status",
                "descriptions": "Trạng thái mong muốn của UDP Server (ví dụ: 1 để bật).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_UDP_SERVER_ON",
        "hex_symbols": "24",
        "descriptions": "Tắt chức năng UDP server trên thiết bị.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "status",
                "descriptions": "Trạng thái mong muốn của UDP Server (ví dụ: 0 để tắt).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_DO1",
        "hex_symbols": "34",
        "descriptions": "Ghi giá trị điều khiển cho Digital Output 1 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) để ghi vào Digital Output 1.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_DO2",
        "hex_symbols": "35",
        "descriptions": "Ghi giá trị điều khiển cho Digital Output 2 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) để ghi vào Digital Output 2.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_DO3",
        "hex_symbols": "36",
        "descriptions": "Ghi giá trị điều khiển cho Digital Output 3 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) để ghi vào Digital Output 3.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_DO4",
        "hex_symbols": "37",
        "descriptions": "Ghi giá trị điều khiển cho Digital Output 4 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) để ghi vào Digital Output 4.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_DO5",
        "hex_symbols": "38",
        "descriptions": "Ghi giá trị điều khiển cho Digital Output 5 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) để ghi vào Digital Output 5.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_DO6",
        "hex_symbols": "39",
        "descriptions": "Ghi giá trị điều khiển cho Digital Output 6 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) để ghi vào Digital Output 6.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_DO7",
        "hex_symbols": "40",
        "descriptions": "Ghi giá trị điều khiển cho Digital Output 7 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) để ghi vào Digital Output 7.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_DO8",
        "hex_symbols": "41",
        "descriptions": "Ghi giá trị điều khiển cho Digital Output 8 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu (trạng thái) để ghi vào Digital Output 8.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_AO1",
        "hex_symbols": "50",
        "descriptions": "Ghi giá trị điều khiển cho Analog Output 1 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu để ghi vào Analog Output 1.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_AO2",
        "hex_symbols": "51",
        "descriptions": "Ghi giá trị điều khiển cho Analog Output 2 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu để ghi vào Analog Output 2.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_AO3",
        "hex_symbols": "52",
        "descriptions": "Ghi giá trị điều khiển cho Analog Output 3 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu để ghi vào Analog Output 3.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_AO4",
        "hex_symbols": "53",
        "descriptions": "Ghi giá trị điều khiển cho Analog Output 4 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu để ghi vào Analog Output 4.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_AO5",
        "hex_symbols": "54",
        "descriptions": "Ghi giá trị điều khiển cho Analog Output 5 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu để ghi vào Analog Output 5.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_AO6",
        "hex_symbols": "55",
        "descriptions": "Ghi giá trị điều khiển cho Analog Output 6 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu để ghi vào Analog Output 6.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_AO7",
        "hex_symbols": "56",
        "descriptions": "Ghi giá trị điều khiển cho Analog Output 7 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu để ghi vào Analog Output 7.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_AO8",
        "hex_symbols": "57",
        "descriptions": "Ghi giá trị điều khiển cho Analog Output 8 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu để ghi vào Analog Output 8.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_RS232",
        "hex_symbols": "58",
        "descriptions": "Ghi dữ liệu qua cổng RS232 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu muốn ghi qua RS232.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_WRITE_IO_RS485",
        "hex_symbols": "59",
        "descriptions": "Ghi dữ liệu qua cổng RS485 của thiết bị I/O.",
        "type": 2,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "id",
                "descriptions": "ID của thiết bị I/O.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu muốn ghi qua RS485.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_NOTIFY_TCP",
        "hex_symbols": "60",
        "descriptions": "Thông báo trạng thái hoạt động của TCP (bật/tắt).",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "tcp_status",
                "descriptions": "Trạng thái hiện tại của TCP (ví dụ: 0 cho tắt, 1 cho bật).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_NOTIFY_UDP",
        "hex_symbols": "61",
        "descriptions": "Thông báo trạng thái hoạt động của UDP (bật/tắt).",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "udp_status",
                "descriptions": "Trạng thái hiện tại của UDP (ví dụ: 0 cho tắt, 1 cho bật).",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "message_id",
                "isDeleted": false,
                "descriptions": "ID của tin nhắn."
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI1_PULSE",
        "hex_symbols": "68",
        "descriptions": "Gửi dữ liệu xung (pulse) từ Digital Input 1 của thiết bị I/O kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận xung.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu xung từ DI1 (ví dụ: số lượng xung).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI2_PULSE",
        "hex_symbols": "69",
        "descriptions": "Gửi dữ liệu xung (pulse) từ Digital Input 2 của thiết bị I/O kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận xung.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu xung từ DI2 (ví dụ: số lượng xung).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI3_PULSE",
        "hex_symbols": "70",
        "descriptions": "Gửi dữ liệu xung (pulse) từ Digital Input 3 của thiết bị I/O kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận xung.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu xung từ DI3 (ví dụ: số lượng xung).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI4_PULSE",
        "hex_symbols": "71",
        "descriptions": "Gửi dữ liệu xung (pulse) từ Digital Input 4 của thiết bị I/O kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian ghi nhận xung.",
                "unit": null,
                "isDeleted": false
            },
            {
                "name": "data",
                "descriptions": "Dữ liệu xung từ DI4 (ví dụ: số lượng xung).",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI1_BUTTON",
        "hex_symbols": "72",
        "descriptions": "Gửi tín hiệu nhấn nút từ Digital Input 1 của thiết bị I/O kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian nút được nhấn.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI2_BUTTON",
        "hex_symbols": "73",
        "descriptions": "Gửi tín hiệu nhấn nút từ Digital Input 2 của thiết bị I/O kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian nút được nhấn.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI3_BUTTON",
        "hex_symbols": "74",
        "descriptions": "Gửi tín hiệu nhấn nút từ Digital Input 3 của thiết bị I/O kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian nút được nhấn.",
                "unit": null,
                "isDeleted": false
            }
        ]
    },
    {
        "name": "CMD_PUSH_IO_DI4_BUTTON",
        "hex_symbols": "75",
        "descriptions": "Gửi tín hiệu nhấn nút từ Digital Input 4 của thiết bị I/O kèm theo thời gian.",
        "type": 1,
        "isDeleted": false,
        "iot_cmd_field": [
            {
                "name": "timestamp",
                "descriptions": "Thời gian nút được nhấn.",
                "unit": null,
                "isDeleted": false
            }
        ]
    }
]