export interface PayloadType {
  id: number;
  name: string;
  hex_symbols: string;
  descriptions: string;
  js_type: string;
  note: string | null;
  user_created: string | null;
  time_created: string | null;
  user_updated: string | null;
  time_updated: string | null;
  isDeleted: boolean;
}

export const payloadTypes: PayloadType[] = [
  {
    "id": 1,
    "name": "PAYLOAD_U8_T",
    "hex_symbols": "0x01",
    "descriptions": "8-bit unsigned (uint8_t)",
    "js_type": "uint8",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": "2025-04-09T06:25:27.000Z",
    "isDeleted": false
  },
  {
    "id": 2,
    "name": "PAYLOAD_U16_T",
    "hex_symbols": "0x02",
    "descriptions": "16-bit unsigned (uint16_t)",
    "js_type": "uint16",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": null,
    "isDeleted": false
  },
  {
    "id": 3,
    "name": "PAYLOAD_U32_T",
    "hex_symbols": "0x03",
    "descriptions": "32-bit unsigned (uint32_t)",
    "js_type": "uint32",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": null,
    "isDeleted": false
  },
  {
    "id": 4,
    "name": "PAYLOAD_I8_T",
    "hex_symbols": "0x04",
    "descriptions": "8-bit signed (int8_t)",
    "js_type": "int8",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": null,
    "isDeleted": false
  },
  {
    "id": 5,
    "name": "PAYLOAD_I16_T",
    "hex_symbols": "0x05",
    "descriptions": "16-bit signed (int16_t)",
    "js_type": "int16",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": null,
    "isDeleted": false
  },
  {
    "id": 6,
    "name": "PAYLOAD_I32_T",
    "hex_symbols": "0x06",
    "descriptions": "32-bit signed (int32_t)",
    "js_type": "int32",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": null,
    "isDeleted": false
  },
  {
    "id": 7,
    "name": "PAYLOAD_BOOL_T",
    "hex_symbols": "0x07",
    "descriptions": "Kiểu Boolean (true/false)",
    "js_type": "boolean",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": null,
    "isDeleted": false
  },
  {
    "id": 8,
    "name": "PAYLOAD_FLOAT_T",
    "hex_symbols": "0x08",
    "descriptions": "Số thực (float32)",
    "js_type": "float32",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": null,
    "isDeleted": false
  },
  {
    "id": 9,
    "name": "PAYLOAD_STRING_T",
    "hex_symbols": "0x0A",
    "descriptions": "Chuỗi ký tự (string)",
    "js_type": "string",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": null,
    "isDeleted": false
  },
  {
    "id": 12,
    "name": "PAYLOAD_CHAR",
    "hex_symbols": "0x09",
    "descriptions": "ký tự (char)",
    "js_type": "string",
    "note": null,
    "user_created": null,
    "time_created": null,
    "user_updated": null,
    "time_updated": null,
    "isDeleted": false
  }
];