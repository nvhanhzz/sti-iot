import fs from "fs";
import path from "path";
import logger from "../config/logger";

const watchDirectory = path.join(__dirname, "../../watched-files");

export const initWatcher = () => {
    if (!fs.existsSync(watchDirectory)) {
        fs.mkdirSync(watchDirectory, { recursive: true });
    }
    fs.watch(watchDirectory, (eventType, filename) => {
        if (filename) {
            logger.info(`File ${filename} was ${eventType}`);
            // Thêm logic xử lý khi file thay đổi
        }
    });

    logger.info("File watcher initialized");
};