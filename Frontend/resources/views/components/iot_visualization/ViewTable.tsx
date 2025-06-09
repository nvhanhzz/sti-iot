import React, { useEffect, useState, useCallback, useMemo } from "react";
import moment from "moment";
import { Button, Checkbox, Modal, Space, Select } from "antd";
import { SettingOutlined, FilterOutlined } from '@ant-design/icons';
import SpecificCMDTables from "./SpecificCMDTables";

// Hàm stringToHex
const stringToHex = (str: string) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
    }
    return hex.trim();
};

const { Option } = Select;

interface ConfigIotsProps {
    dataIotsDetail: any;
    dataOnEvent?: any;
    settings?: boolean;
}

interface TableColumn {
    title: string;
    dataIndex: string;
    key: string;
    render?: (value: any, record?: any, index?: number) => React.ReactNode;
    width?: number;
}

// Cấu hình các CMD đặc biệt
const SPECIFIC_CMD_TABLE_CONFIG = [
    { cmd: "CMD_PUSH_MODBUS_RS485", title: "Dữ liệu Modbus RS485", limit: 4 },
    { cmd: "CMD_PUSH_MODBUS_TCP", title: "Dữ liệu Modbus TCP", limit: 4 },
];

const ViewTable: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [allProcessedData, setAllProcessedData] = useState<any[]>([]);
    const [specificCMDsData, setSpecificCMDsData] = useState<{ [cmd: string]: any[] }>({});

    const [selectedCMD, setSelectedCMD] = useState<string[]>([]);
    const [columns, setColumns] = useState<TableColumn[]>([]);
    const [isColumnSettingsModalVisible, setIsColumnSettingsModalVisible] = useState(false);
    const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
    const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(new Set());

    const specialCMDsSet = useMemo(() => new Set(SPECIFIC_CMD_TABLE_CONFIG.map(c => c.cmd)), []);
    const specificCMDsLimits = useMemo(() => {
        const limits: { [cmd: string]: number } = {};
        SPECIFIC_CMD_TABLE_CONFIG.forEach(config => {
            limits[config.cmd] = config.limit;
        });
        return limits;
    }, []);

    useEffect(() => {
        if (!dataIotsDetail.data || !Array.isArray(dataIotsDetail.data) || dataIotsDetail.data.length === 0) {
            return;
        }

        const newIncomingRawData = [...dataIotsDetail.data];

        if (newIncomingRawData.length === 0) {
            return;
        }

        const currentAllProcessedData = [...allProcessedData];
        const currentSpecificCMDsData = Object.fromEntries(
            Object.entries(specificCMDsData).map(([cmd, records]) => [cmd, [...records]])
        );

        const newIncomingGroupedDataMap = new Map<string, any>();
        const newIncomingSpecificCMDsGroupedBatch = new Map<string, any>();

        const sortedNewIncomingData = [...newIncomingRawData].sort((a: any, b: any) => {
            const timeA = moment(a.time, "HH:mm:ss.SSS");
            const timeB = moment(b.time, "HH:mm:ss.SSS");
            if (timeA.isValid() && timeB.isValid()) {
                return timeB.diff(timeA);
            }
            return 0;
        });

        sortedNewIncomingData.forEach((item: any) => {
            if (specialCMDsSet.has(item.CMD)) {
                const groupKey = `${item.CMD}-${item.time}`;
                if (!newIncomingSpecificCMDsGroupedBatch.has(groupKey)) {
                    newIncomingSpecificCMDsGroupedBatch.set(groupKey, {
                        key: groupKey,
                        CMD: item.CMD,
                        CMD_Decriptions: item.CMD_Decriptions,
                        unit: item.unit,
                        time: item.time,
                    });
                }
                const currentGroup = newIncomingSpecificCMDsGroupedBatch.get(groupKey)!;
                currentGroup[item.payload_name] = item.data;
            } else {
                const groupKey = `${item.CMD}-${item.time}`;
                if (!newIncomingGroupedDataMap.has(groupKey)) {
                    newIncomingGroupedDataMap.set(groupKey, {
                        key: groupKey,
                        CMD: item.CMD,
                        CMD_Decriptions: item.CMD_Decriptions,
                        unit: item.unit,
                        time: item.time
                    });
                }
                const currentGroup = newIncomingGroupedDataMap.get(groupKey)!;
                currentGroup[item.payload_name] = item.data;
            }
        });

        // 1. Cập nhật dữ liệu cho bảng chung (allProcessedData)
        const updatedAllProcessedData = [...currentAllProcessedData];
        const existingAllProcessedMap = new Map(updatedAllProcessedData.map(d => [d.key, d]));

        Array.from(newIncomingGroupedDataMap.values()).forEach(newItem => {
            if (existingAllProcessedMap.has(newItem.key)) {
                const existingItem = existingAllProcessedMap.get(newItem.key)!;
                Object.assign(existingItem, newItem);
            } else {
                updatedAllProcessedData.unshift(newItem);
            }
        });

        updatedAllProcessedData.sort((a, b) => {
            const timeA = moment(a.time, "HH:mm:ss.SSS");
            const timeB = moment(b.time, "HH:mm:ss.SSS");
            if (timeA.isValid() && timeB.isValid()) {
                return timeB.diff(timeA);
            }
            return 0;
        });

        // --- GIỚI HẠN 20 BẢN GHI Ở ĐÂY ---
        setAllProcessedData(updatedAllProcessedData.slice(0, 20)); // Chỉ giữ lại 20 bản ghi mới nhất

        // 2. Cập nhật dữ liệu cho các CMD đặc biệt (specificCMDsData)
        const newSpecificCMDsDataState = { ...currentSpecificCMDsData };

        Object.keys(specificCMDsLimits).forEach(cmd => {
            const incomingRecordsForCMD = Array.from(newIncomingSpecificCMDsGroupedBatch.values()).filter(r => r.CMD === cmd);
            let currentRecordsForCMD = newSpecificCMDsDataState[cmd] || [];

            const uniqueKeysInCurrentState = new Set(currentRecordsForCMD.map(r => r.key));

            incomingRecordsForCMD.forEach(newRec => {
                if (!uniqueKeysInCurrentState.has(newRec.key)) {
                    currentRecordsForCMD.unshift(newRec);
                }
            });

            currentRecordsForCMD.sort((a, b) => {
                const timeA = moment(a.time, "HH:mm:ss.SSS");
                const timeB = moment(b.time, "HH:mm:ss.SSS");
                if (timeA.isValid() && timeB.isValid()) {
                    return timeB.diff(timeA);
                }
                return 0;
            });

            const limit = specificCMDsLimits[cmd] || 0;
            newSpecificCMDsDataState[cmd] = currentRecordsForCMD.slice(0, limit);
        });

        setSpecificCMDsData(newSpecificCMDsDataState);

    }, [dataIotsDetail, allProcessedData, specificCMDsData, specialCMDsSet, specificCMDsLimits]);

    const filteredData = useMemo(() => {
        let currentData = allProcessedData;

        currentData = currentData.filter(row => !specialCMDsSet.has(row.CMD));

        if (selectedCMD && selectedCMD.length > 0) {
            currentData = currentData.filter(row => selectedCMD.includes(row.CMD));
        }

        currentData = currentData.filter(row => row.CMD && !row.CMD.toLowerCase().includes('notify'));

        return currentData;
    }, [allProcessedData, selectedCMD, specialCMDsSet]);

    const dynamicColumns = useMemo(() => {
        const allPayloadNames = new Set<string>();
        allProcessedData.filter(row => !specialCMDsSet.has(row.CMD)).forEach((row: any) => {
            for (const key in row) {
                if (key !== 'key' && key !== 'CMD' && key !== 'CMD_Decriptions' && key !== 'unit' && key !== 'time' && row.hasOwnProperty(key)) {
                    allPayloadNames.add(key);
                }
            }
        });

        const generatedCols: TableColumn[] = [
            { title: "STT", dataIndex: "stt", key: "stt", width: 50, render: (_value, _record, index) => (index !== undefined ? index + 1 : '-') },
            { title: "CMD", dataIndex: "CMD", key: "CMD", render: (text: string) => text.replace("CMD_", "") },
            ...Array.from(allPayloadNames).map(payloadName => ({
                title: payloadName.toUpperCase(),
                dataIndex: payloadName,
                key: payloadName,
                render: (value: any, record: any) => {
                    if (value === null || value === undefined) return "-";
                    if (typeof value === 'boolean') return value ? "True" : "False";

                    if (payloadName === 'data' && (record.CMD === 'CMD_PUSH_TCP' || record.CMD === 'CMD_PUSH_UDP')) {
                        if (typeof value === 'string') {
                            return `${value}`;
                        }
                    }

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
    }, [allProcessedData, specialCMDsSet]);

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
            if (row.CMD && !row.CMD.toLowerCase().includes('notify') && !specialCMDsSet.has(row.CMD)) {
                cmds.add(row.CMD);
            }
        });
        return Array.from(cmds);
    }, [allProcessedData, specialCMDsSet]);

    return (
        <div style={{
            overflowX: 'auto',
            width: '100%',
        }}>
            <h3 style={{ margin: '20px 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                Dữ liệu chung
            </h3>

            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <Space>
                    <FilterOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
                    <Select
                        mode="multiple"
                        placeholder="Lọc theo CMD"
                        style={{ width: 250 }}
                        allowClear
                        value={selectedCMD}
                        onChange={(value: string[]) => setSelectedCMD(value)}
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
                    {columns.map((col: TableColumn) => (
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
                    {renderedColumns.map((col: TableColumn) => (
                        <th key={col.key} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2', whiteSpace: 'nowrap', minWidth: col.width ? `${col.width}px` : undefined, }}>
                            {col.title}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {filteredData.length > 0 ? (
                    filteredData.map((row: any, rowIndex: number) => (
                        <tr key={row.key} style={{ backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9', }}>
                            {renderedColumns.map((col: TableColumn) => {
                                const value = row[col.dataIndex];
                                const renderedValue = col.render ? col.render(value, row, rowIndex) : value;

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
                    ))
                ) : (
                    <tr>
                        <td colSpan={renderedColumns.length || 1} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', color: '#888' }}>
                            Không có dữ liệu để hiển thị.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            <SpecificCMDTables data={specificCMDsData} configCMDs={SPECIFIC_CMD_TABLE_CONFIG} />
        </div>
    );
};

export default ViewTable;