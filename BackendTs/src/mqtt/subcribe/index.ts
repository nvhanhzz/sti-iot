import { MqttClient } from "mqtt";
import logger from "../../config/logger";
import { deviceUpdateData } from "../../controllers/iots.controller";
import { MasterIotGlobal, IotStatusGlobal } from "../../global";
import { EmitData } from "../../sockets/emit";

const subscribeTopics = ["device_send/+", "device/config/result/#"];

interface PendingRequest {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeout: NodeJS.Timeout;
    deviceMAC: string;
    updateData: any;
    sectionName: string;
}

export const pendingDeviceRequests = new Map<string, PendingRequest>();

const subscribeToTopics = (client: MqttClient) => {
    client.subscribe(subscribeTopics, (err) => {
        if (err) {
            logger.error("❌ Error subscribing:", err);
        } else {
            logger.info("✅ Subscribed to topics:", subscribeTopics);
        }
    });

    client.on("message", async (topic, message) => {
        logger.info(`📩 Received on [${topic}]: ${message.toString()}`);

        const topicParts = topic.split('/');
        const mac = topicParts[topicParts.length - 1];

        if (mac) {
            const Iot = MasterIotGlobal.findByMac(mac);
            if (Iot) {
                const IotStatus = IotStatusGlobal.findById(Iot.id);
                const IotStatusObj: any = {
                    iotId: Iot.id,
                    connected: true,
                    input: true,
                    output: IotStatus?.output,
                };

                IotStatusGlobal.update(IotStatusObj);
                await EmitData("iot_update_status", [IotStatusObj]);

                setTimeout(() => {
                    const currentIotStatus = IotStatusGlobal.findById(Iot.id);
                    if (currentIotStatus && currentIotStatus.connected) {
                        currentIotStatus.input = false;
                        IotStatusGlobal.update(currentIotStatus);
                        EmitData("iot_update_status", [currentIotStatus]);
                    }
                }, 500);
            }
        }

        if (topic.startsWith('device_send/')) {
            await deviceUpdateData(topic, message);
        } else if (topic.startsWith('device/config/result/')) {
            try {
                const result = JSON.parse(message.toString());
                const { transactionId, status } = result;

                const request = pendingDeviceRequests.get(transactionId);

                if (request) {
                    clearTimeout(request.timeout);

                    if (status === 'success') {
                        logger.info(`✅ [${request.sectionName}] Cấu hình cho thiết bị ${mac} thành công (ID: ${transactionId}).`);
                        request.resolve({
                            message: `${request.sectionName} đã cập nhật thành công.`,
                            data: request.updateData,
                        });
                    } else {
                        logger.error(`❌ [${request.sectionName}] Cấu hình cho thiết bị ${mac} thất bại (ID: ${transactionId})`);
                        request.reject(new Error(`Cấu hình thiết bị thất bại: ${mac}`));
                    }
                    pendingDeviceRequests.delete(transactionId);
                } else {
                    logger.warn(`⚠️ Received result for unknown or expired transaction ID: ${transactionId} on topic ${topic}`);
                }
            } catch (parseError) {
                logger.error('❌ Error parsing MQTT config result message:', parseError);
            }
        }
    });
};

export default subscribeToTopics;