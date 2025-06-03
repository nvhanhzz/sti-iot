import { Server } from "socket.io";
import { initUserSocket } from "./user.socket";
import { initAuthSocket } from "./auth.socket";
import { initIotSocket } from "./iot.socket";
export const initSocket = (io: Server) => {
    io.on("connection", (socket) => {
        // console.log("New client connected", socket.id);
        initUserSocket(socket, io);
        initAuthSocket(socket, io);
        initIotSocket(socket, io);
        socket.on("disconnect", () => {
            // console.log("Client disconnected", socket.id);
        });
    });
};
