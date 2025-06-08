import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/db.config";
import IotConfiguration from "./iot_configuration.models";
const { BIGINT, INTEGER, STRING, DATE, BOOLEAN } = DataTypes;

class IotSettings extends Model { }

IotSettings.init(
    {
        id: { type: BIGINT, autoIncrement: true, primaryKey: true, },
        name: { type: STRING, allowNull: true, },
        device_id: { type: STRING, allowNull: true, },
        mac: { type: STRING, allowNull: true, },
        ip: { type: STRING, allowNull: true, },
        type: { type: INTEGER, allowNull: true, },
        note: { type: STRING, allowNull: true, },
        user_created: { type: BIGINT, allowNull: true, },
        time_created: { type: DATE, allowNull: true, },
        user_updated: { type: BIGINT, allowNull: true, },
        time_updated: { type: DATE, allowNull: true, },
        isdelete: { type: BOOLEAN, allowNull: true, defaultValue: 0 },
        // Các trường mới cho trạng thái TCP và UDP
        tcp_status: {
            type: DataTypes.ENUM('requestOpen', 'opened', 'requestClose', 'closed'),
            allowNull: true,
        },
        udp_status: {
            type: DataTypes.ENUM('requestOpen', 'opened', 'requestClose', 'closed'),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "master_iot",
        tableName: "master_iot",
        timestamps: true,
        createdAt: 'time_created',
        updatedAt: 'time_updated'
    }
);
IotSettings.hasOne(IotConfiguration, {
    as: 'configuration',
    sourceKey: 'id',
    foreignKey: 'iot_id'
})
export default IotSettings;