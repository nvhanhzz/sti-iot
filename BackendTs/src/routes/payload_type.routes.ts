import express from "express";
import { sendDataPayloadTypePaginate, SettingPayloadType, LockPayloadType, SendDistinctPayloadType } from "../controllers/payload_type.controller";
const router = express.Router();

router.get("/get-data-payload-type", sendDataPayloadTypePaginate);
router.post("/setting-payload-type", SettingPayloadType);
router.post("/lock-payload-type", LockPayloadType);
router.get("/get-distinct-payload-type", SendDistinctPayloadType);

export default router;