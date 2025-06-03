import PayloadType from "../models/sql/payload_type.models";
import { Request } from "express";
import { Op, Sequelize } from "sequelize";

export const GetDataPayloadTypeWithParams = async (params: any) => {
    try {
        const payload_type = await PayloadType.findAll({
            where: params
        });

        return {
            status: true,
            data: payload_type
        };
    } catch (error) {
        return {
            status: false,
            msg: error
        };
    }
};

export const FindOneDataPayloadType = async (condition: any) => {
    try {
        // let findOne = await PayloadType.findOne({
        //     where: condition
        // });
        let findOne = await PayloadType.findOne(condition);
        return findOne;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const CreateDataPayloadType = async (data: any) => {
    try {
        const dataNew = await PayloadType.create(data);
        return dataNew;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const UpdateDataPayloadType = async (data: any, condition: any) => {
    try {
        return await PayloadType.update(
            data,
            // {
            //     where: condition
            // }
            condition
        )
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const GetDataPayloadType = async (req: Request) => {
    try {
        const { page, limit_page, name, js_type, hex_symbols } = req.method === 'GET' ? req.query : req.body;
        // console.log(req.method);
        const pageNumber = page ? parseInt(page as string, 10) : 1;
        const limit = limit_page ? parseInt(limit_page as string, 10) : 999999;
        const offset = (pageNumber - 1) * limit;
        const nameFilter = name ? (Array.isArray(name) ? name : [name]) : [];
        const js_typeFilter = js_type ? (Array.isArray(js_type) ? js_type : [js_type]) : [];
        const hex_symbolsFilter = hex_symbols ? (Array.isArray(hex_symbols) ? hex_symbols : [hex_symbols]) : [];

        const { count, rows } = await PayloadType.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [["time_updated", "DESC"]],
            where: {
                // isdelete: false,
                ...(nameFilter.length > 0 && { name: { [Op.in]: nameFilter } }),
                ...(hex_symbolsFilter.length > 0 && { hex_symbols: { [Op.in]: hex_symbolsFilter } }),
                ...(js_typeFilter.length > 0 && { js_type: { [Op.in]: js_typeFilter } }),
            },
            // include: [
            //     {
            //         association: "user_create",
            //         attributes: ["id", "username"],
            //     },
            //     {
            //         association: "user_update",
            //         attributes: ["id", "username"],
            //     },
            // ],
        });
        return {
            listPayloadType: rows,
            totalRecords: count,
        };
    } catch (error) {
        console.error("Error fetching schedule MasterHoliday:", error);
    }
};

export const DistinctDataPayloadType = async (req: any) => {
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
        const { count, rows } = await PayloadType.findAndCountAll({
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