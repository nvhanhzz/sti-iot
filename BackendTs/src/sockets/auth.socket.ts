import { Server, Socket } from "socket.io";
import { EVENTS } from "./events";
export const initAuthSocket = (socket: Socket, io: Server) => {
    socket.on(EVENTS.AUTH.EVENT, (data) => {
        console.log("Auth event received", data);
        io.emit(EVENTS.AUTH.RESPONSE, { message: "Auth event processed" });
    });
};