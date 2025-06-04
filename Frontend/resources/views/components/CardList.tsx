// src/resources/views/components/CardList.tsx
import React, { useState } from "react";
import { Row, Button, Modal, InputNumber, Slider } from "antd"; // Import các component Ant Design cần thiết
import IotCard from "./IotCard"; // Import component IotCard mới

interface DataIotsProps {
    dataIots: any[];
    onUpdateDeviceType?: (deviceId: number, newType: number) => void; // Callback để cập nhật type
}

const CardList: React.FC<DataIotsProps> = ({ dataIots, onUpdateDeviceType }) => {
    const [cardCount, setCardCount] = useState<number>(5);
    const [colsPerRow, setColsPerRow] = useState<number>(1);
    const [titleFontSize, setTitleFontSize] = useState<number>(16);
    const [contentFontSize, setContentFontSize] = useState<number>(14);
    const [maxHeightSettings, setMaxHeightSettings] = useState<number>(500);
    const [minHeightSettings, setMinHeightSettings] = useState<number>(260);
    const [isSettingMode, setIsSettingMode] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const handleOk = () => {
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div
            style={{
                padding: 20,
                transition: "transform 0.3s",
                transform: isFullscreen ? "scale(1)" : "scale(1.0)",
                height: isFullscreen ? "100vh" : "auto",
                overflow: isFullscreen ? "hidden" : "auto",
            }}
        >
            {!isFullscreen && (
                <>
                    <Button
                        type="primary"
                        onClick={() => setIsModalVisible(true)}
                        style={{ marginBottom: 20 }}
                    >
                        Mở Cài Đặt
                    </Button>
                    <Button
                        type="default"
                        onClick={() => setIsSettingMode(!isSettingMode)}
                        style={{ marginBottom: 20, marginLeft: 10 }}
                    >
                        {isSettingMode ? "Chuyển sang Hiển Thị" : "Chuyển sang Cài Đặt"}
                    </Button>
                    <Button
                        type="default"
                        onClick={toggleFullscreen}
                        style={{ marginBottom: 20, marginLeft: 10 }}
                    >
                        {isFullscreen ? "Thoát Phóng to" : "Phóng to Màn hình"}
                    </Button>
                </>
            )}

            {/* Modal Cài Đặt Layout (giữ nguyên) */}
            <Modal
                title="Cài Đặt Giao Diện"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width={400}
            >
                <div style={{ marginBottom: 10 }}>
                    <label>Số lượng Card:</label>
                    <InputNumber min={1} max={20} value={cardCount} onChange={(value) => setCardCount(value ?? 1)} style={{ marginLeft: 10, width: 100 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Số card trên 1 dòng:</label>
                    <Slider min={1} max={6} value={colsPerRow} onChange={setColsPerRow} style={{ width: 200, marginLeft: 10 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Font Size Title:</label>
                    <Slider min={10} max={24} value={titleFontSize} onChange={setTitleFontSize} style={{ width: 200, marginLeft: 10 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Font Size Nội Dung:</label>
                    <Slider min={10} max={24} value={contentFontSize} onChange={setContentFontSize} style={{ width: 200, marginLeft: 10 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Độ Dài Max Của Thẻ:</label>
                    <Slider min={0} max={600} value={maxHeightSettings} onChange={setMaxHeightSettings} style={{ width: 200, marginLeft: 10 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Độ Dài Min Của Thẻ:</label>
                    <Slider min={0} max={600} value={minHeightSettings} onChange={setMinHeightSettings} style={{ width: 200, marginLeft: 10 }} />
                </div>
            </Modal>

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
                        onUpdateDeviceType={onUpdateDeviceType || (() => {})} // Đảm bảo luôn có callback
                    />
                ))}
            </Row>
        </div>
    );
};

export default CardList;