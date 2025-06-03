"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const logger_1 = __importDefault(require("./config/logger"));
const index_routes_1 = __importDefault(require("./routes/index.routes"));
const sockets_1 = require("./sockets");
const config_1 = require("./config");
const db_config_1 = require("./config/db.config");
const jobs_1 = require("../src/jobs");
const watcher_1 = require("./watcher");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    pingTimeout: config_1.config.socket.pingTimeout,
    pingInterval: config_1.config.socket.pingInterval,
    cors: config_1.config.socket.cors,
});
app.use(express_1.default.json());
app.use("/api", index_routes_1.default);
(0, sockets_1.initSocket)(io);
(0, jobs_1.initJobs)();
(0, watcher_1.initWatcher)();
db_config_1.sequelize.sync().then(() => {
    logger_1.default.info("Database connected");
    server.listen(config_1.config.port, () => {
        logger_1.default.info(`Server is running on port ${config_1.config.port}`);
    });
});
