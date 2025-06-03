import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/db.config";

const { BIGINT, INTEGER, STRING, DATE, BOOLEAN } = DataTypes;

class PayloadType extends Model { }

PayloadType.init(
    {
        id: { type: BIGINT, autoIncrement: true, primaryKey: true, },
        name: { type: STRING, allowNull: true, },
        hex_symbols: { type: STRING, allowNull: true, },
        decriptions: { type: STRING, allowNull: true, },
        js_type: { type: STRING, allowNull: true, },
        note: { type: STRING, allowNull: true, },
        user_created: { type: BIGINT, allowNull: true, },
        time_created: { type: DATE, allowNull: true, },
        user_updated: { type: BIGINT, allowNull: true, },
        time_updated: { type: DATE, allowNull: true, },
        isdelete: { type: BOOLEAN, allowNull: true, defaultValue: 0 },
    },
    {
        sequelize,
        modelName: "master_payload_type",
        tableName: "master_payload_type",
        timestamps: true,
        createdAt: 'time_created',
        updatedAt: 'time_updated'
    }
);

export default PayloadType;