import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/db.config";
import IotCmdField from "./iot_cmd_field.model";
const { BIGINT, INTEGER, STRING, DATE, BOOLEAN } = DataTypes;

class IotCmd extends Model { }

IotCmd.init(
    {
        id: { type: BIGINT, autoIncrement: true, primaryKey: true, },
        name: { type: STRING, allowNull: true, },
        hex_symbols: { type: STRING, allowNull: true, },
        decriptions: { type: STRING, allowNull: true, },
        type: { type: INTEGER, allowNull: true, },
        note: { type: STRING, allowNull: true, },
        user_created: { type: BIGINT, allowNull: true, },
        time_created: { type: DATE, allowNull: true, },
        user_updated: { type: BIGINT, allowNull: true, },
        time_updated: { type: DATE, allowNull: true, },
        isdelete: { type: BOOLEAN, allowNull: true, defaultValue: 0 },
    },
    {
        sequelize,
        modelName: "master_iot_cmd",
        tableName: "master_iot_cmd",
        timestamps: true,
        createdAt: 'time_created',
        updatedAt: 'time_updated'
    }
);

IotCmd.hasMany(IotCmdField, {
    as: 'iot_cmd_field',
    sourceKey: 'id',
    foreignKey: 'cmd_id'
})

export default IotCmd;