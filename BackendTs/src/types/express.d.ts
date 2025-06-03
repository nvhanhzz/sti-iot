import { JwtPayload } from "jsonwebtoken";
import express from "express";
declare module "express" {
    export interface Request {
        user?: JwtPayload;
        page?: Number;
    }
}