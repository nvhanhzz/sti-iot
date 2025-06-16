import { Request } from "express";
import { Op, Sequelize } from "sequelize";
import models from "../models/sql";

export const GetDataIotCmdWithParams = async (params: any) => {
    try {
        const iot_cmd = await models.IotCmd.findAll({ // Sử dụng models.IotCmd
            where: params,
            include: [
                {
                    association: 'iot_cmd_field', // Tên association vẫn giữ nguyên
                    required: false,
                    where: {
                        isdelete: '0'
                    },
                    separate: true,
                    order: [['id', 'ASC']]
                }

            ],
        });
        return {
            status: true,
            data: iot_cmd
        };
    } catch (error) {
        return {
            status: false,
            msg: error
        };
    }
};

export const FindOneDataIotCmd = async (condition: any) => {
    try {
        let findOne: any = await models.IotCmd.findOne(condition); // Sử dụng models.IotCmd
        return findOne;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const CreateDataIotCmd = async (data: any) => {
    try {
        const dataNew = await models.IotCmd.create(data); // Sử dụng models.IotCmd
        return dataNew;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const UpdateDataIotCmd = async (data: any, condition: any) => {
    try {
        await models.IotCmd.update( // Sử dụng models.IotCmd
            data,
            condition
        )
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const GetDataIotCmd = async (req: Request) => {
    try {
        const { page, limit_page, name, hex_symbols, type } = req.method === 'GET' ? req.query : req.body;
        const pageNumber = page ? parseInt(page as string, 10) : 1;
        const limit = limit_page ? parseInt(limit_page as string, 10) : 999999;
        const offset = (pageNumber - 1) * limit;
        const nameFilter = name ? (Array.isArray(name) ? name : [name]) : [];
        const hex_symbolsFilter = hex_symbols ? (Array.isArray(hex_symbols) ? hex_symbols : [hex_symbols]) : [];
        const typeFilter = type ? (Array.isArray(type) ? type : [type]) : [];

        const { count, rows } = await models.IotCmd.findAndCountAll({ // Sử dụng models.IotCmd
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
            listIotCommands: rows,
            totalRecords: count,
        };
    } catch (error) {
        console.error("Error fetching schedule MasterHoliday:", error);
    }
};

export const DistinctDataIotCmd = async (req: any) => {
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
        const { count, rows } = await models.IotCmd.findAndCountAll({ // Sử dụng models.IotCmd
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

export const GetDataIotCmdField = async (req: Request) => {
    try {
        const { page, limit_page, cmd_id } = req.method === 'GET' ? req.query : req.body;
        const pageNumber = page ? parseInt(page as string, 10) : 1;
        const limit = limit_page ? parseInt(limit_page as string, 10) : 10;
        const offset = (pageNumber - 1) * limit;

        const { count, rows } = await models.IotCmdField.findAndCountAll({ // Sử dụng models.IotCmdField
            limit: limit,
            offset: offset,
            where: {
                cmd_id: cmd_id
            },
        });
        return {
            listIotCmdField: rows,
            totalRecords: count,
        };
    } catch (error) {
        console.error("Error fetching schedule MasterProduct:", error);
    }
};

export const UpdateDataIotCmdField = async (data: any, condition: any) => {
    try {
        await models.IotCmdField.update( // Sử dụng models.IotCmdField
            data,
            condition
        )
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const BulkCreateIotCmdFile = async (data: any) => {
    try {
        await models.IotCmdField.bulkCreate(data); // Sử dụng models.IotCmdField
        return true;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};