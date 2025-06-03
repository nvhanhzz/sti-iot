import winston from "winston";
import path from "path";
import fs from "fs";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "../index";

// Tạo thư mục logs nếu chưa tồn tại
if (!fs.existsSync(config.logDirectory)) {
    fs.mkdirSync(config.logDirectory, { recursive: true });
}

const transport = new DailyRotateFile({
    filename: path.join(config.logDirectory, "app-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles: "15d",
    zippedArchive: true,
});

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console(), transport],
});

export default logger; // 🔥 Đổi thành export default
