import { DataTypes, Model, Optional } from 'sequelize';
import { Sequelize } from 'sequelize';

interface FirmwareVersionAttributes {
    id: number;
    versionNumber: string;
    releaseDate: Date;
    downloadUrl?: string | null;
    description?: string | null;
}

interface FirmwareVersionCreationAttributes extends Optional<FirmwareVersionAttributes, 'id'> {}

// Định nghĩa class FirmwareVersion
class FirmwareVersion extends Model<FirmwareVersionAttributes, FirmwareVersionCreationAttributes> implements FirmwareVersionAttributes {
    public id!: number;
    public versionNumber!: string;
    public releaseDate!: Date;
    public downloadUrl?: string | null;
    public description?: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// Export một hàm để khởi tạo Model này, giống các file khác
export function initializeFirmwareVersion(sequelizeInstance: Sequelize) {
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
        sequelize: sequelizeInstance, // Sử dụng instance được truyền vào
        modelName: 'FirmwareVersion',
    });
    return FirmwareVersion; // Trả về model đã được khởi tạo
}

// Không export default FirmwareVersion CHƯA được khởi tạo