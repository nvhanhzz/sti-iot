import { DataTypes, Model, Optional } from 'sequelize';
import { Sequelize } from 'sequelize';

// Định nghĩa thuộc tính của FirmwareVersion
interface FirmwareVersionAttributes {
    id: number;
    versionNumber: string;
    releaseDate: Date;
    downloadUrl?: string | null; // Optional: có thể có hoặc không, hoặc là null
    description?: string | null; // Optional: có thể có hoặc không, hoặc là null
}

// Một số trường có thể là tùy chọn khi tạo một bản ghi mới (ví dụ: id sẽ được tự động tạo)
interface FirmwareVersionCreationAttributes extends Optional<FirmwareVersionAttributes, 'id'> {}

// Định nghĩa class FirmwareVersion mở rộng từ Model
export class FirmwareVersion extends Model<FirmwareVersionAttributes, FirmwareVersionCreationAttributes> implements FirmwareVersionAttributes {
    public id!: number;
    public versionNumber!: string;
    public releaseDate!: Date;
    public downloadUrl?: string | null;
    public description?: string | null;

    // `createdAt` và `updatedAt` được Sequelize tự động thêm vào
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Phương thức `init` để định nghĩa model
    static initialize(sequelize: Sequelize) {
        FirmwareVersion.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            versionNumber: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true,
                comment: 'Số phiên bản firmware',
            },
            releaseDate: {
                type: DataTypes.DATE,
                allowNull: false,
                comment: 'Ngày phát hành của phiên bản firmware',
            },
            downloadUrl: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Đường dẫn để tải file firmware',
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Mô tả chi tiết về firmware, các tính năng mới, sửa lỗi, cải tiến hiệu suất',
            },
        }, {
            tableName: 'firmware_versions',
            timestamps: true,
            underscored: true,
            comment: 'Bảng quản lý các phiên bản firmware',
            sequelize: sequelize, // Đối tượng Sequelize instance
            modelName: 'FirmwareVersion', // Tên model
        });
    }
}