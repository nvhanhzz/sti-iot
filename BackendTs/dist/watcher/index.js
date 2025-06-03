"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWatcher = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../config/logger"));
const watchDirectory = path_1.default.join(__dirname, "../../watched-files");
const initWatcher = () => {
    if (!fs_1.default.existsSync(watchDirectory)) {
        fs_1.default.mkdirSync(watchDirectory, { recursive: true });
    }
    fs_1.default.watch(watchDirectory, (eventType, filename) => {
        if (filename) {
            logger_1.default.info(`File ${filename} was ${eventType}`);
            // Thêm logic xử lý khi file thay đổi
        }
    });
    logger_1.default.info("File watcher initialized");
};
exports.initWatcher = initWatcher;
