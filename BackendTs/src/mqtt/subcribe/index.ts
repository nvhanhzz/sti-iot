import { MqttClient } from "mqtt";
import logger from "../../config/logger";
import { sendIOTMsgPush } from "../../sockets/emit";
import moment from "moment";
import { bufferToHexFormat } from "../../global/convertData.global";
import { deviceUpdateData } from "../../controllers/iots.controller";
import { MasterIotGlobal, IotStatusGlobal } from "../../global";
import { EmitData } from "../../sockets/emit";
const subscribeTopics = ["device_send/+"];

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
        const topicSplit = topic.split('/');
        const topicSend = topicSplit.length > 1 ? topicSplit[0] : null;
        const mac = topicSplit.length > 1 ? topicSplit[1] : null;
        if (mac) {
            const Iot = MasterIotGlobal.findByMac(mac);
            if (Iot) {
                const IotStatus = IotStatusGlobal.findById(Iot.id);
                const IotStatusObj: any =
                {
                    iotId: Iot.id,
                    firm_ware: '',
                    connected: true,
                    input: true,
                    output: IotStatus?.output,
                }
                IotStatusGlobal.update(IotStatusObj);
                EmitData("iot_update_status", [IotStatusObj]);
                setTimeout(() => {
                    IotStatusObj.input = false;
                    IotStatusGlobal.update(IotStatusObj);
                    EmitData("iot_update_status", [IotStatusObj]);
                }, 500);
            }
            if (topicSend == 'device_send') {
                await deviceUpdateData(topic, message);
            }
        }
    });
};

export default subscribeToTopics;
