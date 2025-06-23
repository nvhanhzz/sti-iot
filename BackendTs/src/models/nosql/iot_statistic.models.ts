import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IIotStatistic extends Document {
    deviceId: string;
    cmd: string;
    isMissed: boolean;
    timestamp: number;
    messageId?: number;
    [key: string]: any;
}

const iotStatisticSchema = new Schema<IIotStatistic>({
    deviceId: { type: String, required: true },
    cmd: { type: String, required: true },
    isMissed: { type: Boolean, default: false },
    timestamp: { type: Number, required: true },
    messageId: { type: Number, required: false },
}, { strict: false });

iotStatisticSchema.index(
    { messageId: 1, deviceId: 1, timestamp: 1 },
    { unique: true, partialFilterExpression: { messageId: { $exists: true } } }
);
iotStatisticSchema.index({ timestamp: -1, _id: -1 });
iotStatisticSchema.index({ deviceId: 1, timestamp: -1, _id: -1 });
iotStatisticSchema.index({ cmd: 1, timestamp: -1, _id: -1 });
iotStatisticSchema.index({ deviceId: 1 });
iotStatisticSchema.index({ cmd: 1 });

const IotStatistic: Model<IIotStatistic> = mongoose.model<IIotStatistic>('iot_statistic', iotStatisticSchema);

export default IotStatistic;