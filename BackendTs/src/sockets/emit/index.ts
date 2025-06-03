import { io } from "../../server";

export const sendIOTStatus = (message: any) => {
    io.emit("iot_update_status", message);
    return true;
};

export const sendIOTMsgPush = (message: any) => {
    io.emit("iot_send_data", message);
    return true;
};

export const sendIOTDataTimeLine = (message: any) => {
    io.emit("iot_send_data_time_line", message);
    return true;
};


export const EmitData = async (event: any, message: any) => {
    io.emit(event, message);
    return true;
}

export const EmitOneData = async (socket: any, event: any, message: any) => {
    socket.emit(event, message);
    return true;
}