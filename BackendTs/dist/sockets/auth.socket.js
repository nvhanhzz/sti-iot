"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAuthSocket = void 0;
const events_1 = require("./events");
const initAuthSocket = (socket, io) => {
    socket.on(events_1.EVENTS.AUTH.EVENT, (data) => {
        console.log("Auth event received", data);
        io.emit(events_1.EVENTS.AUTH.RESPONSE, { message: "Auth event processed" });
    });
};
exports.initAuthSocket = initAuthSocket;
