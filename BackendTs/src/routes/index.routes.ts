import express from "express";
import authRoutes from "./auth.routes";
import iotsRoutes from "./iots.routes";
import mqttRoutes from "./mqtt.routes";
import payload_typeRoutes from "./payload_type.routes";
import firmwareRoutes from "./firmware_version.routes";
import iotsRoutesV2 from "./iots.routes.v2";
import dashboardRoutes from "./dashboard.routes";
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/iots", iotsRoutes);
router.use("/v2/iots", iotsRoutesV2);
router.use("/mqtt", mqttRoutes);
router.use("/payload-type", payload_typeRoutes);
router.use("/firmware-version", firmwareRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;