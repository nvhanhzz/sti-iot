// src/routes/dashboard.route.ts

import express from "express";
import {
    getOverallSummary,
    getPacketCountsOverTime,
    getTopMissedDevices,
    getPacketCountsByCommand,
    getDeviceConnectivity,
    getHourlyPerformanceMetrics
} from "../controllers/dashboard.controller";

const router = express.Router();

router.get("/summary", getOverallSummary);

// Không cần @ts-ignore nếu kiểu Request được định nghĩa đúng trong controller
router.get("/packet-counts-over-time", getPacketCountsOverTime);

// Không cần @ts-ignore nếu kiểu Request được định nghĩa đúng trong controller
router.get("/top-missed-devices", getTopMissedDevices);

router.get("/packet-counts-by-command", getPacketCountsByCommand);

router.get("/device-connectivity", getDeviceConnectivity);

// Không cần @ts-ignore nếu kiểu Request được định nghĩa đúng trong controller
router.get("/hourly-performance-metrics", getHourlyPerformanceMetrics);

export default router;