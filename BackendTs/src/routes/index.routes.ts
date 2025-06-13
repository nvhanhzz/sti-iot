import express from "express";
import authRoutes from "./auth.routes";
import iotsRoutes from "./iots.routes";
import mqttRoutes from "./mqtt.routes";
import payload_typeRoutes from "./payload_type.routes";
import firmwareRoutes from "./firmware_version.routes";
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/iots", iotsRoutes);
router.use("/mqtt", mqttRoutes);
router.use("/payload-type", payload_typeRoutes);
router.use("/firmware-version", firmwareRoutes);

export default router;