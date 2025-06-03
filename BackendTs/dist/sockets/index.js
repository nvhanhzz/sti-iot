"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const user_socket_1 = require("./user.socket");
const auth_socket_1 = require("./auth.socket");
const initSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);
        (0, user_socket_1.initUserSocket)(socket, io);
        (0, auth_socket_1.initAuthSocket)(socket, io);
        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);
        });
    });
};
exports.initSocket = initSocket;
