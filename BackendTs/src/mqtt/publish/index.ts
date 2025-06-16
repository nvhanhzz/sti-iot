import { MqttClient } from "mqtt";
import logger from "../../config/logger";

// Hàm helper để chuyển hex string thành Buffer (giữ nguyên)
const hexStringToBuffer = (hexString: string): Buffer => {
    const cleanHex = hexString.replace(/\s+/g, '').toLowerCase();

    if (!/^[0-9a-f]+$/i.test(cleanHex)) {
        throw new Error('Invalid hex string format');
    }

    const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;

    return Buffer.from(paddedHex, 'hex');
};

// Hàm publishMessage hiện tại của bạn (giữ nguyên, không sửa đổi)
const publishMessage = (client: MqttClient, topic: string, message: any) => {
    let dataToSend: Buffer | string;

    if (typeof message === 'string' && /^[0-9a-f\s]+$/i.test(message)) {
        try {
            dataToSend = hexStringToBuffer(message);
            console.log(`Converting hex string "${message}" to bytes:`, Array.from(dataToSend));
        } catch (error) {
            console.error('Error converting hex to buffer:', error);
            dataToSend = message;
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

/**
 * Hàm mới để publish một JSON object qua MQTT.
 * Dữ liệu JSON sẽ được tự động stringify trước khi gửi.
 * @param client Instance của MQTT Client.
 * @param topic Topic để publish.
 * @param jsonObject JSON object cần gửi.
 * @returns true nếu lệnh publish được gửi thành công, false nếu có lỗi (ví dụ: JSON không hợp lệ).
 */
export const publishJson = (client: MqttClient, topic: string, jsonObject: object): boolean => {
    try {
        const payload = JSON.stringify(jsonObject);
        client.publish(topic, payload, { qos: 1 }, (err) => { // Thêm QoS 1 để đảm bảo tin nhắn được gửi
            if (err) {
                logger.error(`❌ Publish JSON Error on [${topic}]:`, err);
                return; // Lỗi publish, không cần xử lý thêm
            } else {
                logger.info(`📤 Published JSON [${topic}]: ${payload}`);
            }
        });
        return true; // Trả về true ngay sau khi lệnh publish được gửi đi
    } catch (error) {
        logger.error(`❌ Error stringifying JSON message for topic [${topic}]:`, error);
        return false; // Trả về false nếu JSON không hợp lệ
    }
};
export default publishMessage;