import dotenv from "dotenv";
dotenv.config();

export const config = {
    port: Number(process.env.PORT) || 5000,
    jwtSecret: process.env.JWT_SECRET as string,
    cors: process.env.CORS as string,
    db: {
        enableSQL: (process.env.ENABLE_SQL as string == 'TRUE') ? true : false,
        enableMongo: (process.env.ENABLE_MONGO as string == 'TRUE') ? true : false,
        // Cấu Hình SQL
        host: process.env.DB_HOST as string,
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USERNAME as string,
        password: process.env.DB_PASSWORD as string,
        database: process.env.DB_NAME as string,
        dialect: process.env.DB_DIALECT as "mysql" | "postgres" | "sqlite" | "mssql",
        // Cấu Hình
        mongo_host: process.env.MONGO_HOST as string,
        mongo_port: Number(process.env.MONGO_PORT) || 27017,
        mongo_username: process.env.MONGO_USERNAME as string,
        mongo_password: process.env.MONGO_PASSWORD as string,
        mongo_name: process.env.MONGO_NAME as string,
    },
    urlLogin: process.env.URL_LOGIN || '',
    logDirectory: process.env.LOG_DIRECTORY || "logs",
    socket: {
        pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT) || 60000,
        pingInterval: Number(process.env.SOCKET_PING_INTERVAL) || 25000,
        cors: {
            origin: process.env.SOCKET_CORS_ORIGIN || "*",
            methods: ["GET", "POST"],
        },
    },
    mqtt: {
        host: process.env.BROKER_HOST as string || '127.0.0.1',
        port: process.env.BROKER_PORT as string || '18083',
        username: process.env.BROKER_USERNAME as string || 'admin',
        password: process.env.BROKER_PASSWORD as string || 'public',
        id: process.env.BROKER_ID as string || 'Server',
    },
    jobs:
    {
        cleanupInterval: Number(process.env.JOB_CLEANUP_INTERVAL) || 86400000, // 24h
    },
};
