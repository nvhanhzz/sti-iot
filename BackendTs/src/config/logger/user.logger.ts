import winston from "winston";
import path from "path";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "../index";

const transport = new DailyRotateFile({
    filename: path.join(config.logDirectory, "user", "user-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles: "15d",
    zippedArchive: true,
});

export const userLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console(), transport],
});
