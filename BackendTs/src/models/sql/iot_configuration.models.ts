import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/db.config";

const { BIGINT, INTEGER, STRING, DATE, BOOLEAN } = DataTypes;

class IotConfiguration extends Model { }

IotConfiguration.init(
    {
        id: { type: BIGINT, autoIncrement: true, primaryKey: true, },
        iot_id: { type: INTEGER, allowNull: true, },
        layout: { type: INTEGER, allowNull: true, },
        cmd_data: { type: STRING, allowNull: true, },
        settings: { type: STRING, allowNull: true, },
    },
    {
        sequelize,
        modelName: "iot_configuration",
        tableName: "iot_configuration",
        timestamps: false,
    }
);


export default IotConfiguration;