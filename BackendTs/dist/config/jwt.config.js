"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("./index");
const generateToken = (user) => jsonwebtoken_1.default.sign(user, index_1.config.jwtSecret, { expiresIn: "1h" });
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, index_1.config.jwtSecret);
        return typeof decoded === "string" ? null : decoded;
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
