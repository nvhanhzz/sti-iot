import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "./index";

export const generateToken = (user: object): string => jwt.sign(user, config.jwtSecret, { expiresIn: "1h" });
export const verifyToken = (token: string): JwtPayload | null => {
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        return typeof decoded === "string" ? null : decoded;
    } catch (error) {
        return null;
    }
};
