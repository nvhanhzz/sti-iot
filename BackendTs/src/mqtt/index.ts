import mqtt from "mqtt";
import { config } from "../config";
import logger from "../config/logger";

const broker_host = `mqtt://${config.mqtt.host}`;

let clientId = config.mqtt.id;
if (!clientId || clientId.length > 23) {
    clientId = `client_${Math.random().toString(16).slice(2, 10)}`;
    logger.warn(`⚠️ MQTT clientId không hợp lệ, dùng tạm: ${clientId}`);
}

const options = {
    clientId,
    username: config.mqtt.username,
    password: config.mqtt.password,
    clean: true,
};

logger.info("🔧 MQTT Config:", broker_host, options);

const client = mqtt.connect(broker_host, options);

client.on("connect", () => logger.info("✅ MQTT connected"));
client.on("error", (err) => logger.error("❌ MQTT Error:", err));

export default client;
