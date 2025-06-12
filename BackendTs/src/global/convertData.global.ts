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
            if (!/^[0-9a-fA-F]*$/.test(hexStr) || hexStr.length % 2 !== 0) {
                return hexStr;
            }

            const bytesMatch = hexStr.match(/.{2}/g);
            if (!bytesMatch) {
                return ""; // Chuỗi rỗng nếu không có byte nào
            }

            const byteArray = Uint8Array.from(bytesMatch.map(byte => parseInt(byte, 16)));

            // 1. Thử giải mã bằng UTF-8
            const decodedUtf8 = new TextDecoder('utf-8', { fatal: false }).decode(byteArray);

            // Kiểm tra xem UTF-8 có chứa ký tự thay thế không
            if (!decodedUtf8.includes('\ufffd')) {
                // Nếu UTF-8 giải mã hoàn toàn sạch (không có ký tự thay thế), trả về kết quả UTF-8
                return decodedUtf8;
            }

            // 2. Nếu UTF-8 có ký tự thay thế, thử giải mã bằng ISO-8859-1 (hoặc Windows-1252)
            // ISO-8859-1 ánh xạ mỗi byte thành một ký tự.
            // Điều này đảm bảo không có \ufffd từ bộ giải mã, nhưng vẫn có thể có ký tự không in được.
            const decodedIso = new TextDecoder('iso-8859-1', { fatal: false }).decode(byteArray);

            // Kiểm tra xem chuỗi ISO-8859-1 có vẻ "hợp lý" không.
            // "Hợp lý" ở đây có thể có nghĩa là không chứa quá nhiều ký tự điều khiển.
            // Đây là phần định nghĩa "hợp lý" theo yêu cầu của bạn.
            // Đối với '62E16E' -> 'bán', chúng ta chấp nhận 'E6' là 'á'.
            // Đối với '919293' -> '‘’”', chúng ta muốn trả về thô.

            // Một cách để kiểm tra: Có quá nhiều ký tự không in được (control characters) không?
            // Ký tự điều khiển (control characters) thường nằm trong khoảng 0x00-0x1F và 0x7F.
            // Các ký tự từ 0x80-0x9F trong ISO-8859-1 là các ký tự điều khiển C1,
            // nhưng thường được ánh xạ thành các ký tự in được trong Windows-1252 (ví dụ: ‘, ”, €).
            // Nếu bạn muốn loại trừ các ký tự như '‘’”' (từ 91, 92, 93),
            // bạn cần kiểm tra cụ thể các byte này hoặc các khoảng giá trị này.

            // --- Logic mới để phân biệt ---
            // Kiểm tra xem chuỗi ISO-8859-1 có chứa các ký tự điều khiển C1 (0x80-0x9F) hay không
            // Đây là các ký tự mà thường được coi là không in được trong ISO-8859-1 gốc
            // nhưng được ánh xạ thành ký tự in được trong Windows-1252.
            // Ký tự '91', '92', '93' rơi vào khoảng này.
            const isControlCharRange = (byte: number) => byte >= 0x80 && byte <= 0x9F;
            const containsProblematicIsoChars = byteArray.some(isControlCharRange);

            // Kiểm tra xem có ký tự điều khiển ASCII (0x00-0x1F và 0x7F) không
            const isAsciiControlChar = (byte: number) => (byte >= 0x00 && byte <= 0x1F) || byte === 0x7F;
            const containsAsciiControlChars = byteArray.some(isAsciiControlChar);

            // '62E16E': 62 (b), E1 (á), 6E (n) -> 62, 225, 110. E1 (225) không phải control char. 62, 110 cũng không.
            // '919293': 91 (145), 92 (146), 93 (147). Cả ba đều là control char C1.

            if (containsAsciiControlChars || containsProblematicIsoChars) {
                // Nếu có ký tự điều khiển ASCII hoặc các ký tự "problematic" trong ISO-8859-1 (như 91, 92, 93),
                // thì trả về dữ liệu thô.
                return hexStr;
            } else {
                // Nếu không có vấn đề gì đáng kể với ISO-8859-1 (và UTF-8 đã thất bại),
                // thì trả về chuỗi đã giải mã bằng ISO.
                return decodedIso;
            }

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
