import { Request, Response } from "express";
import { getPayloadTypeGlobal } from "../global/payload_type.global";
import { algorithmsUpdateDataPayloadType, AlgorithmSettingPayloadType, AlgorithmLockPayloadType } from "../algorithms/payload_type.algorithms";
import { GetDataPayloadType, DistinctDataPayloadType } from "../services/payload_type.services";
import { AlgorithmGetPayloadType } from "../algorithms/payload_type.algorithms";

export const sendDataPayloadType = async (req: Request, res: Response) => {
    try {
        const dataPayloadType: any = await getPayloadTypeGlobal();
        res.status(200).send(dataPayloadType);
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const sendDataPayloadTypePaginate = async (req: Request, res: Response) => {
    try {
        const dataPayloadType: any = await AlgorithmGetPayloadType(req);
        console.log(dataPayloadType);
        res.status(200).send(dataPayloadType);
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const UpdateDataPayloadType = async (req: Request, res: Response) => {
    try {
        const dataIots: any = await algorithmsUpdateDataPayloadType(req);
        console.log(dataIots);
        res.status(200).send(dataIots);
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const SendDistinctPayloadType = async (req: Request, res: Response) => {
    try {
        const data = await DistinctDataPayloadType(req);
        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const SettingPayloadType = async (req: Request, res: Response) => {
    try {
        const data = await AlgorithmSettingPayloadType(req);
        res.status(data.status).send(data);
    } catch (error) {
        console.error("Error in Setting PayloadType:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const LockPayloadType = async (req: Request, res: Response) => {
    try {
        const data = await AlgorithmLockPayloadType(req);
        if (data) {
            res.status(data.status).send({ message: data.message });
        }
    } catch (error) {
        console.error("Error in Lock PayloadType:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};
