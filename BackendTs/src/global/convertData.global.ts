export const bufferToHexFormat = (buffer: Buffer | Uint8Array): string => {
    return Array.from(buffer)
        .map(byte => `0x${byte.toString(16).padStart(2, '0')}`)
        .join(' ');
};

// export const ConvertHextoData = (hexStr: string, dataType: string) => {
//     if (hexStr.length & 1) throw new Error("Chuỗi hex không hợp lệ.");
//     let buffer = new ArrayBuffer(8);
//     let view = new DataView(buffer);
//     switch (dataType.toLowerCase()) {
//         case "uint32":
//             return parseInt(hexStr, 16);
//         case "int32":
//             let intVal = parseInt(hexStr, 16);
//             return intVal > 0x7FFFFFFF ? intVal - 0x100000000 : intVal;
//         case "float32":
//             view.setUint32(0, parseInt(hexStr, 16), false);
//             return view.getFloat32(0, false);
//         case "float64":
//             view.setBigUint64(0, BigInt("0x" + hexStr), false);
//             return view.getFloat64(0, false);
//         case "string":
//             return new TextDecoder().decode(Uint8Array.from(hexStr.match(/.{2}/g)!.map(byte => parseInt(byte, 16))));
//         case "float64":
//             let high = parseInt(hexStr.slice(0, 8), 16);
//             let low = parseInt(hexStr.slice(8, 16), 16);
//             view.setUint32(0, high, false);
//             view.setUint32(4, low, false);
//             return view.getFloat64(0, false);
//         case "bytearray":
//             return Uint8Array.from(hexStr.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
//         case "boolean":
//             return parseInt(hexStr, 16) !== 0;
//         default:
//             throw new Error("Kiểu dữ liệu không hợp lệ!");
//     }
// };

