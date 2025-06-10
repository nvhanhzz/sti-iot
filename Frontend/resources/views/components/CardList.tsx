// src/resources/views/components/CardList.tsx
import React from "react";
import { Row } from "antd"; // Chỉ giữ lại Row từ Ant Design
import IotCard from "./IotCard"; // Import component IotCard

interface DataIotsProps {
    dataIots: any[];
    onUpdateDeviceType?: (deviceId: number, newType: number) => void; // Callback để cập nhật type
}

const CardList: React.FC<DataIotsProps> = ({ dataIots }) => {
    // Giá trị cố định hoặc có thể truyền từ component cha nếu cần tùy chỉnh
    const cardCount: number = 5; // Số lượng card hiển thị cố định
    const colsPerRow: number = 1; // Số card trên mỗi dòng cố định
    const titleFontSize: number = 17; // Cỡ chữ tiêu đề cố định
    const contentFontSize: number = 14; // Cỡ chữ nội dung cố định
    const maxHeightSettings: number = 500; // Chiều cao tối đa của thẻ cố định
    const minHeightSettings: number = 260; // Chiều cao tối thiểu của thẻ cố định
    const isSettingMode: boolean = true; // Chế độ cài đặt cố định (true nếu bạn muốn IotCard hiển thị các tùy chọn cài đặt)

    return (
        <div>
            <Row gutter={[16, 16]}>
                {dataIots && dataIots.length > 0 && dataIots.slice(0, cardCount).map((item: any, index: number) => (
                    <IotCard
                        key={item.id || index} // Rất quan trọng: dùng item.id làm key duy nhất
                        item={item}
                        colsPerRow={colsPerRow}
                        titleFontSize={titleFontSize}
                        contentFontSize={contentFontSize}
                        maxHeightSettings={maxHeightSettings}
                        minHeightSettings={minHeightSettings}
                        isSettingMode={isSettingMode}
                    />
                ))}
            </Row>
        </div>
    );
};

export default CardList;