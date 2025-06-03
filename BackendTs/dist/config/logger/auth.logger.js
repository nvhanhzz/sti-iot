"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const index_1 = require("../index");
const transport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(index_1.config.logDirectory, "auth-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles: "15d",
    zippedArchive: true,
});
exports.authLogger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [new winston_1.default.transports.Console(), transport],
});
