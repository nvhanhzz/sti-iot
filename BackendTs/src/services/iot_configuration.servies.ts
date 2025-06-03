import IotConfiguration from "../models/sql/iot_configuration.models";

export const GetDataIotConfigurationWithParams = async (params: any) => {
    try {
        const iots = await IotConfiguration.findAll({
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
        let findOne = await IotConfiguration.findOne({
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
        await IotConfiguration.create(data);
        return true;
    } catch (error) {
        console.error("Error fetching distinct data:", error);
        throw error;
    }
};

export const UpdateDataIotConfiguration = async (data: any, condition: any) => {
    try {
        await IotConfiguration.update(
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


