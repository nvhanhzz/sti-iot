import { Sequelize } from "sequelize";
import { config } from "./index";
import { queryLogger } from "../config/logger/query.logger";
import mongoose from "mongoose";

export const sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    {
        host: config.db.host,
        port: config.db.port,
        dialect: config.db.dialect,
        timezone: "+07:00",
        // logging: (msg) => queryLogger.info(`SQL Query: ${msg}`),
    }
);
export const connectDatabases = async () => {
    if (config.db.enableSQL) {
        try {
            await sequelize.authenticate();
            queryLogger.info("MySQL Database connected");
        } catch (error) {
            queryLogger.error("MySQL connection error:", error);
            process.exit(1);
        }
    }
    if (config.db.enableMongo) {
        try {
            await mongoose.connect(
                `mongodb://${config.db.mongo_username}:${config.db.mongo_password}@${config.db.mongo_host}:${config.db.mongo_port}/${config.db.mongo_name}`,
                {
                    family: 4,
                    authSource: "admin",
                }
            );
            queryLogger.info("MongoDB connected");
            mongoose.set("debug", (collectionName, method, query, doc) => {
                queryLogger.info(
                    `MongoDB Query - Collection: ${collectionName}, Method: ${method}, Query: ${JSON.stringify(query)}, Doc: ${JSON.stringify(doc)}`
                );
            });
        } catch (error) {
            queryLogger.error("MongoDB connection error:", error);
            process.exit(1);
        }
    }
};