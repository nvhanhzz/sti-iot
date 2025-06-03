"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initJobs = void 0;
const logger_1 = __importDefault(require("../config/logger"));
const initJobs = () => {
    // cron.schedule("*/2 * * * * *", async () => { // Chạy mỗi 2 giây
    //     logger.info("Running job every 2 seconds");
    //     // Thêm logic xử lý công việc tại đây
    // });
    logger_1.default.info("Scheduled jobs initialized");
};
exports.initJobs = initJobs;
