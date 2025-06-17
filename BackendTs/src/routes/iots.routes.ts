import express from "express";
import {
    sendDataIots,
    UpdateDataIots,
    SendDistinctIots,
    LockIots,
    deviceSendData,
    serverPublish,
    controlSerialCommand,
    controlModbusCommand,
    getStatistics, updateBasicInfo, updateEthernetSettings,
    updateMqttSettings,
    updateRs485Settings,
    updateCanSettings, updateWifiSettings,
    updateRs232Settings,
    updateFirmwareVersion, updateTcpSettings
} from "../controllers/iots.controller";
import { sendDataPayloadType, UpdateDataPayloadType } from "../controllers/payload_type.controller";
import { sendDataIotCmd, SettingIotCmd, LockIotCmd, SendDistinctIotCmd, SendDataIotCmdField, SettingIotCmdField } from "../controllers/iot_cmd.controller";
const router = express.Router();

router.get("/get-data-iots", sendDataIots);
router.get("/get-distinct-iots", SendDistinctIots);
router.post("/lock-iots", LockIots);
router.post("/device-send-data", deviceSendData);
router.post("/server-publish", serverPublish);
router.post("/serial-command", controlSerialCommand);
router.post("/modbus-command", controlModbusCommand);

router.post("/active-data-iots", UpdateDataIots);
router.get("/payload-type/get-data-payload-type", sendDataPayloadType);
router.post("/payload-type/update-data-payload-type", UpdateDataPayloadType);


router.get("/get-data-iot-command", sendDataIotCmd);
router.post("/setting-iot-command", SettingIotCmd);
router.get("/get-data-iot-command-field", SendDataIotCmdField);
router.post("/setting-iot-command-field", SettingIotCmdField);

router.post("/lock-iot-command", LockIotCmd);
router.get("/get-distinct-iot-command", SendDistinctIotCmd);

router.get("/statistics/:id", getStatistics);

router.put("/:id/basic-info", updateBasicInfo);
router.put("/:id/wifi-settings", updateWifiSettings);
router.put("/:id/ethernet-settings", updateEthernetSettings);
router.put("/:id/mqtt-settings", updateMqttSettings);
router.put("/:id/rs485-settings", updateRs485Settings);
router.put("/:id/tcp-settings", updateTcpSettings);
router.put("/:id/rs232-settings", updateRs232Settings);
router.put("/:id/can-settings", updateCanSettings);
router.put("/:id/firmware-version", updateFirmwareVersion);

export default router;