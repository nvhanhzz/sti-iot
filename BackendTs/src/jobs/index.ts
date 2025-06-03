import cron from "node-cron";
import logger from "../config/logger";
import { sendDataRealTime } from "../controllers/iots.controller";
export const initJobs = () => {

    cron.schedule("*/3 * * * * *", async () => { // Chạy mỗi 3 giây
        // logger.info("Running job every 3 seconds");
        // await sendDataRealTime();
        // Thêm logic xử lý công việc tại đây
    });

    logger.info("Scheduled jobs initialized");
};
