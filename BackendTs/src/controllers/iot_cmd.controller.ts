import { Request, Response } from "express";
import { AlgorithmLockIotCmd, AlgorithmSettingIotCmdField } from "../algorithms/iots.algorithms";
import { GetDataIotCmd, DistinctDataIotCmd, GetDataIotCmdField } from "../services/iot_cmd.services";
import { AlgorithmGetIotCMD, AlgorithmSettingIotCmd } from "../algorithms/iot_cmd.algorithms";

export const sendDataIotCmd = async (req: Request, res: Response) => {
    try {
        const dataIotCmd: any = await AlgorithmGetIotCMD(req);
        res.status(200).send(dataIotCmd);
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const SendDistinctIotCmd = async (req: Request, res: Response) => {
    try {
        const data = await DistinctDataIotCmd(req);
        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const SettingIotCmd = async (req: Request, res: Response) => {
    try {
        const data = await AlgorithmSettingIotCmd(req);
        res.status(data.status).send({ message: data.message });
    } catch (error) {
        console.error("Error in Setting IotCmd:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const LockIotCmd = async (req: Request, res: Response) => {
    try {
        const data = await AlgorithmLockIotCmd(req);
        if (data) {
            res.status(data.status).send({ message: data.message });
        }
    } catch (error) {
        console.error("Error in Lock IotCmd:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const SendDataIotCmdField = async (req: Request, res: Response) => {
    try {
        const data = await GetDataIotCmdField(req);
        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export const SettingIotCmdField = async (req: Request, res: Response) => {
    try {
        const data = await AlgorithmSettingIotCmdField(req);
        if (data) {
            res.status(data.status).send({ message: data.message });
        }
    } catch (error) {
        console.error("Error in Setting Product:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};