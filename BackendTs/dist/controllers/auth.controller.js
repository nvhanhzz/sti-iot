"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const jwt_config_1 = require("../config/jwt.config");
const login = (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "password") {
        res.json({ token: (0, jwt_config_1.generateToken)({ username }) });
        return;
    }
    res.status(401).json({ message: "Invalid credentials" });
};
exports.login = login;
const register = (req, res) => {
    res.json({ message: "Register endpoint (mock)" });
};
exports.register = register;
