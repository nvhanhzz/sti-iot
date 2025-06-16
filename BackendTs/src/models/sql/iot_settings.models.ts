import { DataTypes, Model } from "sequelize";
const { BIGINT, INTEGER, STRING, DATE, BOOLEAN } = DataTypes;

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

            wifi_ssid: {type: STRING, allowNull: true},
            wifi_password: {type: STRING, allowNull: true},
            wifi_ip: {type: STRING, allowNull: true},
            wifi_gateway: {type: STRING, allowNull: true},
            wifi_subnet: {type: STRING, allowNull: true},
            wifi_dns: {type: STRING, allowNull: true},

            ethernet_ip: {type: STRING, allowNull: true},
            ethernet_gateway: {type: STRING, allowNull: true},
            ethernet_subnet: {type: STRING, allowNull: true},
            ethernet_mac: {type: STRING, allowNull: true},
            ethernet_dns: {type: STRING, allowNull: true},

            mqtt_mac: { type: STRING, allowNull: true },
            mqtt_ip: { type: STRING, allowNull: true },
            mqtt_gateway: { type: STRING, allowNull: true },
            mqtt_subnet: { type: STRING, allowNull: true },
            mqtt_dns: { type: STRING, allowNull: true },

            rs485_id: { type: INTEGER, allowNull: true },
            rs485_addresses: { type: STRING, allowNull: true },
            rs485_baudrate: { type: INTEGER, allowNull: true },
            rs485_serial_config: { type: STRING, allowNull: true },

            can_baudrate: { type: INTEGER, allowNull: true },

            rs232_baudrate: { type: INTEGER, allowNull: true },
            rs232_serial_config: { type: STRING, allowNull: true },

            firmware_version_id: {
                type: INTEGER,
                allowNull: true,
                comment: 'Foreign key to firmware_versions table'
            },
        },
        {
            sequelize: sequelizeInstance, // Sử dụng instance được truyền vào
            modelName: "master_iot",
            tableName: "master_iot",
            timestamps: true,
            createdAt: 'time_created',
            updatedAt: 'time_updated'
        }
    );
    return IotSettings;
}