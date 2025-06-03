import { MqttClient } from "mqtt";
import logger from "../../config/logger";

// Hàm helper để chuyển hex string thành Buffer
const hexStringToBuffer = (hexString: string): Buffer => {
    // Loại bỏ khoảng trắng và chuyển thành lowercase
    const cleanHex = hexString.replace(/\s+/g, '').toLowerCase();

    // Kiểm tra định dạng hex hợp lệ
    if (!/^[0-9a-f]+$/i.test(cleanHex)) {
        throw new Error('Invalid hex string format');
    }

    // Đảm bảo độ dài chẵn
    const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;

    return Buffer.from(paddedHex, 'hex');
};

// Cập nhật hàm publishMessage để gửi byte
const publishMessage = (client: MqttClient, topic: string, message: any) => {
    let dataToSend: Buffer | string;

    // Nếu message là hex string, chuyển thành Buffer
    if (typeof message === 'string' && /^[0-9a-f\s]+$/i.test(message)) {
        try {
            dataToSend = hexStringToBuffer(message);
            console.log(`Converting hex string "${message}" to bytes:`, Array.from(dataToSend));
        } catch (error) {
            console.error('Error converting hex to buffer:', error);
            dataToSend = message; // Fallback to string
        }
    } else {
        dataToSend = message;
    }

    client.publish(topic, dataToSend, (err) => {
        console.log(topic, dataToSend);
        if (err) {
            logger.error("❌ Publish Error:", err);
            return false;
        } else {
            if (Buffer.isBuffer(dataToSend)) {
                logger.info(`📤 Published [${topic}]: ${Array.from(dataToSend)} (bytes)`);
            } else {
                logger.info(`📤 Published [${topic}]: ${dataToSend}`);
            }
            return true;
        }
    });
    return false;
};

export default publishMessage;
