import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/jwt.config";
export default (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const decoded = verifyToken(token);
    if (!decoded) {
        res.status(403).json({ message: "Invalid token" });
        return;
    }
    req.user = decoded;
    next();
};
