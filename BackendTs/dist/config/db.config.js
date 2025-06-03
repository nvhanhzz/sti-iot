"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("./index");
const query_logger_1 = require("../config/logger/query.logger");
exports.sequelize = new sequelize_1.Sequelize(index_1.config.db.database, index_1.config.db.username, index_1.config.db.password, {
    host: index_1.config.db.host,
    port: index_1.config.db.port,
    dialect: index_1.config.db.dialect,
    logging: (msg) => query_logger_1.queryLogger.info(`SQL Query: ${msg}`),
});
