import mongoose, { Document, Schema, Model } from 'mongoose';

// 1. Định nghĩa Interface cho các trường cơ bản của tài liệu
// Kế thừa từ Document của Mongoose để bao gồm các thuộc tính như _id, __v
export interface IIotStatistic extends Document {
    deviceId: string;
    cmd: string;
    isMissing: boolean;
    timestamp: number; // Đổi kiểu dữ liệu của timestamp thành 'number'
    [key: string]: any; // Dòng này cho phép các trường không biết trước
}

// 2. Định nghĩa Mongoose Schema
const deviceDataSchema = new Schema<IIotStatistic>({
    deviceId: {
        type: String,
        required: true
    },
    cmd: {
        type: String,
        required: true,
    },
    isMissed: {
        type: Boolean,
        default: false,
    },
    timestamp: { // Định nghĩa trường timestamp
        type: Number,
        required: true,
    }
    // Các trường khác không cần định nghĩa ở đây nhờ 'strict: false'
    // và thuộc tính [key: string]: any; trong interface
}, { strict: false }); // 'strict: false' cho phép các trường không định nghĩa trước

// 3. (Tùy chọn) Thêm Index

// Nếu bạn thường xuyên truy vấn dữ liệu trong một khoảng thời gian cụ thể dựa trên Unix timestamp,
// việc thêm index cho trường timestamp là rất quan trọng để tăng hiệu suất.
//    deviceDataSchema.index({ timestamp: 1 });

// 4. Tạo Mongoose Model từ Schema
const IotStatistic: Model<IIotStatistic> = mongoose.model<IIotStatistic>('iot_statistic', deviceDataSchema);

export default IotStatistic;