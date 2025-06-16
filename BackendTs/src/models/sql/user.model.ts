import { DataTypes, Model } from "sequelize";

class Users extends Model { }

export function initializeUsers(sequelizeInstance: any) {
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
            sequelize: sequelizeInstance,
            modelName: "users",
            timestamps: false,
        }
    );
    return Users;
}