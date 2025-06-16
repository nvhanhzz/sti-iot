import { DataTypes, Model } from "sequelize";
const { BIGINT, INTEGER, STRING, DATE, BOOLEAN } = DataTypes;

class IotCmd extends Model { }

export function initializeIotCmd(sequelizeInstance: any) {
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
            sequelize: sequelizeInstance,
            modelName: "master_iot_cmd",
            tableName: "master_iot_cmd",
            timestamps: true,
            createdAt: 'time_created',
            updatedAt: 'time_updated'
        }
    );
    return IotCmd;
}