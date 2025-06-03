"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_config_1 = require("../config/jwt.config");
exports.default = (req, res, next) => {
    var _a;
    const token = (_a = req.headers["authorization"]) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const decoded = (0, jwt_config_1.verifyToken)(token);
    if (!decoded) {
        res.status(403).json({ message: "Invalid token" });
        return;
    }
    req.user = decoded;
    next();
};
