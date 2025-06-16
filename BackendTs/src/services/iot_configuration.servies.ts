import models from "../models/sql";

export const GetDataIotConfigurationWithParams = async (params: any) => {
    try {
        const iots = await models.IotConfiguration.findAll({ // Sử dụng models.IotConfiguration
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

export const FindOneDataIotConfiguration = async (condition: any) => {
    try {
        let findOne = await models.IotConfiguration.findOne({ // Sử dụng models.IotConfiguration
            where: condition
        });
        return findOne;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const CreateDataIotConfiguration = async (data: any) => {
    try {
        await models.IotConfiguration.create(data); // Sử dụng models.IotConfiguration
        return true;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const UpdateDataIotConfiguration = async (data: any, condition: any) => {
    try {
        await models.IotConfiguration.update( // Sử dụng models.IotConfiguration
            data,
            {
                where: condition
            }
        )
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};