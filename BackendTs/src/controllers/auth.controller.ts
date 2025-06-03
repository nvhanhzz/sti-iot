import { NextFunction, Request, Response } from "express";
import { generateToken } from "../config/jwt.config";
import axios from "axios";
import { config } from "../config";

export const login = (req: Request, res: Response): void => {
    const { username, password } = req.body;
    if (username === "admin" && password === "password") {
        res.json({ token: generateToken({ username }) });
        return;
    }
    res.status(401).json({ message: "Invalid credentials" });
};

export const register = (req: Request, res: Response): void => {
    res.json({ message: "Register endpoint (mock)" });
};

export const checkTocken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.headers['authorization']) {
            const token = req.headers['authorization'].split(' ')[1];
            if (!token) {
                res.status(401).send({
                    message: 2
                });
            }
            await axios({
                method: 'get',
                url: `${config.urlLogin}/check-token`,
                data: {
                    token: token
                }
            })
                .then(function (response) {
                    req.user = response.data.decoded.userId;
                    next();
                }).catch(function (error) {
                    res.status(401).send({
                        message: 2
                    });
                });
        }
        else {
            res.status(401).send({
                message: 2
            });
        }
    }
    catch {
        res.status(500).send({
            message: 2
        });
    }
};
