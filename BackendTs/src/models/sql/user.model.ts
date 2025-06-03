import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/db.config";


class Users extends Model { }

Users.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "users",
        timestamps: false, // Tắt timestamps
    }
);

export default Users;