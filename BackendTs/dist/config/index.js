"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: Number(process.env.PORT) || 5000,
    jwtSecret: process.env.JWT_SECRET,
    db: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        dialect: process.env.DB_DIALECT, // Thêm dialect từ env
    },
    logDirectory: process.env.LOG_DIRECTORY || "logs",
    socket: {
        pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT) || 60000,
        pingInterval: Number(process.env.SOCKET_PING_INTERVAL) || 25000,
        cors: {
            origin: process.env.SOCKET_CORS_ORIGIN || "*",
            methods: ["GET", "POST"],
        },
    },
    jobs: {
        cleanupInterval: Number(process.env.JOB_CLEANUP_INTERVAL) || 86400000, // 24h
    },
};
