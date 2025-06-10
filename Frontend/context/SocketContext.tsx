import React, { createContext, useContext, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { message } from 'antd';
// Định nghĩa interface sự kiện
interface ServerToClientEvents {
    message: (data: string) => void;
    iot_update_status: (data: any) => void;
    iot_send_data: (data: any) => void;
    iot_send_data_time_line: (data: any) => void;
}

interface ClientToServerEvents {
    sendMessage: (data: string) => void;
    accepts_leds: (data: string) => void;
}

// Khởi tạo socket
// const SOCKET_URL = "http://192.168.1.37:3335";
const SOCKET_URL = "http://localhost:3335";
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, { autoConnect: false });

// Tạo Context
const SocketContext = createContext<Socket<
    any,
    any
> | null>(null);

// Tạo SocketProvider
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        socket.connect();
        socket.on("connect", () => {
            message.success('Connected Server Socket');
        });
        socket.on("connect_error", () => {
            message.error('Connected Error Server Socket');
        });
        return () => {
            socket.disconnect();
        };
    }, []);
    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

// Custom hook để sử dụng socket trong các component con
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket phải được sử dụng bên trong SocketProvider");
    }
    return context;
};
