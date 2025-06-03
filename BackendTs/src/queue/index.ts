import logger from "../config/logger";
import { GetDataIotWithParams } from "../services/iot.services";
import { GetDataIotCmdWithParams } from "../services/iot_cmd.services";
import { replaceDataIotCmd } from "../global/Iot_cmd.global";
import { GetDataPayloadTypeWithParams } from "../services/payload_type.services";
import { replaceDataPayloadType } from "../global/payload_type.global";
import { MasterIotGlobal, MasterPayloadGlobal, MasterIotCMDGlobal } from "../global";

export const getDataIot = async () => {
    logger.info("Get data Iot");
    const Iots: any = await GetDataIotWithParams({});
    if (Iots.status) {
        const IotsData = Iots.data;
        const iotsArray = IotsData.map((e: any) => e.get({ plain: true }));
        MasterIotGlobal.replaceAll([...iotsArray]);
    }
}

export const getDataPayloadType = async () => {
    logger.info("Get data Payload");
    const PayloadType: any = await GetDataPayloadTypeWithParams({
        'isdelete': 0
    });
    if (PayloadType.status) {
        const PayloadData = PayloadType.data;
        const payloadArray = PayloadData.map((e: any) => e.get({ plain: true }));
        MasterPayloadGlobal.replaceAll([...payloadArray]);
    }
}

export const getDataIotCmd = async () => {
    logger.info("Get data Iot CMD");
    const IotsCmd: any = await GetDataIotCmdWithParams({
        'isdelete': 0
    });
    if (IotsCmd.status) {
        const IotCMDData = IotsCmd.data;
        const IotCMDArray = IotCMDData.map((e: any) => e.get({ plain: true }));
        MasterIotCMDGlobal.replaceAll([...IotCMDArray]);
    }
}

export const initQueue = async () => {
    logger.info("Queue start");
    await getDataIot();
    await getDataPayloadType();
    await getDataIotCmd();
    logger.info("Queue initialized");
};
