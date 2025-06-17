import { DataTypes, Model } from "sequelize";
const { BIGINT, INTEGER, STRING, DATE, BOOLEAN, JSON } = DataTypes;

class IotSettings extends Model { }

export function initializeIotSettings(sequelizeInstance: any) {
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
            tcp_status: {
                type: DataTypes.ENUM('requestOpen', 'opened', 'requestClose', 'closed'),
                allowNull: true,
            },
            udp_status: {
                type: DataTypes.ENUM('requestOpen', 'opened', 'requestClose', 'closed'),
                allowNull: true,
            },

            // Cấu hình Wi-Fi gộp vào một trường JSON
            wifiConfig: {
                type: JSON,
                allowNull: true,
                comment: 'Cấu hình Wi-Fi (SSID, Password, IP, Gateway, Subnet, DNS)'
            },

            // Cấu hình Ethernet gộp vào một trường JSON
            ethernetConfig: {
                type: JSON,
                allowNull: true,
                comment: 'Cấu hình Ethernet (MAC, IP, Gateway, Subnet, DNS)'
            },

            // Cấu hình MQTT gộp vào một trường JSON
            mqttConfig: {
                type: JSON,
                allowNull: true,
                comment: 'Cấu hình MQTT (SERVER, PORT, USER, PW, SUBTOPIC, PUBTOPIC, QoS, keepAlive)'
            },

            rs485Config: {
                type: JSON,
                allowNull: true,
                comment: 'Cấu hình RS485 (baudrate, serialConfig, ID, Address)'
            },

            tcpConfig: {
                type: JSON,
                allowNull: true,
            },

            canConfig: {
                type: JSON,
                allowNull: true,
                comment: 'Cấu hình can'
            },

            // Cấu hình RS232 gộp vào một trường JSON
            rs232Config: {
                type: JSON,
                allowNull: true,
                comment: 'Cấu hình RS232 (baudrate, serialConfig, ID, Address)'
            },

            firmware_version_id: {
                type: INTEGER,
                allowNull: true,
                comment: 'Foreign key to firmware_versions table'
            },
        },
        {
            sequelize: sequelizeInstance,
            modelName: "master_iot",
            tableName: "master_iot",
            timestamps: true,
            createdAt: 'time_created',
            updatedAt: 'time_updated'
        }
    );
    return IotSettings;
}