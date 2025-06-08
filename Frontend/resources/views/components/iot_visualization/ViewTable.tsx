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

// Hàm stringToHex này không còn được sử dụng trực tiếp cho mục đích hiển thị data nữa,
// nhưng vẫn được giữ lại nếu có các logic khác cần đến nó trong tương lai.
// Nếu không, bạn có thể xóa nó hoàn toàn.
const stringToHex = (str: string) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
    }
    return hex.trim();
};

const ViewTable: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [allProcessedData, setAllProcessedData] = useState<any[]>([]);
    const [selectedCMD, setSelectedCMD] = useState<string | null>(null);

    const [columns, setColumns] = useState<any[]>([]);
    const [isColumnSettingsModalVisible, setIsColumnSettingsModalVisible] = useState(false);

    const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
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
        let currentData = allProcessedData;

        if (selectedCMD) {
            currentData = currentData.filter(row => row.CMD === selectedCMD);
        }

        currentData = currentData.filter(row => row.CMD && !row.CMD.toLowerCase().includes('notify'));

        return currentData;
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
            { title: "CMD", dataIndex: "CMD", key: "CMD", render: (text: string) => text.replace("CMD_", "") },
            ...Array.from(allPayloadNames).map(payloadName => ({
                title: payloadName.toUpperCase(),
                dataIndex: payloadName,
                key: payloadName,
                render: (value: any, record: any) => {
                    if (value === null || value === undefined) return "-";
                    if (typeof value === 'boolean') return value ? "True" : "False";

                    // === START REMOVED LOGIC ===
                    // // Logic mới: Chuyển đổi sang hex cho CMD_PUSH_TCP hoặc CMD_PUSH_UDP và payload_name là 'data'
                    // if (payloadName === 'data' && (record.CMD === 'CMD_PUSH_TCP' || record.CMD === 'CMD_PUSH_UDP')) {
                    //     if (typeof value === 'string') {
                    //         return `${value} / ${stringToHex(value)}`;
                    //     }
                    // }
                    // === END REMOVED LOGIC ===

                    if (payloadName === 'id' && typeof value === 'number' && String(value).length === 10) {
                        return moment.unix(value).format("HH:mm:ss.SSS");
                    }
                    return String(value); // Default rendering
                },
            })),
            { title: "Unit", dataIndex: "unit", key: "unit" },
            { title: "Time", dataIndex: "time", key: "time", render: (time: string) => (!time || time === "NaN:NaN:NaN.NaN") ? "-" : time }
        ];

        return generatedCols;
    }, [allProcessedData]);


    useEffect(() => {
        setColumns(dynamicColumns);

        setVisibleColumnKeys(() => {
            const newVisibleKeys = new Set<string>();
            dynamicColumns.forEach(col => {
                if (!hiddenColumnKeys.has(col.key)) {
                    newVisibleKeys.add(col.key);
                }
            });
            return newVisibleKeys;
        });
    }, [dynamicColumns, hiddenColumnKeys]);


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

        setHiddenColumnKeys(prevHiddenKeys => {
            const newHiddenKeys = new Set(prevHiddenKeys);
            if (checked) {
                newHiddenKeys.delete(key);
            } else {
                newHiddenKeys.add(key);
            }
            return newHiddenKeys;
        });
    }, []);

    const getRenderedColumns = useCallback(() => {
        return columns.filter(col => visibleColumnKeys.has(col.key));
    }, [columns, visibleColumnKeys]);

    const renderedColumns = getRenderedColumns();


    const uniqueCMDs = useMemo(() => {
        const cmds = new Set<string>();
        allProcessedData.forEach(row => {
            if (row.CMD && !row.CMD.toLowerCase().includes('notify')) {
                cmds.add(row.CMD);
            }
        });
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
                                {cmd.replace("CMD_", "")}
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