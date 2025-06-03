"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const index_1 = require("../index");
// Tạo thư mục logs nếu chưa tồn tại
if (!fs_1.default.existsSync(index_1.config.logDirectory)) {
    fs_1.default.mkdirSync(index_1.config.logDirectory, { recursive: true });
}
const transport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(index_1.config.logDirectory, "app-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles: "15d",
    zippedArchive: true,
});
const logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [new winston_1.default.transports.Console(), transport],
});
exports.default = logger; // 🔥 Đổi thành export default
