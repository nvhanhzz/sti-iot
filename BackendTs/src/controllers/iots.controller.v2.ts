import {Request, Response} from "express";
import logger from "../config/logger";
import models from "../models/sql"

export const sendDataIots = async (req: Request, res: Response) => {
    try {
        const dataIots = await models.IotSettings.findAll({
            include: [{
                model: models.FirmwareVersion,
                as: 'firmware',
                attributes: ['versionNumber', 'releaseDate', 'downloadUrl', 'description']
            }],
        });

        if (!dataIots || dataIots.length === 0) {
            res.status(404).send({ message: "No IoT settings found." });
            return;
        }

        res.status(200).send({
            status: true,
            data: dataIots
        });
    } catch (error) {
        logger.error("Error in sendDataIots:", error);
        // @ts-ignore
        res.status(500).send({ status: false, error: error.message });
    }
};