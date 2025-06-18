import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Select, Row, Col, Input, message, Button, InputNumber, Card, Form } from "antd";
import { FilterOutlined, CloseCircleOutlined, SendOutlined } from '@ant-design/icons';
const { Option } = Select;
const { TextArea } = Input;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- CONSTANTS ---
const MAX_DISPLAY_RECORDS = 10;
const MAX_STORED_RECORDS = 40;
const TIMESTAMP_LENGTH = 10;

// Định nghĩa các lệnh nhận (RECEIVE COMMANDS)
interface ReceiveCommand {
    cmd: string;
    label: string;
    type: 'modbus' | 'serial';
}

const MODBUS_RECEIVE_CMDS: ReceiveCommand[] = [
    { cmd: "CMD_PUSH_MODBUS_RS485", label: "RS485", type: 'modbus' },
    { cmd: "CMD_PUSH_MODBUS_TCP", label: "TCP", type: 'modbus' }
];

const SERIAL_RECEIVE_CMDS: ReceiveCommand[] = [
    { cmd: "CMD_PUSH_SERIAL_RS485", label: "SERIAL RS485", type: 'serial' },
    { cmd: "CMD_PUSH_SERIAL_RS232", label: "SERIAL RS232", type: 'serial' },
    { cmd: "CMD_PUSH_SERIAL_TCP", label: "SERIAL TCP", type: 'serial' },
    { cmd: "CMD_PUSH_TCP", label: "PUSH TCP", type: 'serial' },
    { cmd: "CMD_PUSH_UDP", label: "PUSH UDP", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DI1", label: "IO DI1", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DI2", label: "IO DI2", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DI3", label: "IO DI3", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DI4", label: "IO DI4", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DI5", label: "IO DI5", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DI6", label: "IO DI6", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DI7", label: "IO DI7", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DI8", label: "IO DI8", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DO1", label: "IO DO1", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DO2", label: "IO DO2", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DO3", label: "IO DO3", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DO4", label: "IO DO4", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DO5", label: "IO DO5", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DO6", label: "IO DO6", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DO7", label: "IO DO7", type: 'serial' },
    { cmd: "CMD_PUSH_IO_DO8", label: "IO DO8", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AI1", label: "IO AI1", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AI2", label: "IO AI2", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AI3", label: "IO AI3", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AI4", label: "IO AI4", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AI5", label: "IO AI5", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AI6", label: "IO AI6", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AI7", label: "IO AI7", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AI8", label: "IO AI8", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AO1", label: "IO AO1", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AO2", label: "IO AO2", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AO3", label: "IO AO3", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AO4", label: "IO AO4", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AO5", label: "IO AO5", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AO6", label: "IO AO6", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AO7", label: "IO AO7", type: 'serial' },
    { cmd: "CMD_PUSH_IO_AO8", label: "IO AO8", type: 'serial' },
    { cmd: "CMD_PUSH_IO_RS232", label: "IO RS232", type: 'serial' },
    { cmd: "CMD_PUSH_IO_RS485", label: "IO RS485", type: 'serial' },
];

// Định nghĩa các trường dữ liệu cho form điều khiển
type FieldType = 'text' | 'number' | 'textarea' | 'ip_unitid';
interface ControlField {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    min?: number;
    max?: number;
    precision?: number;
    rows?: number;
    span?: number; // Span cho COL chứa Form.Item
}

// Định nghĩa các lệnh điều khiển (CONTROL COMMANDS)
interface ControlCommand {
    cmd: string;
    label: string;
    type: 'modbus' | 'serial';
    fields: ControlField[];
}

const MODBUS_CONTROL_CMDS: ControlCommand[] = [
    {
        cmd: "CMD_REQUEST_MODBUS_RS485", label: "CMD_REQUEST_MODBUS_RS485", type: 'modbus',
        fields: [
            { name: "id", label: "ID", type: "number", placeholder: "ID", required: true, min: 0, max: 255, precision: 0, span: 12 },
            { name: "address", label: "Addr", type: "number", placeholder: "Addr", required: true, min: 0, max: 65535, precision: 0, span: 12 },
            { name: "function", label: "Func", type: "number", placeholder: "Func", required: true, min: 0, max: 255, precision: 0, span: 12 },
            { name: "data", label: "Data", type: "text", placeholder: "Data", required: true, precision: 0, span: 12 },
        ]
    },
    {
        cmd: "CMD_REQUEST_MODBUS_TCP", label: "CMD_REQUEST_MODBUS_TCP", type: 'modbus',
        fields: [
            { name: "id", label: "IP", type: "ip_unitid", placeholder: "IP", required: true, span: 12 },
            { name: "address", label: "Addr", type: "number", placeholder: "Addr", required: true, min: 0, max: 65535, precision: 0, span: 12 },
            { name: "function", label: "Func", type: "number", placeholder: "Func", required: true, min: 0, max: 255, precision: 0, span: 12 },
            { name: "data", label: "Data", type: "text", placeholder: "Data", required: true, precision: 0, span: 12 },
        ]
    }
];

const SERIAL_CONTROL_CMDS: ControlCommand[] = [
    {
        cmd: "CMD_REQUEST_SERIAL_RS485", label: "CMD_REQUEST_SERIAL_RS485", type: 'serial',
        fields: [
            { name: "data", label: "Data", type: "textarea", placeholder: "Data", required: true, rows: 1, span: 24 },
        ]
    },
    {
        cmd: "CMD_REQUEST_SERIAL_RS232", label: "CMD_REQUEST_SERIAL_RS232", type: 'serial',
        fields: [
            { name: "data", label: "Data", type: "textarea", placeholder: "Data", required: true, rows: 1, span: 24 },
        ]
    },
    {
        cmd: "CMD_REQUEST_SERIAL_TCP", label: "CMD_REQUEST_SERIAL_TCP", type: 'serial',
        fields: [
            { name: "id", label: "IP", type: "text", placeholder: "IP", required: true, span: 24 },
            { name: "data", label: "Data", type: "textarea", placeholder: "Data", required: true, rows: 1, span: 24 },
        ]
    },
    {
        cmd: "CMD_REQUEST_SERIAL_UDP", label: "CMD_REQUEST_SERIAL_UDP", type: 'serial',
        fields: [
            { name: "id", label: "IP", type: "text", placeholder: "IP", required: true, span: 12 },
            { name: "port", label: "Port", type: "number", placeholder: "Port", required: true, span: 12 },
            { name: "data", label: "Data", type: "textarea", placeholder: "Data", required: true, rows: 1, span: 24 },
        ]
    },
    {
        cmd: "CMD_CAN", label: "CMD_CAN", type: 'serial',
        fields: [
            { name: "id", label: "ID", type: "number", placeholder: "ID", required: true, min: 0, max: 4294967295, precision: 0, span: 24 },
            { name: "data", label: "Data", type: "textarea", placeholder: "Data", required: true, precision: 0, span: 24 },
        ]
    },
];

// Helper Maps để tra cứu nhanh thông tin CMD
const ALL_RECEIVE_CMDS_MAP = new Map<string, ReceiveCommand>();
[...MODBUS_RECEIVE_CMDS, ...SERIAL_RECEIVE_CMDS].forEach(cmdInfo => {
    ALL_RECEIVE_CMDS_MAP.set(cmdInfo.cmd, cmdInfo);
});

const ALL_CONTROL_CMDS_MAP = new Map<string, ControlCommand>();
[...MODBUS_CONTROL_CMDS, ...SERIAL_CONTROL_CMDS].forEach(cmdInfo => {
    ALL_CONTROL_CMDS_MAP.set(cmdInfo.cmd, cmdInfo);
});

// Danh sách tất cả các CMD nhận được (đã sắp xếp)
const SORTED_MODBUS_RECEIVE_CMDS = MODBUS_RECEIVE_CMDS.sort((a, b) => a.label.localeCompare(b.label));
const SORTED_SERIAL_RECEIVE_CMDS = SERIAL_RECEIVE_CMDS.sort((a, b) => a.label.localeCompare(b.label));


// --- INTERFACES ---
interface ConfigIotsProps {
    dataIotsDetail: {
        data?: IoTRawData[];
    };
    deviceMac: string;
    onControlSuccess: () => void;
    isConnected: boolean;
}

interface IoTRawData {
    CMD: string;
    CMD_Decriptions?: string;
    unit?: string;
    time: string;
    payload_name: string;
    data: any;
}

interface IoTProcessedData {
    key: string;
    CMD: string;
    CMD_Decriptions?: string;
    unit?: string;
    time: string;
    [payloadName: string]: any;
    isMissed?: boolean;
}

interface TableColumn {
    title: string | React.ReactNode;
    dataIndex: string;
    key: string;
    render?: (value: any, record?: any, index?: number) => React.ReactNode;
    width?: number;
}

// --- UTILITY FUNCTIONS ---
const formatTimestamp = (value: any): string => {
    if (typeof value === 'number' && String(value).length === TIMESTAMP_LENGTH) {
        try {
            const date = new Date(value * 1000);
            return date.toLocaleTimeString('en-GB', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
        } catch (error) {
            console.warn('Error formatting timestamp:', error);
            return String(value);
        }
    }
    return String(value);
};

const parseTime = (timeString: string): number => {
    try {
        const [time, ms] = timeString.split('.');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600000 + minutes * 60000 + seconds * 1000 + (parseInt(ms) || 0);
    } catch {
        return 0;
    }
};

const sortByTime = <T extends { time: string }>(a: T, b: T): number => {
    const timeA = parseTime(a.time);
    const timeB = parseTime(b.time);
    return timeB - timeA;
};

const getCmdLabel = (cmd: string): string => {
    const receiveInfo = ALL_RECEIVE_CMDS_MAP.get(cmd);
    if (receiveInfo) return receiveInfo.label;
    const controlInfo = ALL_CONTROL_CMDS_MAP.get(cmd);
    if (controlInfo) return controlInfo.label;
    return cmd;
};

// --- CORE LOGIC HOOK (FOR DATA PROCESSING) ---
const useIoTDataProcessor = (dataIotsDetail: ConfigIotsProps['dataIotsDetail']) => {
    const [serialData, setSerialData] = useState<IoTProcessedData[]>([]);
    const [modbusData, setModbusData] = useState<IoTProcessedData[]>([]);

    const ALL_RECEIVE_CMDS_SET = useMemo(() => new Set([...MODBUS_RECEIVE_CMDS, ...SERIAL_RECEIVE_CMDS].map(c => c.cmd)), []);
    const MODBUS_RECEIVE_CMDS_SET = useMemo(() => new Set(MODBUS_RECEIVE_CMDS.map(c => c.cmd)), []);

    const processIncomingData = useCallback((rawData: IoTRawData[]) => {
        const recentRawData = rawData.slice(0, 50);

        const validData = recentRawData
            .filter(item => ALL_RECEIVE_CMDS_SET.has(item.CMD))
            .sort(sortByTime);

        // Group theo CMD và time
        const groupedData = new Map<string, any>();

        validData.forEach((item) => {
            const groupKey = `${item.CMD}-${item.time}`;

            if (!groupedData.has(groupKey)) {
                groupedData.set(groupKey, {
                    CMD: item.CMD,
                    time: item.time
                });
            }

            const currentGroup = groupedData.get(groupKey)!;
            // Thêm payload_name làm key với data làm value
            currentGroup[item.payload_name] = item.data;
        });

        // Convert Map thành array
        const processedItems = Array.from(groupedData.values());

        return processedItems;
    }, [ALL_RECEIVE_CMDS_SET]);

    const generateUniqueKey = (item: any) => {
        // Tạo key từ toàn bộ nội dung (trừ time để có thể format)
        const { time, ...contentForHash } = item;
        const content = JSON.stringify(contentForHash) + time;
        return btoa(content).replace(/[^a-zA-Z0-9]/g, '');
    };

    const updateDataState = useCallback((
        prevData: IoTProcessedData[],
        newItems: any[]
    ): IoTProcessedData[] => {
        if (newItems.length === 0) return prevData;

        const existingKeys = new Set(prevData.map(d => d.key));

        // Convert và filter unique items
        const processedNewItems = newItems
            .map(item => ({
                ...item,
                key: generateUniqueKey(item),
                time: formatTimestamp(item.time)
            }))
            .filter(item => !existingKeys.has(item.key));

        if (processedNewItems.length === 0) return prevData;

        return [...processedNewItems, ...prevData]
            .sort(sortByTime)
            .slice(0, MAX_STORED_RECORDS);
    }, []);

    useEffect(() => {
        const rawData = dataIotsDetail.data;
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
            return;
        }

        const processedItems = processIncomingData(rawData);
        const serialItems = processedItems.filter(item => !MODBUS_RECEIVE_CMDS_SET.has(item.CMD));
        const modbusItems = processedItems.filter(item => MODBUS_RECEIVE_CMDS_SET.has(item.CMD));

        setSerialData(prev => updateDataState(prev, serialItems));
        setModbusData(prev => updateDataState(prev, modbusItems));
    }, [dataIotsDetail.data, processIncomingData, updateDataState, MODBUS_RECEIVE_CMDS_SET]);

    return { serialData, modbusData };
};

// --- TABLE COMPONENT (FOR DISPLAY ONLY) ---
interface DataTableViewProps {
    data: IoTProcessedData[];
    isSerialCommands: boolean;
}

const DataTableView: React.FC<DataTableViewProps> = ({ data, isSerialCommands }) => {
    const [selectedCmdFilter, setSelectedCmdFilter] = useState<string | undefined>(undefined);
    const [isFilterOpen, setFilterOpen] = useState(false);
    const selectRef = useRef<any>(null);

    const filterOpenRef = useRef(isFilterOpen);
    useEffect(() => {
        filterOpenRef.current = isFilterOpen;
    }, [isFilterOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterOpenRef.current && selectRef.current &&
                !selectRef.current.contains(event.target as Node)) {
                setFilterOpen(false);
            }
        };
        // Sử dụng capture phase để bắt sự kiện sớm hơn, trước khi Select xử lý
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, []);

    const getFilteredData = useCallback((
        tableData: IoTProcessedData[],
        cmdFilter: string | undefined
    ): IoTProcessedData[] => {
        let filtered = tableData;
        if (cmdFilter) {
            filtered = tableData.filter(row => row.CMD === cmdFilter);
        }
        return filtered.slice(0, MAX_DISPLAY_RECORDS);
    }, []);

    const displayedData = useMemo(() =>
            getFilteredData(data, selectedCmdFilter),
        [data, selectedCmdFilter, getFilteredData]
    );

    const generateTableColumns = useCallback((
        tableData: IoTProcessedData[],
        cmdFilter: string | undefined,
        onCmdFilterChange: (value: string | undefined) => void,
        filterOpen: boolean,
        setFilterState: (open: boolean) => void,
        selectElemRef: React.RefObject<any>,
        sortedCmds: ReceiveCommand[]
    ): TableColumn[] => {
        const payloadNames = new Set<string>();
        tableData.forEach((row) => {
            Object.keys(row).forEach(key => {
                if (!['key', 'CMD', 'CMD_Decriptions', 'unit', 'time', 'isMissed'].includes(key)) {
                    payloadNames.add(key);
                }
            });
        });

        const availableUniqueCMDs = sortedCmds.filter(cmdInfo =>
            tableData.some(row => row.CMD === cmdInfo.cmd)
        );

        const columns: TableColumn[] = [
            {
                title: (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minWidth: '50px',
                            position: 'relative',
                            height: '100%',
                            padding: '0px',
                        }}
                    >
                        <span
                            style={{ cursor: 'pointer', flexGrow: 1, textAlign: 'left' }}
                            // Khi click vào label, đảo ngược trạng thái mở/đóng
                            onClick={(e) => {
                                e.stopPropagation(); // Ngăn sự kiện nổi bọt, tránh ảnh hưởng Select nếu đang mở
                                setFilterState(!filterOpen);
                            }}
                        >
                            {cmdFilter ? getCmdLabel(cmdFilter) : 'CMD'}
                        </span>

                        {/* Thay đổi logic của biểu tượng */}
                        {cmdFilter ? (
                            // Nếu có filter, nút này để xóa filter và đóng
                            <CloseCircleOutlined
                                style={{ cursor: 'pointer', fontSize: '12px' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCmdFilterChange(undefined); // Xóa bộ lọc
                                    setFilterState(false); // Đóng dropdown
                                }}
                            />
                        ) : (
                            // Nếu không có filter, nút này để mở/đóng dropdown
                            <FilterOutlined
                                style={{ cursor: 'pointer', fontSize: '12px' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterState(!filterOpen); // Đảo ngược trạng thái mở/đóng
                                }}
                            />
                        )}

                        {filterOpen && (
                            <Select
                                ref={selectElemRef}
                                placeholder="Chọn CMD để lọc"
                                style={{
                                    width: '200px',
                                    position: 'absolute',
                                    top: '100%',
                                    left: '0',
                                    zIndex: 1000,
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                }}
                                allowClear={true}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                                }
                                value={cmdFilter}
                                onChange={(value: string | undefined) => {
                                    onCmdFilterChange(value);
                                    setFilterState(false); // Đóng sau khi chọn
                                }}
                                onDropdownVisibleChange={(open) => {
                                    // Khi Ant Design Select đóng, chúng ta cũng cập nhật state của mình
                                    if (!open) {
                                        setFilterState(false);
                                    }
                                }}
                                autoFocus
                                dropdownMatchSelectWidth={false}
                                // Rất quan trọng: Prop này điều khiển việc mở/đóng dropdown của Select
                                open={filterOpen} // Đồng bộ với state filterOpen của bạn
                            >
                                {availableUniqueCMDs.map(cmdInfo => (
                                    <Option key={cmdInfo.cmd} value={cmdInfo.cmd}>
                                        {cmdInfo.label}
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </div>
                ),
                dataIndex: "CMD",
                key: "CMD",
                width: 70,
                render: (text: string) => getCmdLabel(text)
            },
            ...Array.from(payloadNames).map(payloadName => ({
                title: payloadName.toUpperCase(),
                dataIndex: payloadName,
                key: payloadName,
                render: (value: any, record: IoTProcessedData) => {
                    if (value === null || value === undefined) return "-";
                    if (typeof value === 'boolean') return value ? "True" : "False";

                    const receiveCmdInfo = ALL_RECEIVE_CMDS_MAP.get(record.CMD);
                    if (payloadName === 'data' && receiveCmdInfo?.type === 'serial') {
                        return String(value);
                    }
                    return String(value);
                },
            })),
            {
                title: "Time",
                dataIndex: "time",
                key: "time",
                width: 90,
                render: (time: string) =>
                    (!time || time === "NaN:NaN:NaN.NaN") ? "-" : time
            },
        ];
        return columns;
    }, []);

    const columns = useMemo(() => {
        const sortedCmdsForTable = isSerialCommands ? SORTED_SERIAL_RECEIVE_CMDS : SORTED_MODBUS_RECEIVE_CMDS;

        return generateTableColumns(
            data,
            selectedCmdFilter,
            setSelectedCmdFilter,
            isFilterOpen,
            setFilterOpen,
            selectRef,
            sortedCmdsForTable
        );
    }, [data, selectedCmdFilter, isFilterOpen, isSerialCommands, generateTableColumns]);

    return (
        <>
            <table style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                fontSize: '13px',
            }}>
                <thead>
                <tr>
                    {columns.map((col) => (
                        <th
                            key={col.key}
                            style={{
                                border: '1px solid #ddd',
                                padding: '6px',
                                textAlign: 'left',
                                backgroundColor: '#f2f2f2',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                                minWidth: col.width ? `${col.width}px` : 'auto',
                                width: col.width ? `${col.width}px` : `${100 / columns.length}%`,
                                position: 'relative',
                                overflow: 'visible'
                            }}
                        >
                            {col.title}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {displayedData.length > 0 ? (
                    displayedData.map((row, rowIndex) => {
                        const isInputChannel = row.CMD?.startsWith('CMD_PUSH_IO_DI');
                        const isBooleanData = typeof row.data === 'boolean';

                        let rowBgColor;
                        if (row.isMissed) {
                            rowBgColor = '#fbbf66';
                        } else if (isInputChannel && isBooleanData) {
                            rowBgColor = row.data ? '#e6ffe6' : '#ffe6e6';
                        } else {
                            rowBgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
                        }


                        return (
                            <tr key={row.key} style={{ backgroundColor: rowBgColor }}>
                                {columns.map((col) => {
                                    const value = row[col.dataIndex];
                                    const renderedValue = col.render ?
                                        col.render(value, row, rowIndex) : value;

                                    return (
                                        <td key={`${row.key}-${col.key}`} style={{
                                            border: '1px solid #ddd',
                                            padding: '6px',
                                            textAlign: 'left',
                                            whiteSpace: 'normal',
                                            wordWrap: 'break-word',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {renderedValue !== undefined && renderedValue !== null
                                                ? String(renderedValue)
                                                : '-'
                                            }
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td
                            colSpan={columns.length || 1}
                            style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                                textAlign: 'center',
                                color: '#888'
                            }}
                        >
                            Không có dữ liệu để hiển thị.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </>
    );
};

// --- SERIAL CONTROL COMPONENT ---
interface SerialControlProps {
    deviceMac: string;
    onControlSuccess: () => void;
    isConnected: boolean;
    selectedControlCmd: string | undefined;
    onSelectControlCmd: (cmd: string | undefined) => void;
}

const SerialControl: React.FC<SerialControlProps> = ({ deviceMac, onControlSuccess, isConnected, selectedControlCmd, onSelectControlCmd }) => {
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [controlLoading, setControlLoading] = useState<boolean>(false);
    const [form] = Form.useForm();

    const controlCmdInfo = useMemo(() => selectedControlCmd ? ALL_CONTROL_CMDS_MAP.get(selectedControlCmd) : undefined, [selectedControlCmd]);

    useEffect(() => {
        if (controlCmdInfo?.fields) {
            const initialValues: Record<string, any> = {};
            controlCmdInfo.fields.forEach(field => {
                initialValues[field.name] = undefined;
            });
            setFormValues(initialValues);
            form.setFieldsValue(initialValues);
        } else {
            setFormValues({});
            form.resetFields();
        }
    }, [selectedControlCmd, controlCmdInfo, form]);

    const handleInputChange = useCallback((name: string, value: any) => {
        setFormValues(prev => ({ ...prev, [name]: value }));
    }, []);

    const validateAndSubmit = useCallback(async () => {
        if (!isConnected) {
            message.warning("Thiết bị chưa kết nối. Không thể gửi lệnh.");
            return;
        }
        if (!controlCmdInfo) {
            message.error("Lệnh điều khiển Serial không hợp lệ hoặc chưa được chọn.");
            return;
        }

        try {
            await form.validateFields();
            setControlLoading(true);

            const requestBody: { mac: string; type: string; [key: string]: any } = {
                mac: deviceMac,
                type: controlCmdInfo.cmd,
                ...formValues,
            };

            const response = await fetch(`${API_BASE_URL}/api/iots/serial-command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || response.statusText}`);
            }

            message.success(`Gửi lệnh ${getCmdLabel(controlCmdInfo.cmd)} thành công`);
            onControlSuccess();
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) {
                message.error("Vui lòng điền đầy đủ và chính xác các trường.");
            } else {
                console.error('Error sending serial control command:', error);
                if (error instanceof Error) {
                    message.error(`Lỗi khi gửi lệnh Serial: ${error.message}`);
                } else {
                    message.error(`Lỗi khi gửi lệnh Serial`);
                }
            }
        } finally {
            setControlLoading(false);
        }
    }, [isConnected, controlCmdInfo, formValues, deviceMac, onControlSuccess, form]);


    return (
        <Card size="small" bordered={false} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>Điều khiển:</span>
                <Select
                    placeholder="Chọn lệnh"
                    style={{ flexGrow: 1 }}
                    allowClear={true}
                    showSearch
                    filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    value={selectedControlCmd}
                    onChange={onSelectControlCmd}
                    size="small"
                >
                    {SERIAL_CONTROL_CMDS.map(cmd => (
                        <Option key={cmd.cmd} value={cmd.cmd}>
                            {cmd.label}
                        </Option>
                    ))}
                </Select>
            </div>

            {controlCmdInfo && controlCmdInfo.type === 'serial' ? (
                <Form form={form} layout="horizontal" onFinish={validateAndSubmit} style={{ margin: '0' }}>
                    <Row gutter={[8, 8]} align="middle">
                        {controlCmdInfo.fields.map(field => {
                            const value = formValues[field.name];
                            const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | number | null) => {
                                handleInputChange(field.name, (e && typeof e === 'object' && 'target' in e) ? e.target.value : e);
                            };

                            let inputComponent;
                            switch (field.type) {
                                case 'text':
                                case 'ip_unitid':
                                    inputComponent = (
                                        <Input
                                            value={value || ''}
                                            onChange={onChange}
                                            placeholder={field.placeholder || field.label}
                                            size="small"
                                            style={{ borderRadius: '4px' }}
                                        />
                                    );
                                    break;
                                case 'number':
                                    inputComponent = (
                                        <InputNumber
                                            value={value}
                                            onChange={onChange}
                                            placeholder={field.placeholder || field.label}
                                            size="small"
                                            min={field.min}
                                            max={field.max}
                                            precision={field.precision}
                                            controls={false}
                                            style={{ borderRadius: '4px', width: '100%' }}
                                        />
                                    );
                                    break;
                                case 'textarea':
                                    inputComponent = (
                                        <TextArea
                                            value={value || ''}
                                            onChange={onChange}
                                            placeholder={field.placeholder || field.label}
                                            rows={field.rows || 1}
                                            size="small"
                                            autoSize={{ minRows: field.rows || 1, maxRows: 3 }}
                                            style={{ borderRadius: '4px' }}
                                        />
                                    );
                                    break;
                                default:
                                    inputComponent = null;
                            }
                            return (
                                <Col key={field.name} span={field.span}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '12px' }}>{field.label}</span>}
                                        name={field.name}
                                        rules={[{ required: field.required, message: '' }]}
                                        initialValue={formValues[field.name]}
                                        style={{ marginBottom: '0' }}
                                    >
                                        {inputComponent}
                                    </Form.Item>
                                </Col>
                            );
                        })}
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Button
                                type="primary"
                                loading={controlLoading}
                                htmlType="submit"
                                icon={<SendOutlined />}
                                size="small"
                                disabled={!isConnected}
                                style={{ borderRadius: '4px', background: '#2563eb', borderColor: '#2563eb' }}
                            >
                                Gửi
                            </Button>
                        </Col>
                    </Row>
                </Form>
            ) : (
                <div style={{ textAlign: 'center', color: '#888', padding: '0' }}>
                    Chọn lệnh
                </div>
            )}
        </Card>
    );
};

// --- MODBUS CONTROL COMPONENT ---
interface ModbusControlProps {
    deviceMac: string;
    onControlSuccess: () => void;
    isConnected: boolean;
    selectedControlCmd: string | undefined;
    onSelectControlCmd: (cmd: string | undefined) => void;
}

const ModbusControl: React.FC<ModbusControlProps> = ({ deviceMac, onControlSuccess, isConnected, selectedControlCmd, onSelectControlCmd }) => {
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [controlLoading, setControlLoading] = useState<boolean>(false);
    const [form] = Form.useForm();

    const controlCmdInfo = useMemo(() => selectedControlCmd ? ALL_CONTROL_CMDS_MAP.get(selectedControlCmd) : undefined, [selectedControlCmd]);

    useEffect(() => {
        if (controlCmdInfo?.fields) {
            const initialValues: Record<string, any> = {};
            controlCmdInfo.fields.forEach(field => {
                initialValues[field.name] = undefined;
            });
            setFormValues(initialValues);
            form.setFieldsValue(initialValues);
        } else {
            setFormValues({});
            form.resetFields();
        }
    }, [selectedControlCmd, controlCmdInfo, form]);

    const handleInputChange = useCallback((name: string, value: any) => {
        setFormValues(prev => ({ ...prev, [name]: value }));
    }, []);

    const validateAndSubmit = useCallback(async () => {
        if (!isConnected) {
            message.warning("Thiết bị chưa kết nối. Không thể gửi lệnh.");
            return;
        }
        if (!controlCmdInfo) {
            message.error("Lệnh điều khiển Modbus không hợp lệ hoặc chưa được chọn.");
            return;
        }

        try {
            await form.validateFields();
            setControlLoading(true);

            const requestBody: { mac: string; type: string; [key: string]: any } = {
                mac: deviceMac,
                type: controlCmdInfo.cmd,
                ...formValues,
            };

            const response = await fetch(`${API_BASE_URL}/api/iots/modbus-command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || response.statusText}`);
            }

            message.success(`Gửi lệnh ${getCmdLabel(controlCmdInfo.cmd)} thành công`);
            onControlSuccess();
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) {
                message.error("Vui lòng điền đầy đủ và chính xác các trường.");
            } else {
                console.error('Error sending modbus control command:', error);
                if (error instanceof Error) {
                    message.error(`Lỗi khi gửi lệnh Modbus: ${error.message}`);
                } else {
                    message.error(`Lỗi khi gửi lệnh Modbus`);
                }
            }
        } finally {
            setControlLoading(false);
        }
    }, [isConnected, controlCmdInfo, formValues, deviceMac, onControlSuccess, form]);

    return (
        <Card size="small" bordered={false} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>Điều khiển:</span>
                <Select
                    placeholder="Chọn lệnh"
                    style={{ flexGrow: 1 }}
                    allowClear={true}
                    showSearch
                    filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    value={selectedControlCmd}
                    onChange={onSelectControlCmd}
                    size="small"
                >
                    {MODBUS_CONTROL_CMDS.map(cmd => (
                        <Option key={cmd.cmd} value={cmd.cmd}>
                            {cmd.label}
                        </Option>
                    ))}
                </Select>
            </div>

            {controlCmdInfo && controlCmdInfo.type === 'modbus' ? (
                <Form form={form} layout="horizontal" onFinish={validateAndSubmit} style={{ margin: '0' }}>
                    <Row gutter={[8, 0]} align="middle">
                        {controlCmdInfo.fields.map(field => {
                            const value = formValues[field.name];
                            const onChange = (e: React.ChangeEvent<HTMLInputElement> | number | null) => {
                                handleInputChange(field.name, (e && typeof e === 'object' && 'target' in e) ? e.target.value : e);
                            };

                            let inputComponent;
                            switch (field.type) {
                                case 'text':
                                case 'ip_unitid':
                                    inputComponent = (
                                        <Input
                                            value={value || ''}
                                            onChange={onChange}
                                            placeholder={field.placeholder || field.label}
                                            size="small"
                                            style={{ borderRadius: '4px' }}
                                        />
                                    );
                                    break;
                                case 'number':
                                    inputComponent = (
                                        <InputNumber
                                            value={value}
                                            onChange={onChange}
                                            placeholder={field.placeholder || field.label}
                                            size="small"
                                            min={field.min}
                                            max={field.max}
                                            precision={field.precision}
                                            controls={false}
                                            style={{ borderRadius: '4px', width: '100%' }}
                                        />
                                    );
                                    break;
                                default:
                                    inputComponent = null;
                            }
                            return (
                                <Col key={field.name} span={12}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '12px' }}>{field.label}</span>}
                                        name={field.name}
                                        rules={[{ required: field.required, message: '' }]}
                                        initialValue={formValues[field.name]}
                                        style={{ marginBottom: '8px' }}
                                    >
                                        {inputComponent}
                                    </Form.Item>
                                </Col>
                            );
                        })}
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Button
                                type="primary"
                                loading={controlLoading}
                                htmlType="submit"
                                icon={<SendOutlined />}
                                size="small"
                                disabled={!isConnected}
                                style={{ borderRadius: '4px', background: '#2563eb', borderColor: '#2563eb' }}
                            >
                                Gửi
                            </Button>
                        </Col>
                    </Row>
                </Form>
            ) : (
                <div style={{ textAlign: 'center', color: '#888', padding: '0' }}>
                    Chọn lệnh
                </div>
            )}
        </Card>
    );
};

// --- MAIN COMPONENT ---
const ViewTable: React.FC<ConfigIotsProps> = ({ dataIotsDetail, deviceMac, onControlSuccess, isConnected }) => {
    const { serialData, modbusData } = useIoTDataProcessor(dataIotsDetail);

    const [selectedSerialControlCmd, setSelectedSerialControlCmd] = useState<string | undefined>(undefined);
    const [selectedModbusControlCmd, setSelectedModbusControlCmd] = useState<string | undefined>(undefined);

    return (
        <div style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
                {/* Cột cho Serial: Điều khiển + Hiển thị */}
                <Col span={10}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                        Serial
                    </h2>
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <SerialControl
                            deviceMac={deviceMac}
                            onControlSuccess={onControlSuccess}
                            isConnected={isConnected}
                            selectedControlCmd={selectedSerialControlCmd}
                            onSelectControlCmd={setSelectedSerialControlCmd}
                        />

                        <DataTableView
                            data={serialData}
                            isSerialCommands={true}
                        />
                    </div>
                </Col>

                {/* Cột cho Modbus: Điều khiển + Hiển thị */}
                <Col span={14}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                        Modbus
                    </h2>
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <ModbusControl
                            deviceMac={deviceMac}
                            onControlSuccess={onControlSuccess}
                            isConnected={isConnected}
                            selectedControlCmd={selectedModbusControlCmd}
                            onSelectControlCmd={setSelectedModbusControlCmd}
                        />

                        <DataTableView
                            data={modbusData}
                            isSerialCommands={false}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ViewTable;