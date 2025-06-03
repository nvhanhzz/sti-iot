import express from "express";
import { connectedClients, disconnectedClients } from "../mqtt/client";
const router = express.Router();

router.post("/clients-connected", connectedClients);
router.post("/clients-disconnected", disconnectedClients);

export default router;