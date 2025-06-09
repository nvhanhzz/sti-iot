import React, { useMemo } from "react";
import moment from "moment";

// Hàm stringToHex (Nếu bạn muốn nó là file utils riêng, hãy chuyển nó ra)
const stringToHex = (str: string) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
    }
    return hex.trim();
};

interface SpecificCMDTablesProps {
    // Kiểu dữ liệu của 'data' phải khớp với 'specificCMDsData' từ ViewTable
    data: { [cmd: string]: any[] };
    configCMDs: { cmd: string; title: string; limit: number }[]; // Cấu hình các CMD đặc biệt
}

interface TableColumn {
    title: string;
    dataIndex: string;
    key: string;
    render?: (value: any, record?: any, index?: number) => React.ReactNode;
    width?: number;
}

const SpecificCMDTables: React.FC<SpecificCMDTablesProps> = ({ data, configCMDs }) => {

    // tablesData giờ đây chỉ cần là chính prop 'data' đã được xử lý từ ViewTable
    const tablesData = useMemo(() => {
        return data;
    }, [data]);

    // Hàm tạo cột động cho từng bảng CMD
    const getDynamicColumnsForCMD = (cmdData: any[]): TableColumn[] => {
        // Nếu không có dữ liệu cho CMD này, trả về một bộ cột mặc định để header vẫn hiển thị
        if (!cmdData || cmdData.length === 0) {
            return [
                { title: "STT", dataIndex: "stt", key: "stt", width: 50 },
                { title: "CMD", dataIndex: "CMD", key: "CMD", width: 100 },
                { title: "Thời gian", dataIndex: "time", key: "time", width: 120 },
                { title: "Dữ liệu", dataIndex: "data", key: "data", width: 150 } // Cột dữ liệu chung hoặc payload
            ];
        }

        const allPayloadNames = new Set<string>();
        cmdData.forEach((row: any) => {
            for (const key in row) {
                // Loại trừ các key cố định và chỉ lấy các key đại diện cho payload
                if (key !== 'key' && key !== 'CMD' && key !== 'CMD_Decriptions' && key !== 'unit' && key !== 'time' && row.hasOwnProperty(key)) {
                    allPayloadNames.add(key);
                }
            }
        });

        const generatedCols: TableColumn[] = [
            { title: "STT", dataIndex: "stt", key: "stt", width: 50, render: (_value, _record, index) => (index !== undefined ? index + 1 : '-') },
            // Cột CMD được đưa lên đầu cho dễ nhìn
            { title: "CMD", dataIndex: "CMD", key: "CMD", render: (text: string) => text.replace("CMD_", ""), width: 100 },
            // Các cột động từ payload
            ...Array.from(allPayloadNames).map(payloadName => ({
                title: payloadName.toUpperCase(),
                dataIndex: payloadName,
                key: payloadName,
                render: (value: any, record: any) => {
                    if (value === null || value === undefined) return "-";
                    if (typeof value === 'boolean') return value ? "True" : "False";

                    // Xử lý đặc biệt cho 'data' của CMD_PUSH_TCP/UDP (nếu chúng là CMD đặc biệt)
                    if (payloadName === 'data' && (record.CMD === 'CMD_PUSH_TCP' || record.CMD === 'CMD_PUSH_UDP')) {
                        if (typeof value === 'string') {
                            return `${value} / ${stringToHex(value)}`;
                        }
                    }

                    // Xử lý đặc biệt cho 'id' nếu là timestamp
                    if (payloadName === 'id' && typeof value === 'number' && String(value).length === 10) {
                        return moment.unix(value).format("HH:mm:ss.SSS");
                    }
                    return String(value);
                },
            })),
            // Cột Unit và Time, nếu chúng được tách biệt khỏi payload_name trong quá trình xử lý
            // Loại bỏ cột 'Unit'
            // { title: "Unit", dataIndex: "unit", key: "unit", width: 80, render: (value) => value || '-' },
            { title: "Thời gian", dataIndex: "time", key: "time", width: 120, render: (time: string) => (!time || time === "NaN:NaN:NaN.NaN") ? "-" : time }
        ];

        return generatedCols;
    };

    return (
        <div>
            {configCMDs.map(config => (
                <div key={config.cmd} style={{ marginBottom: '30px' }}>
                    <h4 style={{ margin: '15px 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                        {config.title}
                    </h4>
                    <table style={{
                        width: 'auto',
                        minWidth: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px',
                    }}>
                        <thead>
                        <tr>
                            {/* Lấy cột động dựa trên dữ liệu cụ thể của từng CMD, đảm bảo truyền mảng rỗng nếu không có dữ liệu */}
                            {getDynamicColumnsForCMD(tablesData[config.cmd] || []).map((col: TableColumn) => (
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
                        {/* Kiểm tra dữ liệu trước khi map, đảm bảo tablesData[config.cmd] là một mảng hợp lệ */}
                        {tablesData[config.cmd] && tablesData[config.cmd].length > 0 ? (
                            tablesData[config.cmd].map((row: any, rowIndex: number) => (
                                <tr key={`${config.cmd}-${row.key || rowIndex}`} style={{ backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                                    {/* Lấy cột động lại một lần nữa để render cells */}
                                    {getDynamicColumnsForCMD(tablesData[config.cmd]).map((col: TableColumn) => {
                                        const value = row[col.dataIndex];
                                        const renderedValue = col.render ? col.render(value, row, rowIndex) : value;

                                        return (
                                            <td key={`${config.cmd}-${row.key || rowIndex}-${col.key}`} style={{
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
                                <td colSpan={getDynamicColumnsForCMD(tablesData[config.cmd] || []).length || 1} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', color: '#888' }}>
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