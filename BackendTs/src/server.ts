import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import logger from "./config/logger";
import routes from "./routes/index.routes";
import { initSocket } from "./sockets";
import { config } from "./config";
import { connectDatabases } from "./config/db.config";
import { initQueue } from "./queue";
import { initJobs } from "../src/jobs";
import { initWatcher } from "./watcher";
import initMqtt from "./mqtt";
import subscribeToTopics from "./mqtt/subcribe";
import {updateCmdStatisticsFromDB} from "./services/iot_statistics.services";

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    pingTimeout: config.socket.pingTimeout,
    pingInterval: config.socket.pingInterval,
    cors: config.socket.cors,
});
export { io };

// Middleware
app.use(
    cors({
        origin: "*",
        methods: "GET,POST,PUT,DELETE",
        allowedHeaders: "Content-Type,Authorization",
    })
);
app.use(express.json());
app.use("/api", routes);

const startServer = async () => {
    try {
        // Database connection
        await connectDatabases();
        logger.info("Connect DB Success");

        // Run non-blocking tasks in parallel
        await Promise.all([
            initQueue(),
            initJobs(),
            initWatcher(),
        ]);

        // --- Nạp dữ liệu thống kê ban đầu sau khi kết nối DB thành công ---
        logger.info("Initial loading of CMD statistics...");
        await updateCmdStatisticsFromDB();
        logger.info("CMD statistics loaded successfully.");
        // ------------------------------------------------------------------

        // MQTT and Socket setup
        subscribeToTopics(initMqtt); // Subscribe to topics after MQTT is initialized

        // Start server
        server.listen(config.port, () => {
            logger.info(`Server is running on port ${config.port}`);
        });

        // Initialize Socket.io after the server starts
        initSocket(io);

    } catch (error) {
        logger.error("❌ Server startup failed:", error);
        process.exit(1); // Terminate the process on failure
    }
}

startServer();