export const ConvertHextoData = (hexStr: string, dataType: string | undefined) => {
    if (hexStr.length & 1) { // Kiểm tra bit cuối cùng, nếu là 1 tức là số lẻ
        throw new Error(`Chuỗi hex không hợp lệ: "${hexStr}". Độ dài phải là số chẵn.`);
    }

    let buffer = new ArrayBuffer(8);
    let view = new DataView(buffer);

    switch (dataType.toLowerCase()) {
        case "uint8":
            // 1 byte = 2 ký tự hex
            if (hexStr.length !== 2) {
                throw new Error(`Chuỗi hex không hợp lệ cho uint8: "${hexStr}". Expected 2 characters.`);
            }
            const valUint8 = parseInt(hexStr, 16);
            if (isNaN(valUint8)) throw new Error(`Không thể parse hex "${hexStr}" thành số.`);

            // Sử dụng setUint8 và getUint8 để đảm bảo giá trị đúng 8-bit unsigned
            view.setUint8(0, valUint8);
            return view.getUint8(0);

        case "int8":
            // 1 byte = 2 ký tự hex
            if (hexStr.length !== 2) {
                throw new Error(`Chuỗi hex không hợp lệ cho int8: "${hexStr}". Expected 2 characters.`);
            }
            const valInt8 = parseInt(hexStr, 16);
            if (isNaN(valInt8)) throw new Error(`Không thể parse hex "${hexStr}" thành số.`);

            // Sử dụng setInt8 và getInt8 để đảm bảo giá trị đúng 8-bit signed
            view.setInt8(0, valInt8);
            return view.getInt8(0);

        case "uint16":
            // 2 bytes = 4 ký tự hex
            if (hexStr.length !== 4) {
                throw new Error(`Chuỗi hex không hợp lệ cho uint16: "${hexStr}". Expected 4 characters.`);
            }
            const valUint16 = parseInt(hexStr, 16);
            if (isNaN(valUint16)) throw new Error(`Không thể parse hex "${hexStr}" thành số.`);

            // Giả định Big Endian (false) - hãy đảm bảo điều này khớp với giao thức của bạn
            view.setUint16(0, valUint16, false);
            return view.getUint16(0, false);

        case "int16":
            // 2 bytes = 4 ký tự hex
            if (hexStr.length !== 4) {
                throw new Error(`Chuỗi hex không hợp lệ cho int16: "${hexStr}". Expected 4 characters.`);
            }
            const valInt16 = parseInt(hexStr, 16);
            if (isNaN(valInt16)) throw new Error(`Không thể parse hex "${hexStr}" thành số.`);

            // Giả định Big Endian (false)
            view.setInt16(0, valInt16, false);
            return view.getInt16(0, false);

        case "uint32":
            // 4 bytes = 8 ký tự hex
            if (hexStr.length !== 8) {
                throw new Error(`Chuỗi hex không hợp lệ cho uint32: "${hexStr}". Expected 8 characters.`);
            }
            const valUint32 = parseInt(hexStr, 16);
            if (isNaN(valUint32)) throw new Error(`Không thể parse hex "${hexStr}" thành số.`);

            // Giả định Big Endian (false)
            view.setUint32(0, valUint32, false);
            return view.getUint32(0, false);

        case "int32":
            // 4 bytes = 8 ký tự hex
            if (hexStr.length !== 8) {
                throw new Error(`Chuỗi hex không hợp lệ cho int32: "${hexStr}". Expected 8 characters.`);
            }
            const valInt32 = parseInt(hexStr, 16);
            if (isNaN(valInt32)) throw new Error(`Không thể parse hex "${hexStr}" thành số.`);

            // Giả định Big Endian (false)
            view.setInt32(0, valInt32, false);
            return view.getInt32(0, false);

        case "float32":
            // 4 bytes = 8 ký tự hex
            if (hexStr.length !== 8) {
                throw new Error(`Chuỗi hex không hợp lệ cho float32: "${hexStr}". Expected 8 characters.`);
            }
            const valFloat32Uint32 = parseInt(hexStr, 16);
            if (isNaN(valFloat32Uint32)) throw new Error(`Không thể parse hex "${hexStr}" thành số.`);

            view.setUint32(0, valFloat32Uint32, false);
            return view.getFloat32(0, false);

        case "float64":
            // 8 bytes = 16 ký tự hex
            if (hexStr.length !== 16) {
                throw new Error(`Chuỗi hex không hợp lệ cho float64: "${hexStr}". Expected 16 characters.`);
            }
            // Cách xử lý float64: dùng BigInt
            try {
                // Đảm bảo BigInt được xử lý đúng (thêm tiền tố '0x')
                const bigIntVal = BigInt("0x" + hexStr);
                view.setBigUint64(0, bigIntVal, false); // Giả định Big Endian (false)
                return view.getFloat64(0, false);
            } catch (e: any) {
                throw new Error(`Lỗi khi chuyển đổi hex "${hexStr}" thành BigInt/Float64: ${e.message}`);
            }

        case "string":
            // Bước 1: Kiểm tra tính hợp lệ cơ bản của chuỗi hex
            // (chỉ chứa ký tự hex và có độ dài chẵn)
            if (!/^[0-9a-fA-F]*$/.test(hexStr) || hexStr.length % 2 !== 0) {
                return hexStr; // Trả về y nguyên nếu không phải chuỗi hex hợp lệ hoặc độ dài lẻ
            }

            const bytes = hexStr.match(/.{2}/g);
            if (!bytes) {
                return hexStr; // Trả về y nguyên nếu không thể chia thành các cặp byte (ví dụ: chuỗi rỗng)
            }

            let allBytesArePrintableAscii = true;
            const byteArray = Uint8Array.from(bytes.map(byte => {
                const parsedByte = parseInt(byte, 16);
                // Kiểm tra xem byte có nằm trong phạm vi ASCII hiển thị hay không (32 đến 126)
                // Hoặc các ký tự điều khiển phổ biến như tab (9), newline (10), carriage return (13)
                if (
                    (parsedByte < 32 || parsedByte > 126) && // Không phải ký tự hiển thị thông thường
                    parsedByte !== 9 && // Tab
                    parsedByte !== 10 && // Line Feed
                    parsedByte !== 13    // Carriage Return
                ) {
                    allBytesArePrintableAscii = false;
                }
                return parsedByte;
            }));

            // Nếu có bất kỳ byte nào không phải ASCII hiển thị, trả về chuỗi hex gốc
            if (!allBytesArePrintableAscii) {
                return hexStr;
            }

            // Nếu tất cả các byte đều là ASCII hiển thị, thì tiến hành decode
            return new TextDecoder().decode(byteArray);

        case "boolean":
            // Boolean thường là 1 byte = 2 ký tự hex (00 hoặc 01)
            if (hexStr.length !== 2) {
                throw new Error(`Chuỗi hex không hợp lệ cho boolean: "${hexStr}". Expected 2 characters.`);
            }
            const valBoolean = parseInt(hexStr, 16);
            if (isNaN(valBoolean)) throw new Error(`Không thể parse hex "${hexStr}" thành số.`);
            return valBoolean !== 0;

        case "bytearray": // Trả về Uint8Array, không chuyển đổi thành kiểu JavaScript cụ thể
            const byteArrBytes = hexStr.match(/.{2}/g);
            if (!byteArrBytes) return new Uint8Array(); // Trả về mảng rỗng nếu không có byte nào
            return Uint8Array.from(byteArrBytes.map(byte => parseInt(byte, 16)));

        default:
            throw new Error(`Kiểu dữ liệu không hợp lệ được cung cấp: "${dataType}".`);
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
