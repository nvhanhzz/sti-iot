export const bufferToHexFormat = (buffer: Buffer | Uint8Array): string => {
    return Array.from(buffer)
        .map(byte => `0x${byte.toString(16).padStart(2, '0')}`)
        .join(' ');
};

export const ConvertHextoData = (hexStr: string, dataType: string) => {
    if (hexStr.length & 1) throw new Error("Chuỗi hex không hợp lệ.");
    let buffer = new ArrayBuffer(8);
    let view = new DataView(buffer);
    switch (dataType.toLowerCase()) {
        case "uint32":
            return parseInt(hexStr, 16);
        case "int32":
            let intVal = parseInt(hexStr, 16);
            return intVal > 0x7FFFFFFF ? intVal - 0x100000000 : intVal;
        case "float32":
            view.setUint32(0, parseInt(hexStr, 16), false);
            return view.getFloat32(0, false);
        case "float64":
            view.setBigUint64(0, BigInt("0x" + hexStr), false);
            return view.getFloat64(0, false);
        case "string":
            return new TextDecoder().decode(Uint8Array.from(hexStr.match(/.{2}/g)!.map(byte => parseInt(byte, 16))));
        case "float64":
            let high = parseInt(hexStr.slice(0, 8), 16);
            let low = parseInt(hexStr.slice(8, 16), 16);
            view.setUint32(0, high, false);
            view.setUint32(4, low, false);
            return view.getFloat64(0, false);
        case "bytearray":
            return Uint8Array.from(hexStr.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
        case "boolean":
            return parseInt(hexStr, 16) !== 0;
        default:
            throw new Error("Kiểu dữ liệu không hợp lệ!");
    }
};

export const ConvertDatatoHex = (value: any, dataType: string): string => {
    let buffer = new ArrayBuffer(8);
    let view = new DataView(buffer);
    switch (dataType.toLowerCase()) {
        case "uint32":
        case "int32":
            let intVal = value < 0 ? 0x100000000 + value : value;
            return intVal.toString(16).padStart(8, "0").toUpperCase();
        case "float32":
            view.setFloat32(0, value, false);
            return view.getUint32(0, false).toString(16).padStart(8, "0").toUpperCase();
        case "float64":
            view.setFloat64(0, value, false);
            return view.getBigUint64(0, false).toString(16).padStart(16, "0").toUpperCase();
        case "string":
            return [...new TextEncoder().encode(value)]
                .map(byte => byte.toString(16).padStart(2, "0"))
                .join("")
                .toUpperCase();
        case "base64":
            return ConvertDatatoHex(atob(value), "string");
        case "bytearray":
            return [...value]
                .map(byte => byte.toString(16).padStart(2, "0"))
                .join("")
                .toUpperCase();
        case "boolean":
            return value ? "01" : "00";
        default:
            throw new Error("Kiểu dữ liệu không hợp lệ!");
    }
};
