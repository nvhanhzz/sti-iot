import { Server, Socket } from "socket.io";
import { EVENTS } from "./events";
export const initUserSocket = (socket: Socket, io: Server) => {
    socket.on(EVENTS.USER.EVENT, (data) => {
        console.log("User event received", data);
        io.emit(EVENTS.USER.RESPONSE, { message: "User event processed" });
    });
};
