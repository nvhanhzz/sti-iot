"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUserSocket = void 0;
const events_1 = require("./events");
const initUserSocket = (socket, io) => {
    socket.on(events_1.EVENTS.USER.EVENT, (data) => {
        console.log("User event received", data);
        io.emit(events_1.EVENTS.USER.RESPONSE, { message: "User event processed" });
    });
};
exports.initUserSocket = initUserSocket;
