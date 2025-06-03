import { Server, Socket } from "socket.io";
import { EVENTS } from "./events";
import { AlgorithmGetIot } from "../algorithms/iots.algorithms";
import { IotStatusGlobal } from "../global";
import { EmitOneData } from "./emit";
export const initIotSocket = (socket: Socket, io: Server) => {
    socket.on(EVENTS.IOT_STATUS.EVENT, async (data) => {
        const dataIots = await IotStatusGlobal.getAll();
        EmitOneData(socket, 'iot_update_status', dataIots);
    });
};
