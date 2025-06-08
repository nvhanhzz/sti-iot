import React, { useMemo } from "react";
import moment from "moment";
// Giữ stringToHex ở đây nếu bạn không muốn tạo file utils/stringToHex.ts riêng
// Nếu không, bạn cần import từ utils/stringToHex.ts
const stringToHex = (str: string) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
    }
    return hex.trim();
};


interface SpecificCMDTablesProps {
    data: any[]; // Dữ liệu đã được xử lý từ ViewTable
    configCMDs: { cmd: string; title: string; limit: number }[]; // Cấu hình các CMD đặc biệt
}

interface TableColumn {
    title: string;
    dataIndex: string;
    key: string;
    render?: (value: any, record?: any, index?: number) => React.ReactNode; // Thêm index vào render
    width?: number;
}

const SpecificCMDTables: React.FC<SpecificCMDTablesProps> = ({ data, configCMDs }) => {

    const tablesData = useMemo(() => {
        const result: { [cmd: string]: any[] } = {};
        configCMDs.forEach(config => {
            const filteredAndLimitedData = data
                .filter(row => row.CMD === config.cmd)
                .slice(0, config.limit);
            result[config.cmd] = filteredAndLimitedData;
        });
        return result;
    }, [data, configCMDs]);

    const getDynamicColumnsForCMD = (cmdData: any[]): TableColumn[] => {
        if (!cmdData || cmdData.length === 0) {
            return [
                { title: "STT", dataIndex: "stt", key: "stt", width: 50 }, // Thêm cột STT mặc định
                { title: "CMD", dataIndex: "CMD", key: "CMD", width: 100 },
                { title: "Dữ liệu", dataIndex: "data", key: "data", width: 150 } // Cột dữ liệu chung nếu không có payload
            ];
        }

        const allPayloadNames = new Set<string>();
        cmdData.forEach((row: any) => {
            for (const key in row) {
                if (key !== 'key' && key !== 'CMD' && key !== 'CMD_Decriptions' && key !== 'unit' && key !== 'time' && row.hasOwnProperty(key)) {
                    allPayloadNames.add(key);
                }
            }
        });

        const generatedCols: TableColumn[] = [
            { title: "STT", dataIndex: "stt", key: "stt", width: 50, render: (_value, _record, index) => (index !== undefined ? index + 1 : '-') },
            ...Array.from(allPayloadNames).map(payloadName => ({
                title: payloadName.toUpperCase(),
                dataIndex: payloadName,
                key: payloadName,
                render: (value: any, record: any) => {
                    if (value === null || value === undefined) return "-";
                    if (typeof value === 'boolean') return value ? "True" : "False";

                    if (payloadName === 'data' && (record.CMD === 'CMD_PUSH_TCP' || record.CMD === 'CMD_PUSH_UDP')) {
                        if (typeof value === 'string') {
                            return `${value} / ${stringToHex(value)}`;
                        }
                    }

                    if (payloadName === 'id' && typeof value === 'number' && String(value).length === 10) {
                        return moment.unix(value).format("HH:mm:ss.SSS");
                    }
                    return String(value);
                },
            })),
            { title: "CMD", dataIndex: "CMD", key: "CMD", render: (text: string) => text.replace("CMD_", ""), width: 100 },
        ];

        return generatedCols;
    };

    return (
        <div>
            {configCMDs.map(config => (
                <div key={config.cmd} style={{ marginBottom: '30px' }}>
                    <h4 style={{ margin: '15px 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                        {config.title} ({config.limit} bản ghi gần nhất)
                    </h4>
                    <table style={{
                        width: 'auto',
                        minWidth: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px',
                    }}>
                        <thead>
                        <tr>
                            {getDynamicColumnsForCMD(tablesData[config.cmd]).map((col: TableColumn) => (
                                <th key={col.key} style={{
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    textAlign: 'left',
                                    backgroundColor: '#f2f2f2',
                                    whiteSpace: 'nowrap',
                                    minWidth: col.width ? `${col.width}px` : undefined
                                }}>
                                    {col.title}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {tablesData[config.cmd].length > 0 ? (
                            tablesData[config.cmd].map((row: any, rowIndex: number) => (
                                <tr key={`${config.cmd}-${row.key}-${rowIndex}`} style={{ backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                                    {getDynamicColumnsForCMD(tablesData[config.cmd]).map((col: TableColumn) => {
                                        const value = row[col.dataIndex];
                                        // Truyền rowIndex vào hàm render của cột để tính STT
                                        const renderedValue = col.render ? col.render(value, row, rowIndex) : value;

                                        return (
                                            <td key={`${config.cmd}-${row.key}-${rowIndex}-${col.key}`} style={{
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
                                <td colSpan={getDynamicColumnsForCMD(tablesData[config.cmd]).length || 1} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', color: '#888' }}>
                                    Không có dữ liệu cho {config.title}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default SpecificCMDTables;