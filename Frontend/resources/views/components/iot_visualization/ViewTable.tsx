import React, { useEffect, useState, useCallback, useMemo } from "react";
import moment from "moment";
import { Button, Checkbox, Modal, Space, Select } from "antd";
import { SettingOutlined, FilterOutlined } from '@ant-design/icons';

const { Option } = Select;

interface ConfigIotsProps {
    dataIotsDetail: any;
    dataOnEvent: any;
    settings: boolean;
}

const ViewTable: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [allProcessedData, setAllProcessedData] = useState<any[]>([]);
    const [selectedCMD, setSelectedCMD] = useState<string | null>(null);

    const [columns, setColumns] = useState<any[]>([]);
    const [isColumnSettingsModalVisible, setIsColumnSettingsModalVisible] = useState(false);

    // State để lưu các cột đã bị ẩn
    const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
    // visibleColumnKeys không cần là state riêng nữa, có thể tính toán trong useEffect hoặc useMemo
    // Tuy nhiên, việc giữ nó là state và cập nhật nó thông qua useEffect là một cách hợp lệ
    const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(new Set());


    useEffect(() => {
        try {
            if (dataIotsDetail.data && Array.isArray(dataIotsDetail.data)) {
                const groupedData = dataIotsDetail.data.reduce((acc: any, item: any) => {
                    const cmdKey = item.CMD;
                    if (!acc[cmdKey]) {
                        acc[cmdKey] = {
                            key: cmdKey,
                            CMD: cmdKey,
                            CMD_Decriptions: item.CMD_Decriptions,
                            unit: item.unit,
                            time: item.time
                        };
                    }
                    acc[cmdKey][item.payload_name] = item.data;
                    return acc;
                }, {});
                setAllProcessedData(Object.values(groupedData));
            } else {
                setAllProcessedData([]);
            }
        } catch (error) {
            console.error("Lỗi khi xử lý data trong useEffect của ViewTable:", error);
            setAllProcessedData([]);
        }
    }, [dataIotsDetail]);


    const filteredData = useMemo(() => {
        if (!selectedCMD) {
            return allProcessedData;
        }
        return allProcessedData.filter(row => row.CMD === selectedCMD);
    }, [allProcessedData, selectedCMD]);


    const dynamicColumns = useMemo(() => {
        const allPayloadNames = new Set<string>();
        allProcessedData.forEach((row: any) => {
            for (const key in row) {
                if (key !== 'key' && key !== 'CMD' && key !== 'CMD_Decriptions' && key !== 'unit' && key !== 'time' && row.hasOwnProperty(key)) {
                    allPayloadNames.add(key);
                }
            }
        });

        const generatedCols = [
            { title: "CMD", dataIndex: "CMD", key: "CMD", render: (text: string) => text.replace("CMD_", "").replace("PUSH_", "") },
            ...Array.from(allPayloadNames).map(payloadName => ({
                title: payloadName.toUpperCase(),
                dataIndex: payloadName,
                key: payloadName,
                render: (value: any) => {
                    if (value === null || value === undefined) return "-";
                    if (typeof value === 'boolean') return value ? "True" : "False";
                    if (payloadName === 'id' && typeof value === 'number' && String(value).length === 10) {
                        return moment.unix(value).format("HH:mm:ss.SSS");
                    }
                    return String(value);
                },
            })),
            { title: "Unit", dataIndex: "unit", key: "unit" },
            { title: "Time", dataIndex: "time", key: "time", render: (time: string) => (!time || time === "NaN:NaN:NaN.NaN") ? "-" : time }
        ];

        return generatedCols;
    }, [allProcessedData]);


    // --- SỬA ĐỔI ĐOẠN CODE GÂY LỖI TS2304 và TS7033 ---
    useEffect(() => {
        setColumns(dynamicColumns); // columns luôn lưu tất cả các cột tiềm năng

        setVisibleColumnKeys(() => { // KHÔNG CẦN prevVisibleKeys ở đây vì chúng ta đang TÍNH TOÁN LẠI hoàn toàn
            const newVisibleKeys = new Set<string>();
            dynamicColumns.forEach(col => {
                if (!hiddenColumnKeys.has(col.key)) {
                    newVisibleKeys.add(col.key);
                }
            });
            return newVisibleKeys;
        });
    }, [dynamicColumns, hiddenColumnKeys]); // Phụ thuộc vào dynamicColumns và hiddenColumnKeys


    // Hàm xử lý khi checkbox ẩn/hiện cột thay đổi (giữ nguyên)
    const handleColumnVisibilityChange = useCallback((key: string, checked: boolean) => {
        setVisibleColumnKeys(prevVisibleKeys => {
            const newVisibleKeys = new Set(prevVisibleKeys);
            if (checked) {
                newVisibleKeys.add(key);
            } else {
                newVisibleKeys.delete(key);
            }
            return newVisibleKeys;
        });

        // Cập nhật hiddenColumnKeys
        setHiddenColumnKeys(prevHiddenKeys => {
            const newHiddenKeys = new Set(prevHiddenKeys);
            if (checked) {
                newHiddenKeys.delete(key);
            } else {
                newHiddenKeys.add(key);
            }
            return newHiddenKeys;
        });
    }, []); // Không còn lỗi TS2304/TS7033 ở đây vì logic đúng rồi

    const getRenderedColumns = useCallback(() => {
        return columns.filter(col => visibleColumnKeys.has(col.key));
    }, [columns, visibleColumnKeys]);

    const renderedColumns = getRenderedColumns();


    const uniqueCMDs = useMemo(() => {
        const cmds = new Set<string>();
        allProcessedData.forEach(row => cmds.add(row.CMD));
        return Array.from(cmds);
    }, [allProcessedData]);


    return (
        <div style={{
            overflowX: 'auto',
            width: '100%',
        }}>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <Space>
                    <FilterOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
                    <Select
                        placeholder="Lọc theo CMD"
                        style={{ width: 200 }}
                        allowClear
                        value={selectedCMD}
                        onChange={(value) => setSelectedCMD(value)}
                    >
                        {uniqueCMDs.map(cmd => (
                            <Option key={cmd} value={cmd}>
                                {cmd.replace("CMD_", "").replace("PUSH_", "")}
                            </Option>
                        ))}
                    </Select>
                </Space>

                <Button icon={<SettingOutlined />} onClick={() => setIsColumnSettingsModalVisible(true)}>
                    Cài đặt cột
                </Button>
            </div>

            <Modal
                title="Chọn cột hiển thị"
                open={isColumnSettingsModalVisible}
                onOk={() => setIsColumnSettingsModalVisible(false)}
                onCancel={() => setIsColumnSettingsModalVisible(false)}
                footer={[<Button key="close" onClick={() => setIsColumnSettingsModalVisible(false)}>Đóng</Button>]}
            >
                <Space direction="vertical">
                    {columns.map(col => (
                        <Checkbox
                            key={col.key}
                            checked={visibleColumnKeys.has(col.key)}
                            onChange={(e) => handleColumnVisibilityChange(col.key, e.target.checked)}
                        >
                            {col.title}
                        </Checkbox>
                    ))}
                </Space>
            </Modal>

            <table style={{
                width: 'auto',
                minWidth: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
            }}>
                <thead>
                <tr>
                    {renderedColumns.map((col: any) => (
                        <th key={col.key} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2', whiteSpace: 'nowrap', minWidth: col.width ? `${col.width}px` : undefined, }}>
                            {col.title}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {filteredData.map((row: any, rowIndex: number) => (
                    <tr key={row.key} style={{ backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9', }}>
                        {renderedColumns.map((col: any) => {
                            const value = row[col.dataIndex];
                            const renderedValue = col.render ? col.render(value, row) : value;

                            return (
                                <td key={`${row.key}-${col.key}`} style={{
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    textAlign: 'left',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: (row.CMD && row.CMD.startsWith('CMD_INPUT_CHANNEL') && typeof value === 'boolean') ?
                                        (value ? '#e6ffe6' : '#ffe6e6') : (rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9'),
                                }}>
                                    {renderedValue !== undefined && renderedValue !== null ? String(renderedValue) : '-'}
                                </td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default ViewTable;