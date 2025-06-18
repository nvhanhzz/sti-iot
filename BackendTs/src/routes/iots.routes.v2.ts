import express from "express";
import {
    sendDataIots
} from "../controllers/iots.controller.v2";
const router = express.Router();

router.get("/get-data-iots", sendDataIots);

export default router;