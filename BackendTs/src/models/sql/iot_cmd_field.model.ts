import { DataTypes, Model } from "sequelize";
const { BIGINT, INTEGER, STRING, DATE, BOOLEAN } = DataTypes;

class IotCmdField extends Model { }

export function initializeIotCmdField(sequelizeInstance: any) {
    IotCmdField.init(
        {
            id: { type: BIGINT, autoIncrement: true, primaryKey: true, },
            cmd_id: { type: BIGINT, allowNull: true, },
            name: { type: STRING, allowNull: true, },
            decriptions: { type: STRING, allowNull: true, },
            unit: { type: STRING, allowNull: true, },
            isdelete: { type: BOOLEAN, allowNull: false, defaultValue: 0 },
        },
        {
            sequelize: sequelizeInstance,
            modelName: "master_cmd_field",
            tableName: "master_cmd_field",
            timestamps: false
        }
    );
    return IotCmdField;
}