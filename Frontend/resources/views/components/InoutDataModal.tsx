import React, { useEffect, useState, useCallback } from "react";
import { Modal, Typography, Button, Checkbox, Select, Flex } from "antd";
import { useSocket } from "../../../context/SocketContext";
import IotService from "../../../services/IotService";

const { Title } = Typography;

interface InOutItem {
    id: number;
    name: string;
    quantity: number;
    status: "in" | "out";
    type: 1 | 2;
}

interface InOutModalProps {
    visible: boolean;
    onClose: () => void;
}

const InoutDataModal: React.FC<InOutModalProps> = ({ visible, onClose }) => {
    const [data, setData] = useState<InOutItem[]>([]);
    const [deviceSelect, setDeviceSelect] = useState<string[]>([]);
    const [viewCheck, setViewCheck] = useState<number[]>([1, 2]);
    const [dataIots, setDataIots] = useState<{ value: string; label: string }[]>([]);
    const socket = useSocket();
    const fetchData = useCallback(async () => {
        try {
            const response: any = await IotService.GetDataIots({});
            setDataIots(response.data.map((dat: any) => ({ value: dat.mac, label: dat.device_id })));
        } catch (error) {
            console.error(error);
        }
    }, []);
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    const handleSocketData = useCallback((dataMsg: InOutItem) => {
        setData((prev) => {
            const updatedData = [dataMsg, ...prev].filter((item) =>
                deviceSelect.length === 0 || deviceSelect.includes(item.name)
            );
            return updatedData;
        });
    }, [deviceSelect]);

    useEffect(() => {
        socket.on("iot_send_data", handleSocketData);
        return () => {
            socket.off("iot_send_data", handleSocketData);
        };
    }, [socket, handleSocketData]);

    const filteredData = (type: number, status: "in" | "out") =>
        data.filter((item) => item.type === type && item.status === status);

    const DataView = ({ type }: { type: 1 | 2 }) => (
        viewCheck.includes(type) && (
            <>
                {["in", "out"].map((status, idx) => (
                    <div key={idx}>
                        <Title level={4} style={{ textAlign: "center", color: status === "in" ? "green" : "red" }}>
                            MQTT ({status.toUpperCase()} - {type === 1 ? "Dữ Liệu HEX" : "Dữ Liệu JSON"})
                        </Title>
                        <div style={{
                            background: "#f6f8fa",
                            padding: "10px",
                            borderRadius: "5px",
                            maxHeight: "400px",
                            overflowY: "auto",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}>
                            <pre>{JSON.stringify(filteredData(type, status as "in" | "out"), null, 2)}</pre>
                        </div>
                    </div>
                ))}
            </>
        )
    );

    return (
        <Modal title="Thông Tin In/Out" style={{ top: 20 }} open={visible} onCancel={onClose} footer={null} width="70%">
            <Flex gap="middle" wrap>
                <Button type="dashed" onClick={() => setData([])}>Tải Lại</Button>
                <Select style={{ width: 240 }} mode="multiple" options={dataIots} onChange={setDeviceSelect} />
                <Checkbox.Group
                    options={[
                        { label: "Dữ Liệu HEX", value: 1 },
                        { label: "Dữ Liệu JSON", value: 2 },
                    ]}
                    defaultValue={viewCheck}
                    onChange={(values) => setViewCheck(values as number[])}
                />
            </Flex>
            <hr />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                <DataView type={1} />
                <DataView type={2} />
            </div>
        </Modal>
    );
};

export default InoutDataModal;
