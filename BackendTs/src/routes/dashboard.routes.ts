// src/routes/dashboard.routes.ts

import express from "express";
import {
    getOverallSummary,
    getPacketCountsOverTime,
    getTopMissedDevices,
    getPacketCountsByCommand,
    getDeviceConnectivity,
    getHourlyPerformanceMetrics,
    getDeviceList
} from "../controllers/dashboard.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Các API liên quan đến bảng điều khiển và thống kê dữ liệu IoT.
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Lấy tóm tắt tổng quan về hệ thống IoT.
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian bắt đầu (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian kết thúc (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Lọc theo Device ID.
 *       - in: query
 *         name: cmd
 *         schema:
 *           type: string
 *         description: Lọc theo loại lệnh (command).
 *     responses:
 *       200:
 *         description: Trả về dữ liệu tóm tắt tổng quan thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPackets:
 *                   type: integer
 *                   description: Tổng số gói tin đã nhận.
 *                   example: 500000
 *                 successfulPackets:
 *                   type: integer
 *                   description: Tổng số gói tin thành công.
 *                   example: 480000
 *                 missedPackets:
 *                   type: integer
 *                   description: Tổng số gói tin bị bỏ lỡ.
 *                   example: 20000
 *                 missRatePercentage:
 *                   type: number
 *                   format: float
 *                   description: Tỷ lệ gói tin bị bỏ lỡ (%).
 *                   example: 4.0
 *                 totalUniqueDevices:
 *                   type: integer
 *                   description: Tổng số thiết bị duy nhất đã gửi gói tin.
 *                   example: 150
 *                 totalUniqueCommands:
 *                   type: integer
 *                   description: Tổng số lệnh duy nhất đã nhận.
 *                   example: 10
 *       400:
 *         description: Tham số không hợp lệ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server nội bộ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/summary", getOverallSummary);

/**
 * @swagger
 * /dashboard/packet-counts-over-time:
 *   get:
 *     summary: Lấy số lượng gói tin theo khoảng thời gian (giờ, ngày, tuần).
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly]
 *         description: Khoảng thời gian để tổng hợp dữ liệu.
 *         required: true
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian bắt đầu (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian kết thúc (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Lọc theo Device ID.
 *       - in: query
 *         name: cmd
 *         schema:
 *           type: string
 *         description: Lọc theo loại lệnh (command).
 *     responses:
 *       200:
 *         description: Danh sách số lượng gói tin theo thời gian thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timeBucket:
 *                     type: number
 *                     description: Unix timestamp (giây) của thời điểm/khoảng thời gian.
 *                     example: 1678886400
 *                   successfulPackets:
 *                     type: integer
 *                     description: Số lượng gói tin thành công trong khoảng thời gian này.
 *                     example: 450
 *                   missedPackets:
 *                     type: integer
 *                     description: Số lượng gói tin bị bỏ lỡ trong khoảng thời gian này.
 *                     example: 20
 *                   missRatePercentage:
 *                     type: number
 *                     format: float
 *                     description: Tỷ lệ gói tin bị bỏ lỡ (%) trong khoảng thời gian này.
 *                     example: 4.23
 *       400:
 *         description: Tham số không hợp lệ (ví dụ 'interval' không đúng định dạng).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server nội bộ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/packet-counts-over-time", getPacketCountsOverTime);

/**
 * @swagger
 * /dashboard/top-missed-devices:
 *   get:
 *     summary: Lấy danh sách các thiết bị có tỷ lệ bỏ lỡ gói tin cao nhất.
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: topLimit
 *         schema:
 *           type: integer
 *           default: 5
 *           minimum: 1
 *         description: Số lượng thiết bị hàng đầu muốn lấy.
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian bắt đầu (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian kết thúc (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Lọc theo Device ID.
 *       - in: query
 *         name: cmd
 *         schema:
 *           type: string
 *         description: Lọc theo loại lệnh (command).
 *     responses:
 *       200:
 *         description: Danh sách các thiết bị có tỷ lệ bỏ lỡ gói tin cao nhất thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                     description: ID của thiết bị.
 *                     example: "DEV-001"
 *                   deviceName:
 *                     type: string
 *                     description: Tên thiết bị.
 *                     example: "Sensor Cảm Biến"
 *                   mac:
 *                     type: string
 *                     description: Địa chỉ MAC của thiết bị.
 *                     example: "AA:BB:CC:DD:EE:FF"
 *                   totalPackets:
 *                     type: integer
 *                     description: Tổng số gói tin từ thiết bị này.
 *                     example: 1000
 *                   missedPackets:
 *                     type: integer
 *                     description: Số lượng gói tin bị bỏ lỡ từ thiết bị này.
 *                     example: 150
 *                   missRatePercentage:
 *                     type: number
 *                     format: float
 *                     description: Tỷ lệ gói tin bị bỏ lỡ (%) của thiết bị này.
 *                     example: 15.0
 *                   lastSeen:
 *                     type: number
 *                     description: Unix timestamp (giây) lần cuối cùng thiết bị gửi gói tin.
 *                     example: 1678972800
 *       400:
 *         description: Tham số không hợp lệ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server nội bộ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/top-missed-devices", getTopMissedDevices);

/**
 * @swagger
 * /dashboard/packet-counts-by-command:
 *   get:
 *     summary: Lấy số lượng gói tin được tổng hợp theo loại lệnh (command).
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian bắt đầu (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian kết thúc (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Lọc theo Device ID.
 *       - in: query
 *         name: cmd
 *         schema:
 *           type: string
 *         description: Lọc theo loại lệnh (command).
 *     responses:
 *       200:
 *         description: Danh sách thống kê gói tin theo lệnh thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   cmd:
 *                     type: string
 *                     description: Loại lệnh (command).
 *                     example: "CMD_STATUS_REPORT"
 *                   totalPackets:
 *                     type: integer
 *                     description: Tổng số gói tin của lệnh này.
 *                     example: 25000
 *                   successfulPackets:
 *                     type: integer
 *                     description: Số lượng gói tin thành công của lệnh này.
 *                     example: 24000
 *                   missedPackets:
 *                     type: integer
 *                     description: Số lượng gói tin bị bỏ lỡ của lệnh này.
 *                     example: 1000
 *                   missRatePercentage:
 *                     type: number
 *                     format: float
 *                     description: Tỷ lệ gói tin bị bỏ lỡ (%) của lệnh này.
 *                     example: 4.0
 *       400:
 *         description: Tham số không hợp lệ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server nội bộ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/packet-counts-by-command", getPacketCountsByCommand);

/**
 * @swagger
 * /dashboard/device-connectivity:
 *   get:
 *     summary: Lấy trạng thái kết nối của các thiết bị và thông tin liên quan.
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian bắt đầu (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian kết thúc (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Lọc theo Device ID.
 *       - in: query
 *         name: cmd
 *         schema:
 *           type: string
 *         description: Lọc theo loại lệnh (command).
 *     responses:
 *       200:
 *         description: Danh sách trạng thái kết nối của thiết bị thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                     description: ID của thiết bị.
 *                     example: "DEV-001"
 *                   deviceName:
 *                     type: string
 *                     description: Tên thiết bị.
 *                     example: "Sensor Nhiệt độ"
 *                   mac:
 *                     type: string
 *                     description: Địa chỉ MAC của thiết bị.
 *                     example: "00:1A:2B:3C:4D:5E"
 *                   isOnline:
 *                     type: boolean
 *                     description: Trạng thái trực tuyến của thiết bị.
 *                     example: true
 *                   lastConnected:
 *                     type: number
 *                     description: Unix timestamp (giây) của lần kết nối gần nhất.
 *                     example: 1678972900
 *                   disconnectCount:
 *                     type: integer
 *                     description: Số lần thiết bị bị ngắt kết nối (chưa được triển khai đầy đủ trong controller).
 *                     example: 0
 *                   averageLatencyMs:
 *                     type: number
 *                     format: float
 *                     nullable: true
 *                     description: Độ trễ trung bình của thiết bị (chưa được tính toán trong controller).
 *                     example: 50.25
 *       400:
 *         description: Tham số không hợp lệ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server nội bộ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/device-connectivity", getDeviceConnectivity);

/**
 * @swagger
 * /dashboard/hourly-performance-metrics:
 *   get:
 *     summary: Lấy các chỉ số hiệu suất của thiết bị theo giờ.
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: ID của thiết bị cần lấy hiệu suất.
 *         required: true
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian bắt đầu (Unix timestamp tính bằng giây).
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: unix-timestamp
 *         description: Thời gian kết thúc (Unix timestamp tính bằng giây).
 *     responses:
 *       200:
 *         description: Dữ liệu hiệu suất theo giờ của thiết bị thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timeBucket:
 *                     type: number
 *                     description: Unix timestamp (giây) của khoảng thời gian (đầu giờ).
 *                     example: 1678886400
 *                   deviceId:
 *                     type: string
 *                     description: ID của thiết bị.
 *                     example: "DEV-001"
 *                   avgCpuUsagePercentage:
 *                     type: number
 *                     format: float
 *                     nullable: true
 *                     description: Mức sử dụng CPU trung bình (%).
 *                     example: 35.7
 *                   avgRamUsageMB:
 *                     type: number
 *                     format: float
 *                     nullable: true
 *                     description: Mức sử dụng RAM trung bình (MB).
 *                     example: 1024.5
 *                   avgBatteryLevelPercentage:
 *                     type: number
 *                     format: float
 *                     nullable: true
 *                     description: Mức pin trung bình (%).
 *                     example: 88.0
 *       400:
 *         description: Tham số 'deviceId' bị thiếu hoặc không hợp lệ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server nội bộ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/hourly-performance-metrics", getHourlyPerformanceMetrics);

/**
 * @swagger
 * /dashboard/devices:
 *   get:
 *     summary: Lấy danh sách tất cả các thiết bị IoT đã đăng ký.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Danh sách thiết bị được trả về thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID duy nhất của thiết bị.
 *                     example: "iot_device_001"
 *                   name:
 *                     type: string
 *                     description: Tên hiển thị của thiết bị.
 *                     example: "Cảm Biến Nhiệt Độ"
 *                   mac:
 *                     type: string
 *                     description: Địa chỉ MAC của thiết bị.
 *                     example: "00:1A:2B:3C:4D:5E"
 *       500:
 *         description: Lỗi server nội bộ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/devices", getDeviceList);

export default router;