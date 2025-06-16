import { DataTypes, Model } from "sequelize";
const { BIGINT, INTEGER, STRING, DATE, BOOLEAN } = DataTypes;

class IotConfiguration extends Model { }

export function initializeIotConfiguration(sequelizeInstance: any) {
    IotConfiguration.init(
        {
            id: { type: BIGINT, autoIncrement: true, primaryKey: true, },
            iot_id: { type: BIGINT, allowNull: true, },
            layout: { type: INTEGER, allowNull: true, },
            cmd_data: { type: STRING, allowNull: true, },
            settings: { type: STRING, allowNull: true, },
        },
        {
            sequelize: sequelizeInstance,
            modelName: "iot_configuration",
            tableName: "iot_configuration",
            timestamps: false,
        }
    );
    return IotConfiguration;
}