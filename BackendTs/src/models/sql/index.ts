import { sequelize } from '../../config/db.config';

import { initializeIotSettings } from './iot_settings.models';
import { initializeFirmwareVersion } from './iot_firmware_version.models';
import { initializeIotCmdField } from './iot_cmd_field.model';
import { initializeIotCmd } from './iot_cmd.models';
import { initializeIotConfiguration } from './iot_configuration.models';
import { initializePayloadType } from './payload_type.models';
import { initializeUsers } from './user.model';

const db: any = {};

db.IotSettings = initializeIotSettings(sequelize);
db.FirmwareVersion = initializeFirmwareVersion(sequelize);
db.IotCmdField = initializeIotCmdField(sequelize);
db.IotCmd = initializeIotCmd(sequelize);
db.IotConfiguration = initializeIotConfiguration(sequelize);
db.PayloadType = initializePayloadType(sequelize);
db.Users = initializeUsers(sequelize);

db.IotSettings.hasOne(db.IotConfiguration, {
    as: 'configuration',
    sourceKey: 'id',
    foreignKey: 'iot_id'
});

db.IotSettings.belongsTo(db.FirmwareVersion, {
    as: 'firmware',
    foreignKey: 'firmware_version_id',
    targetKey: 'id'
});

db.IotCmd.hasMany(db.IotCmdField, {
    as: 'iot_cmd_field',
    sourceKey: 'id',
    foreignKey: 'cmd_id'
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize').Sequelize;

export default db;