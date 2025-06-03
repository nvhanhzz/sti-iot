import IotSettings from "../models/sql/iot_settings.models";
import { Op, Sequelize } from "sequelize";
import { Request } from "express";

export const GetDataIot = async (req: Request) => {
    try {
        const { page, limit_page, name, hex_symbols, type } = req.method === 'GET' ? req.query : req.body;
        const pageNumber = page ? parseInt(page as string, 10) : 1;
        const limit = limit_page ? parseInt(limit_page as string, 10) : 999999;
        const offset = (pageNumber - 1) * limit;
        const nameFilter = name ? (Array.isArray(name) ? name : [name]) : [];
        const hex_symbolsFilter = hex_symbols ? (Array.isArray(hex_symbols) ? hex_symbols : [hex_symbols]) : [];
        const typeFilter = type ? (Array.isArray(type) ? type : [type]) : [];

        const { count, rows } = await IotSettings.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [["time_updated", "DESC"]],
            where: {
                ...(nameFilter.length > 0 && { name: { [Op.in]: nameFilter } }),
                ...(hex_symbolsFilter.length > 0 && { hex_symbols: { [Op.in]: hex_symbolsFilter } }),
                ...(typeFilter.length > 0 && { type: { [Op.in]: typeFilter } }),
            },
        });
        return {
            listIots: rows,
            totalRecords: count,
        };
    } catch (error) {
        console.error("Error fetching schedule MasterHoliday:", error);
    }
};

export const DistinctDataIot = async (req: any) => {
    try {
        const { page, limit_page = 10, columns, value } = req.query;
        const offset = (page - 1) * limit_page;
        const whereCondition: any = { isdelete: false };
        if (value) {
            whereCondition[Op.or] = columns.map((col: string) => ({
                [col]: { [Op.like]: `%${value}%` }
            }));
        }
        const attributes: any[] = ['id', ...columns.map((col: string) => [Sequelize.col(col), 'column_name'])];
        const { count, rows } = await IotSettings.findAndCountAll({
            limit: limit_page,
            offset: offset,
            order: [['time_updated', 'DESC']],
            attributes,
            distinct: true,
            where: whereCondition
        });
        const last_page = Math.ceil(count / limit_page);
        return {
            listData: rows,
            pagination: {
                current_page: page,
                last_page,
            },
        };
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const GetDataIotWithParams = async (params: any) => {
    try {
        const iots = await IotSettings.findAll({
            where: params,
        });
        return {
            status: true,
            data: iots
        };
    } catch (error) {
        return {
            status: false,
            msg: error
        };
    }
};

export const FindOneData = async (condition: any) => {
    try {
        let findOne = await IotSettings.findOne({
            where: condition
        });
        return findOne;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const CreateData = async (data: any) => {
    try {
        const dataNew = await IotSettings.create(data);
        return dataNew;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const UpdateData = async (data: any, condition: any) => {
    try {
        const dataNew = await IotSettings.update(
            data,
            {
                where: condition
            }
        );
        return dataNew;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};