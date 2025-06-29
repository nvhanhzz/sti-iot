import React, { useCallback, useEffect, useState, useRef, CSSProperties } from "react";
import { useSocket } from "../../../context/SocketContext";
import moment, { Moment } from "moment";
import { useLocation, useNavigate } from 'react-router-dom';

import { DatePicker, message, AutoComplete, Button } from 'antd'; // Import AutoComplete và Button từ antd
import 'antd/dist/reset.css';

// import ClearableInput from './ClearableInput'; // Không cần ClearableInput nữa
import "./Monitor.css";

// Import React Icons
import { FaFilter, FaTimes, FaColumns, FaPlay, FaPause, FaChevronRight } from 'react-icons/fa';
// Import Tooltip from react-tooltip
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// --- Interfaces ---

interface MonitorDataItem {
    _id: string;
    isMissed?: boolean;
    cmd?: string;
    deviceId: string; // The actual ID for backend API
    deviceName?: string; // The human-readable name for UI
    mac?: string;
    timestamp: number; // Unix timestamp in SECONDS (sẽ nhân * 1000 cho moment)
    value?: number | string | boolean;
    key: string;
    [key: string]: any;
}

interface PaginationInfo {
    method: 'offset';
    totalRecords: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: { lastTimestamp: number; lastId: string } | null;
    previousCursor: { firstTimestamp: number; firstId: string } | null;
    sortBy: 'timestamp' | 'id';
    sortOrder: 'asc' | 'desc';
}

interface TableColumn {
    title: string;
    dataIndex: string;
    key: string;
    sortable?: boolean;
    hideable?: boolean;
}

// FilterInputValues sẽ sử dụng deviceName cho input của người dùng
type FilterInputValues = {
    deviceName?: string; // Người dùng nhập tên thiết bị (cho UI)
    cmd?: string;        // Người dùng nhập tên lệnh (cho UI)
    startTime?: string;
    endTime?: string;
};

// --- NEW INTERFACE for Device List (similar to Home.tsx) ---
interface DeviceListItem {
    id: string;
    name: string;
    mac?: string;
}
// --- END NEW INTERFACE ---

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_DASHBOARD_PREFIX = `${API_BASE_URL}/api/dashboard`; // Sử dụng API_DASHBOARD_PREFIX cho các API liên quan đến dashboard

// --- Inline CSS Styles ---
const styles = {
    container: {
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#333',
    } as CSSProperties,
    filterPanel: {
        marginBottom: '20px',
        padding: '20px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#fcfcfc',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px 40px',
        alignItems: 'flex-end',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    } as CSSProperties,
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    } as CSSProperties,
    filterLabel: {
        fontWeight: 'bold',
        color: '#555',
        marginBottom: '2px',
        fontSize: '13px',
    } as CSSProperties,
    filterInput: { // This style will be mostly for Ant Design inputs, some props might override
        padding: '10px 12px',
        border: '1px solid #ddd',
        borderRadius: '3px',
        fontSize: '14px',
    } as CSSProperties,
    filterSelect: {
        padding: '10px 12px',
        border: '1px solid #ddd',
        borderRadius: '3px',
        fontSize: '14px',
        width: '220px',
        backgroundColor: '#fff',
        cursor: 'pointer',
    } as CSSProperties,
    filterDateRange: {
        display: 'flex',
        gap: '10px',
    } as CSSProperties,
    filterActions: {
        display: 'flex',
        gap: '10px',
        marginTop: 'auto',
    } as CSSProperties,
    button: {
        padding: '8px 15px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    } as CSSProperties,
    primaryButton: {
        backgroundColor: '#007bff',
        color: '#fff',
        borderColor: '#007bff',
    } as CSSProperties,
    headerSection: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: '15px',
        gap: '10px',
    } as CSSProperties,
    entriesDropdown: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    } as CSSProperties,
    entriesSelect: {
        padding: '5px 8px',
        borderRadius: '3px',
        border: '1px solid #ddd',
        fontSize: '14px',
        cursor: 'pointer',
    } as CSSProperties,
    tableWrapper: {
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'relative',
    } as CSSProperties,
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    } as CSSProperties,
    th: {
        backgroundColor: '#f9f9f9',
        padding: '10px 15px',
        textAlign: 'left',
        border: '1px solid #e0e0e0',
        fontWeight: 'bold',
        color: '#555',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        position: 'relative',
        verticalAlign: 'top',
    } as CSSProperties,
    thCentered: {
        textAlign: 'left',
    } as CSSProperties,
    td: {
        padding: '10px 15px',
        border: '1px solid #e0e0e0',
        textAlign: 'left',
        verticalAlign: 'top',
        wordBreak: 'break-word',
    } as CSSProperties,
    tdCentered: {
        textAlign: 'left',
    } as CSSProperties,
    tableRow: {
        backgroundColor: '#fff',
        transition: 'background-color 0.2s ease',
    } as CSSProperties,
    tableRowEven: {
        // backgroundColor: '#f6f6f6',
    } as CSSProperties,
    tableRowHover: {
        backgroundColor: '#f0f0f0',
    } as CSSProperties,
    rowMissedPacket: {
        backgroundColor: '#ffe0b2',
    } as CSSProperties,
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        fontSize: '20px',
        color: '#1890ff',
    } as CSSProperties,
    footerSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 0',
        borderTop: '1px solid #eee',
        marginTop: '15px',
    } as CSSProperties,
    infoText: {
        color: '#666',
    } as CSSProperties,
    paginationContainer: {
        display: 'flex',
        gap: '5px',
        alignItems: 'center',
    } as CSSProperties,
    paginationButton: {
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: '3px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        minWidth: '36px',
        textAlign: 'left',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,
    paginationButtonActive: {
        backgroundColor: '#007bff',
        color: '#fff',
        borderColor: '#007bff',
    } as CSSProperties,
    paginationButtonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
        backgroundColor: '#f9f9f9',
        borderColor: '#eee',
        color: '#999',
    } as CSSProperties,
    sorterIcon: {
        marginLeft: '5px',
        fontSize: '0.8em',
        verticalAlign: 'middle',
        color: '#888',
    } as CSSProperties,
    tag: {
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '3px',
        fontSize: '12px',
        lineHeight: '1',
        fontWeight: 'bold',
    } as CSSProperties,
    tagGreen: {
        backgroundColor: '#e6ffe6',
        color: '#00a854',
        border: '1px solid #c2f0c2',
    } as CSSProperties,
    tagRed: {
        backgroundColor: '#ffe6e6',
        color: '#ff4d4f',
        border: '1px solid #f0c2c2',
    } as CSSProperties,
    columnPickerContainer: {
        position: 'relative',
        display: 'inline-block',
        marginLeft: '10px',
    } as CSSProperties,
    columnPickerDropdown: {
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 200,
        minWidth: '180px',
        padding: '10px 0',
        maxHeight: '300px',
        overflowY: 'auto',
    } as CSSProperties,
    columnPickerItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 15px',
        cursor: 'pointer',
    } as CSSProperties,
    columnPickerItemHover: {
        backgroundColor: '#f5f5f5',
    } as CSSProperties,
    columnPickerCheckbox: {
        marginRight: '8px',
    } as CSSProperties,
    // New style for pause/play button container
    controlButtonsContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginRight: 'auto', // Pushes other items to the right
    } as CSSProperties,
};

// --- Command Mapping (copied from Home.tsx) ---
const commandsMapping = [
    { "name": "CMD_CONNECT", "description": "Kết nối & Trạng thái" },
    { "name": "CMD_VERSION", "description": "Phiên bản Firmware" },
    { "name": "CMD_ADC_CHANNEL1", "description": "Giá trị ADC 1" },
    { "name": "CMD_ADC_CHANNEL2", "description": "Giá trị ADC 2" },
    { "name": "CMD_PUSH_IO_DI1_STATUS", "description": "Trạng thái DI 1" },
    { "name": "CMD_PUSH_IO_DI2_STATUS", "description": "Trạng thái DI 2" },
    { "name": "CMD_PUSH_IO_DI3_STATUS", "description": "Trạng thái DI 3" },
    { "name": "CMD_PUSH_IO_DI4_STATUS", "description": "Trạng thái DI 4" },
    { "name": "CMD_OUTPUT_CHANNEL1", "description": "Trạng thái Output 1" },
    { "name": "CMD_OUTPUT_CHANNEL2", "description": "Trạng thái Output 2" },
    { "name": "CMD_OUTPUT_CHANNEL3", "description": "Trạng thái Output 3" },
    { "name": "CMD_OUTPUT_CHANNEL4", "description": "Trạng thái Output 4" },
    { "name": "CMD_PUSH_MODBUS_RS485", "description": "Dữ liệu Modbus RS485" },
    { "name": "CMD_PUSH_MODBUS_RS232", "description": "Dữ liệu Modbus RS232" },
    { "name": "CMD_PUSH_MODBUS_TCP", "description": "Dữ liệu Modbus TCP" },
    { "name": "CMD_PUSH_SERIAL_RS485", "description": "Dữ liệu Serial RS485" },
    { "name": "CMD_PUSH_SERIAL_RS232", "description": "Dữ liệu Serial RS232" },
    { "name": "CMD_PUSH_SERIAL_TCP", "description": "Dữ liệu Serial TCP" },
    { "name": "CMD_REQUEST_TIMESTAMP", "description": "Yêu cầu Timestamp" },
    { "name": "CMD_PUSH_TCP", "description": "Dữ liệu TCP" },
    { "name": "CMD_PUSH_UDP", "description": "Dữ liệu UDP" },
    { "name": "CMD_PUSH_IO_DI1", "description": "Trạng thái DI 1 (I/O)" },
    { "name": "CMD_PUSH_IO_DI2", "description": "Trạng thái DI 2 (I/O)" },
    { "name": "CMD_PUSH_IO_DI3", "description": "Trạng thái DI 3 (I/O)" },
    { "name": "CMD_PUSH_IO_DI4", "description": "Trạng thái DI 4 (I/O)" },
    { "name": "CMD_PUSH_IO_DI5", "description": "Trạng thái DI 5 (I/O)" },
    { "name": "CMD_PUSH_IO_DI6", "description": "Trạng thái DI 6 (I/O)" },
    { "name": "CMD_PUSH_IO_DI7", "description": "Trạng thái DI 7 (I/O)" },
    { "name": "CMD_PUSH_IO_DI8", "description": "Trạng thái DI 8 (I/O)" },
    { "name": "CMD_PUSH_IO_DO1", "description": "Trạng thái DO 1 (I/O)" },
    { "name": "CMD_PUSH_IO_DO2", "description": "Trạng thái DO 2 (I/O)" },
    { "name": "CMD_PUSH_IO_DO3", "description": "Trạng thái DO 3 (I/O)" },
    { "name": "CMD_PUSH_IO_DO4", "description": "Trạng thái DO 4 (I/O)" },
    { "name": "CMD_PUSH_IO_DO5", "description": "Trạng thái DO 5 (I/O)" },
    { "name": "CMD_PUSH_IO_DO6", "description": "Trạng thái DO 6 (I/O)" },
    { "name": "CMD_PUSH_IO_DO7", "description": "Trạng thái DO 7 (I/O)" },
    { "name": "CMD_PUSH_IO_DO8", "description": "Trạng thái DO 8 (I/O)" },
    { "name": "CMD_PUSH_IO_AI1", "description": "Dữ liệu AI 1 (I/O)" },
    { "name": "CMD_PUSH_IO_AI2", "description": "Dữ liệu AI 2 (I/O)" },
    { "name": "CMD_PUSH_IO_AI3", "description": "Dữ liệu AI 3 (I/O)" },
    { "name": "CMD_PUSH_IO_AI4", "description": "Dữ liệu AI 4 (I/O)" },
    { "name": "CMD_PUSH_IO_AI5", "description": "Dữ liệu AI 5 (I/O)" },
    { "name": "CMD_PUSH_IO_AI6", "description": "Dữ liệu AI 6 (I/O)" },
    { "name": "CMD_PUSH_IO_AI7", "description": "Dữ liệu AI 7 (I/O)" },
    { "name": "CMD_PUSH_IO_AI8", "description": "Dữ liệu AI 8 (I/O)" },
    { "name": "CMD_PUSH_IO_AO1", "description": "Dữ liệu AO 1 (I/O)" },
    { "name": "CMD_PUSH_IO_AO2", "description": "Dữ liệu AO 2 (I/O)" },
    { "name": "CMD_PUSH_IO_AO3", "description": "Dữ liệu AO 3 (I/O)" },
    { "name": "CMD_PUSH_IO_AO4", "description": "Dữ liệu AO 4 (I/O)" },
    { "name": "CMD_PUSH_IO_AO5", "description": "Dữ liệu AO 5 (I/O)" },
    { "name": "CMD_PUSH_IO_AO6", "description": "Dữ liệu AO 6 (I/O)" },
    { "name": "CMD_PUSH_IO_AO7", "description": "Dữ liệu AO 7 (I/O)" },
    { "name": "CMD_PUSH_IO_AO8", "description": "Dữ liệu AO 8 (I/O)" },
    { "name": "CMD_PUSH_IO_RS232", "description": "Dữ liệu RS232 (I/O)" },
    { "name": "CMD_PUSH_IO_RS485", "description": "Dữ liệu RS485 (I/O)" },
    { "name": "CMD_NOTIFY_TCP", "description": "Trạng thái TCP" },
    { "name": "CMD_NOTIFY_UDP", "description": "Trạng thái UDP" },
    { "name": "CMD_PUSH_IO_DI1_PULSE", "description": "Xung DI 1 (I/O)" },
    { "name": "CMD_PUSH_IO_DI2_PULSE", "description": "Xung DI 2 (I/O)" },
    { "name": "CMD_PUSH_IO_DI3_PULSE", "description": "Xung DI 3 (I/O)" },
    { "name": "CMD_PUSH_IO_DI4_PULSE", "description": "Xung DI 4 (I/O)" },
    { "name": "CMD_PUSH_IO_DI1_BUTTON", "description": "Nút DI 1 (I/O)" },
    { "name": "CMD_PUSH_IO_DI2_BUTTON", "description": "Nút DI 2 (I/O)" },
    { "name": "CMD_PUSH_IO_DI3_BUTTON", "description": "Nút DI 3 (I/O)" },
    { "name": "CMD_PUSH_IO_DI4_BUTTON", "description": "Nút DI 4 (I/O)" },
    { "name": "CMD_STATUS_WIFI_WEAK", "description": "Lỗi WiFi Yếu" },
    { "name": "CMD_STATUS_MQTT_LOST", "description": "Lỗi Mất kết nối MQTT" },
    { "name": "CMD_STATUS_WIFI_LOST", "description": "Lỗi Mất WiFi" },

    { "name": "CMD_STATUS_WIFI_WEAK_RECOVERY", "description": "Khôi phục lỗi WiFi Yếu" },
    { "name": "CMD_STATUS_MQTT_LOST_RECOVERY", "description": "Khôi phục lỗi Mất kết nối MQTT" },
    { "name": "CMD_STATUS_WIFI_LOST_RECOVERY", "description": "Khôi phục lỗi Mất WiFi" },
];

const descriptionOptions = commandsMapping.map(cmd => ({ value: cmd.description }));
// --- End Command Mapping ---


const Monitor: React.FC = () => {
    const socket = useSocket();
    const navigate = useNavigate();
    const location = useLocation();

    const [monitorData, setMonitorData] = useState<MonitorDataItem[]>([]);
    const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [entriesPerPage, setEntriesPerPage] = useState<number>(10);

    // Filter state now uses deviceName for user input
    const [appliedFilters, setAppliedFilters] = useState<FilterInputValues>({});
    const [pendingFilters, setPendingFilters] = useState<FilterInputValues>({});

    // New state to store the actual deviceId that will be sent to the API
    const [resolvedDeviceIdToSend, setResolvedDeviceIdToSend] = useState<string | undefined>(undefined);

    // Use a ref to store the mapping from deviceName to deviceId
    // This map will be populated from data received from both API and Socket.IO
    const deviceNameIdMapRef = useRef<Map<string, string>>(new Map());

    const [sorter, setSorter] = useState<{ field: 'timestamp' | 'id'; order: 'asc' | 'desc' }>({
        field: 'timestamp',
        order: 'desc',
    });

    const [pagination, setPagination] = useState<PaginationInfo>({
        method: 'offset',
        totalRecords: 0,
        currentPage: 1,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
        previousCursor: null,
        sortBy: 'timestamp',
        sortOrder: 'desc',
    });

    const allKeysRef = useRef(new Set<string>());

    const [selectedColumnKeys, setSelectedColumnKeys] = useState<Set<string>>(new Set());
    const [isColumnPickerOpen, setIsColumnPickerOpen] = useState<boolean>(false);
    const columnPickerRef = useRef<HTMLDivElement>(null); // Corrected: HTMLDivElement

    const [isPaused, setIsPaused] = useState<boolean>(false);

    // --- State for AutoComplete Options (NEW) ---
    const [deviceOptions, setDeviceOptions] = useState<{ value: string; label: React.ReactNode; deviceId: string }[]>([]);
    const [deviceSearchInput, setDeviceSearchInput] = useState<string>(''); // For the AutoComplete's controlled value

    // --- Helper Functions ---
    const titleCase = useCallback((str: string): string => {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
    }, []);

    // Function to update the deviceNameIdMapRef
    const updateDeviceNameIdMap = useCallback((data: MonitorDataItem[]) => {
        data.forEach(item => {
            if (item.deviceName && item.deviceId) {
                if (!deviceNameIdMapRef.current.has(item.deviceName)) {
                    deviceNameIdMapRef.current.set(item.deviceName, item.deviceId);
                }
            }
        });
        console.log("Updated deviceNameIdMap:", deviceNameIdMapRef.current);
    }, []);

    // buildUrlParams sẽ sử dụng deviceId đã được resolved để gửi lên backend
    const buildUrlParams = useCallback((
        currentAppliedFilters: FilterInputValues, // UI filters (has deviceName for local filtering/UI)
        currentResolvedDeviceId: string | undefined, // The actual ID to send to backend for filtering
        currentPage: number,
        currentLimit: number,
        currentSorterField: 'timestamp' | 'id',
        currentSorterOrder: 'asc' | 'desc'
    ): string => {
        const params = new URLSearchParams();

        // Sử dụng deviceId đã được resolved cho API backend
        if (currentResolvedDeviceId) params.append('deviceId', currentResolvedDeviceId);
        // Khi gửi 'cmd' đến API, cần gửi tên CMD (CMD_CONNECT), không phải mô tả ('Kết nối & Trạng thái')
        if (currentAppliedFilters.cmd) params.append('cmd', currentAppliedFilters.cmd);

        if (currentAppliedFilters.startTime) {
            const momentTime = moment(currentAppliedFilters.startTime);
            if (momentTime.isValid()) params.append('startTime', momentTime.unix().toString());
        }
        if (currentAppliedFilters.endTime) {
            const momentTime = moment(currentAppliedFilters.endTime);
            if (momentTime.isValid()) params.append('endTime', momentTime.unix().toString());
        }

        params.append('page', currentPage.toString());
        params.append('limit', currentLimit.toString());
        params.append('sortBy', currentSorterField);
        params.append('sortOrder', currentSorterOrder);

        // For URL persistence, you might still want deviceName in URL if it's the primary UI input
        // This will allow refreshing the page to keep the deviceName input value
        if (currentAppliedFilters.deviceName) {
            params.append('deviceName', currentAppliedFilters.deviceName);
        }

        return params.toString();
    }, []);

    // --- API Calls (NEW / Adapted from Home.tsx) ---
    const fetchDeviceListApi = async (): Promise<DeviceListItem[]> => {
        const url = `${API_DASHBOARD_PREFIX}/devices`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch device list: ${response.statusText}`);
        }
        return response.json();
    };

    // --- Column Generation Logic ---
    const generateColumns = useCallback((currentData: MonitorDataItem[]) => {
        const fixedColumns: TableColumn[] = [
            { title: 'STT', dataIndex: 'stt', key: 'stt', hideable: false },
            { title: 'Tên thiết bị', dataIndex: 'deviceName', key: 'deviceName', sortable: false, hideable: true },
            { title: 'MAC', dataIndex: 'mac', key: 'mac', sortable: false, hideable: true },
            { title: 'Lệnh', dataIndex: 'cmd', key: 'cmd', sortable: false, hideable: true },
            { title: 'Thời gian', dataIndex: 'timestamp', key: 'timestamp', sortable: true, hideable: true },
        ];

        const newKeysFromData = new Set<string>();
        currentData.forEach(item => {
            Object.keys(item).forEach(key => newKeysFromData.add(key));
        });

        const previouslyKnownKeys = new Set(allKeysRef.current);

        newKeysFromData.forEach(key => {
            if (!allKeysRef.current.has(key)) {
                allKeysRef.current.add(key);
            }
        });

        const preferredOrder = ['deviceName', 'mac', 'cmd', 'status', 'timestamp', 'value', '_id'];
        const hiddenKeys = new Set(['isMissed', 'deviceId', 'key', '__v', '_id']); // deviceId vẫn ẩn

        const sortedDynamicKeys = Array.from(allKeysRef.current).sort((a, b) => {
            const indexA = preferredOrder.indexOf(a);
            const indexB = preferredOrder.indexOf(b);

            if (hiddenKeys.has(a) && hiddenKeys.has(b)) return 0;
            if (hiddenKeys.has(a)) return 1;
            if (hiddenKeys.has(b)) return -1;

            if (indexA === -1 && indexB === -1) {
                return a.localeCompare(b);
            }
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        const dynamicColumns: TableColumn[] = sortedDynamicKeys
            .filter(key => !hiddenKeys.has(key) && !fixedColumns.some(fCol => fCol.key === key))
            .map(key => ({
                title: titleCase(key),
                dataIndex: key,
                key: key,
                sortable: ['timestamp', '_id'].includes(key),
                hideable: true,
            }));

        const finalColumns = [
            ...fixedColumns,
            ...dynamicColumns,
        ];

        setTableColumns(finalColumns);

        setSelectedColumnKeys(prevKeys => {
            if (prevKeys.size === 0) {
                return new Set(finalColumns.filter(c => c.hideable !== false || c.key === 'stt').map(c => c.key));
            } else {
                const newSet = new Set<string>();
                // Sửa lỗi: Thay revKeys bằng previouslyKnownKeys
                previouslyKnownKeys.forEach(key => {
                    if (finalColumns.some(col => col.key === key)) {
                        newSet.add(key); // Changed from col.key to key
                    }
                });
                newSet.add('stt'); // Đảm bảo STT luôn được chọn
                finalColumns.forEach(col => {
                    if (col.hideable !== false && !previouslyKnownKeys.has(col.key)) {
                        newSet.add(col.key);
                    }
                });
                return newSet;
            }
        });
    }, [titleCase]);

    // --- Data Fetching Logic ---
    const fetchData = useCallback(async (
        {
            page: reqPage = 1,
            limit: reqLimit = entriesPerPage,
            sortBy: reqSortBy = sorter.field,
            sortOrder: reqSortOrder = sorter.order,
            resolvedDeviceId: reqResolvedDeviceId, // Nhận deviceId đã được resolved từ handleApplyFilters
            cmd: reqCmd,
            startTime: reqStartTime,
            endTime: reqEndTime,
        }: {
            page?: number;
            limit?: number;
            sortBy?: 'timestamp' | 'id';
            sortOrder?: 'asc' | 'desc';
            resolvedDeviceId?: string; // Tham số mới
            cmd?: string;
            startTime?: string;
            endTime?: string;
        } = {}
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', reqPage.toString());
            params.append('limit', reqLimit.toString());
            params.append('direction', 'jump');
            params.append('sortBy', reqSortBy);
            params.append('sortOrder', reqSortOrder);

            // Gửi deviceId đã được resolved cho API backend
            if (reqResolvedDeviceId) {
                params.append('deviceId', reqResolvedDeviceId);
            }
            if (reqCmd) params.append('cmd', reqCmd);

            if (reqStartTime) {
                const momentTime = moment(reqStartTime);
                if (momentTime.isValid()) {
                    params.append('startTime', momentTime.unix().toString());
                } else {
                    console.warn("Invalid start time format, not sending to API:", reqStartTime);
                }
            }
            if (reqEndTime) {
                const momentTime = moment(reqEndTime);
                if (momentTime.isValid()) {
                    params.append('endTime', momentTime.unix().toString());
                } else {
                    console.warn("Invalid end time format, not sending to API:", reqEndTime);
                }
            }

            const fetchUrl = `${API_BASE_URL}/api/iots/statistics?${params.toString()}`;
            console.log("Fetching data with URL:", fetchUrl);

            const response = await fetch(fetchUrl);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Lỗi khi tải dữ liệu');
            }

            const dataWithKeys: MonitorDataItem[] = result.data.map((item: MonitorDataItem, index: number) => {
                return {
                    ...item,
                    key: `${item._id || item.timestamp}-${Date.now()}-${index}`,
                };
            });

            setMonitorData(dataWithKeys);
            setPagination(prev => ({
                ...prev,
                totalRecords: result.pagination.totalRecords !== undefined ? result.pagination.totalRecords : 0,
                currentPage: result.pagination.currentPage !== undefined ? result.pagination.currentPage : reqPage,
                pageSize: reqLimit,
                hasNextPage: result.pagination.hasNextPage,
                hasPreviousPage: result.pagination.hasPreviousPage,
                sortBy: result.pagination.sortBy,
                sortOrder: result.pagination.sortOrder,
                nextCursor: null,
                previousCursor: null,
            }));

            generateColumns(dataWithKeys);
            updateDeviceNameIdMap(dataWithKeys); // Update map with newly fetched data

        } catch (error: unknown) {
            console.error("Lỗi khi tải dữ liệu:", error);
            if (error instanceof Error) {
                message.error(`${error.message}`); // Use Antd message
            } else {
                message.error('Đã xảy ra lỗi không xác định khi tải dữ liệu.'); // Use Antd message
            }
            setMonitorData([]);
            setPagination(prev => ({ ...prev, totalRecords: 0, currentPage: 1, hasNextPage: false, hasPreviousPage: false }));
        } finally {
            setLoading(false);
        }
    }, [entriesPerPage, sorter.field, sorter.order, generateColumns, updateDeviceNameIdMap]);

    // --- Socket.IO Event Handler ---
    const handleSocketEventMonitor = useCallback((eventData: MonitorDataItem) => {
        if (isPaused) {
            console.log("Dữ liệu socket bị tạm dừng, không thêm vào bảng.");
            return;
        }

        console.log("Dữ liệu nhận từ socket:", eventData);

        const { deviceName, cmd, startTime, endTime } = appliedFilters;

        let passesFilter = true;

        // Lọc theo deviceName (user input)
        if (deviceName) {
            if (!eventData.deviceName || !eventData.deviceName.toLowerCase().includes(deviceName.toLowerCase())) {
                passesFilter = false;
            }
        }

        // Nếu có resolvedDeviceIdToSend (tức là đã có lọc theo ID từ backend cho fetch ban đầu)
        // thì dữ liệu socket cũng phải khớp với ID đó.
        if (passesFilter && resolvedDeviceIdToSend) {
            if (eventData.deviceId !== resolvedDeviceIdToSend) {
                passesFilter = false;
            }
        }

        if (passesFilter && cmd) {
            if (!eventData.cmd || !eventData.cmd.includes(cmd)) {
                passesFilter = false;
            }
        }

        const eventTimestampInSeconds = eventData.timestamp;

        if (passesFilter && startTime) {
            const filterStartTimeMoment = moment(startTime);
            if (filterStartTimeMoment.isValid() && eventTimestampInSeconds < filterStartTimeMoment.unix()) {
                passesFilter = false;
            }
        }

        if (passesFilter && endTime) {
            const filterEndTimeMoment = moment(endTime);
            if (filterEndTimeMoment.isValid() && eventTimestampInSeconds > filterEndTimeMoment.unix()) {
                passesFilter = false;
            }
        }

        if (!passesFilter) {
            console.log("Dữ liệu từ socket không phù hợp với bộ lọc hiện tại.");
            return;
        }

        if (pagination.currentPage === 1 && sorter.field === 'timestamp' && sorter.order === 'desc') {
            const rowKey = eventData._id || `${eventData.timestamp || Date.now()}-${eventData.deviceId || 'unknown'}-${Math.random().toString(36).substr(2, 9)}`;

            const dataWithKey = {
                ...eventData,
                key: rowKey,
            };

            setMonitorData(prevData => {
                const newData = [dataWithKey, ...prevData];
                return newData.slice(0, pagination.pageSize);
            });
            generateColumns([dataWithKey]);
            updateDeviceNameIdMap([dataWithKey]); // Update map with new socket data

            setPagination(prev => ({
                ...prev,
                totalRecords: prev.totalRecords + 1,
            }));

        } else {
            console.log("Dữ liệu từ socket phù hợp bộ lọc nhưng không thêm vào vì không ở trang 1 hoặc sắp xếp khác.");
        }
    }, [appliedFilters, pagination.currentPage, pagination.pageSize, sorter.field, sorter.order, generateColumns, isPaused, updateDeviceNameIdMap, resolvedDeviceIdToSend]);

    // --- Effects ---

    // Effect to read URL params and set initial state
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const initialFilters: FilterInputValues = {
            deviceName: params.get('deviceName') || '',
            cmd: params.get('cmd') || '',
            startTime: '',
            endTime: '',
        };

        const rawStartTime = params.get('startTime');
        if (rawStartTime) {
            const momentTime = moment.unix(parseInt(rawStartTime));
            if (momentTime.isValid()) {
                initialFilters.startTime = momentTime.format('YYYY-MM-DDTHH:mm:ss');
            }
        }
        const rawEndTime = params.get('endTime');
        if (rawEndTime) {
            const momentTime = moment.unix(parseInt(rawEndTime));
            if (momentTime.isValid()) {
                initialFilters.endTime = momentTime.format('YYYY-MM-DDTHH:mm:ss');
            }
        }

        const initialPage = parseInt(params.get('page') || '1');
        const initialLimit = parseInt(params.get('limit') || '10');
        const initialSortBy = (params.get('sortBy') as 'timestamp' | 'id') || 'timestamp';
        const initialSortOrder = (params.get('sortOrder') as 'asc' | 'desc') || 'desc';

        setPendingFilters(initialFilters); // Update pending filters for UI
        setDeviceSearchInput(initialFilters.deviceName || ''); // Set AutoComplete input value

        // For initial load, try to resolve deviceId based on deviceName from URL
        const initialDeviceName = initialFilters.deviceName;
        if (initialDeviceName) {
            const resolvedIdFromMap = deviceNameIdMapRef.current.get(initialDeviceName);
            if (resolvedIdFromMap) {
                setResolvedDeviceIdToSend(resolvedIdFromMap);
            } else {
                // If not in map, might need to fetch device list first, or allow fetchData to resolve later.
                // For robustness, could consider fetching single device by name here if needed.
                console.warn(`Could not immediately resolve device ID for name "${initialDeviceName}" from URL.`);
            }
        } else {
            setResolvedDeviceIdToSend(undefined);
        }

        setAppliedFilters(initialFilters);
        setPagination(prev => ({
            ...prev,
            currentPage: initialPage,
            pageSize: initialLimit,
        }));
        setEntriesPerPage(initialLimit);
        setSorter({ field: initialSortBy, order: initialSortOrder });

    }, [location.search]);

    // Effect to fetch initial device list for AutoComplete options (NEW)
    useEffect(() => {
        const loadDevices = async () => {
            try {
                const devices = await fetchDeviceListApi();
                const options = devices.map(device => ({
                    value: `${device.name}${device.mac ? ` (${device.mac})` : ''}`, // Display name (MAC)
                    label: (
                        <div>
                            <strong>{device.name}</strong> {device.mac && `(${device.mac})`}
                            <br />
                            <small style={{ color: '#666' }}>ID: {device.id}</small>
                        </div>
                    ),
                    deviceId: device.id // Store actual deviceId to send to API
                }));
                setDeviceOptions(options);

                // After loading devices, try to resolve the initial deviceName if set from URL
                if (pendingFilters.deviceName) {
                    const resolvedIdFromFetch = devices.find(d => d.name === pendingFilters.deviceName || d.mac === pendingFilters.deviceName)?.id;
                    if (resolvedIdFromFetch) {
                        setResolvedDeviceIdToSend(resolvedIdFromFetch);
                    }
                }

            } catch (err) {
                console.error("Failed to load device list:", err);
                message.error("Không thể tải danh sách thiết bị.");
            }
        };
        loadDevices();
    }, []); // Empty dependency array means this runs once on mount

    // Effect to fetch monitoring data when filters, sorter, pagination change
    useEffect(() => {
        const currentFilters: Parameters<typeof fetchData>[0] = {
            page: pagination.currentPage,
            limit: entriesPerPage,
            sortBy: sorter.field,
            sortOrder: sorter.order,
            resolvedDeviceId: resolvedDeviceIdToSend, // Pass the resolved ID to fetchData
            cmd: appliedFilters.cmd, // Other filters from appliedFilters
            startTime: appliedFilters.startTime,
            endTime: appliedFilters.endTime,
        };
        fetchData(currentFilters);
    }, [entriesPerPage, appliedFilters.cmd, appliedFilters.startTime, appliedFilters.endTime, sorter, pagination.currentPage, fetchData, resolvedDeviceIdToSend]);

    // Effect for Socket.IO event listener
    useEffect(() => {
        if (socket) {
            socket.on("server_emit_monitor", handleSocketEventMonitor);
        }
        return () => {
            if (socket) {
                socket.off("server_emit_monitor", handleSocketEventMonitor);
            }
        };
    }, [socket, handleSocketEventMonitor]);

    // Effect to close column picker dropdown when clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnPickerRef.current && !columnPickerRef.current.contains(event.target as Node)) {
                setIsColumnPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // --- Handlers ---

    // Handle change for text inputs (deviceName, cmd)
    // For AutoComplete, onChange is called with the value in the input box.
    // onSelect is called when an option is chosen.
    const handleDeviceSearch = useCallback((value: string) => {
        setDeviceSearchInput(value); // Update the controlled input
        setPendingFilters(prev => ({ ...prev, deviceName: value })); // Update pending filter value
    }, []);

    const handleDeviceSelect = useCallback((value: string) => {
        setDeviceSearchInput(value); // Set selected value to input
        setPendingFilters(prev => ({ ...prev, deviceName: value })); // Update pending filter
        // setResolvedDeviceIdToSend(option.deviceId); // Set the actual ID for API calls
    }, []);

    const handleDeviceClear = useCallback(() => {
        setDeviceSearchInput('');
        setPendingFilters(prev => ({ ...prev, deviceName: '' }));
        setResolvedDeviceIdToSend(undefined);
    }, []);

    const handleCmdSearch = useCallback((value: string) => {
        // Find the actual command name from its description for pendingFilters
        const foundCmdName = commandsMapping.find(cmd => cmd.description.toLowerCase() === value.toLowerCase())?.name || value;
        setPendingFilters(prev => ({ ...prev, cmd: foundCmdName }));
    }, []);

    const handleCmdSelect = useCallback((value: string) => {
        // On select, the value is the description, find the command name
        const foundCmdName = commandsMapping.find(cmd => cmd.description.toLowerCase() === value.toLowerCase())?.name || value;
        setPendingFilters(prev => ({ ...prev, cmd: foundCmdName }));
    }, []);

    const handleCmdClear = useCallback(() => {
        setPendingFilters(prev => ({ ...prev, cmd: '' }));
    }, []);

    // Handle change for DatePicker inputs (startTime, endTime)
    const handleDateFilterChange = useCallback((field: 'startTime' | 'endTime', date: Moment | null) => {
        setPendingFilters(prev => ({
            ...prev,
            [field]: date && date.isValid() ? date.format('YYYY-MM-DDTHH:mm:ss') : ''
        }));
    }, []);

    const handleApplyFilters = useCallback(() => {
        setLoading(true); // Start loading state while resolving ID
        const newAppliedFilters = { ...pendingFilters }; // Capture pending filters for this application

        let resolvedId: string | undefined = undefined;
        if (newAppliedFilters.deviceName) {
            // Try to get deviceId from the deviceNameIdMapRef (from loaded data/socket events)
            resolvedId = deviceNameIdMapRef.current.get(newAppliedFilters.deviceName);

            // If not found in map, try to find in current deviceOptions by matching its 'value' (display string)
            // dOption.value typically includes both name and MAC, e.g., "Device A (AA:BB:CC)"
            if (!resolvedId && deviceOptions.length > 0) {
                const inputNameLower = newAppliedFilters.deviceName?.toLowerCase();
                // Check if the inputNameLower is explicitly the deviceName or mac for stricter matching
                const foundOption = deviceOptions.find(dOption =>
                        inputNameLower && (dOption.value.toLowerCase() === inputNameLower ||
                            (dOption.label as any)?.props?.children?.some((child: any) =>
                                typeof child === 'string' && child.toLowerCase().includes(inputNameLower)
                            ) ||
                            dOption.deviceId.toLowerCase().includes(inputNameLower)
                        )
                );
                if (foundOption) {
                    resolvedId = foundOption.deviceId;
                }
            }

            if (!resolvedId) {
                message.warning(`"${newAppliedFilters.deviceName}" là tên hoặc MAC thiết bị không hợp lệ.`);
                setLoading(false);
                return;
            }
        }
        setResolvedDeviceIdToSend(resolvedId); // Update the state with the resolved ID

        setAppliedFilters(newAppliedFilters); // Apply the pending filters to active filters
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1 on filter change

        const newParams = buildUrlParams(
            newAppliedFilters,       // UI filters (e.g., cmd, dates, and deviceName for URL if desired for persistence)
            resolvedId,              // The actual deviceId to be used in the URL parameter
            1,                       // Reset to page 1
            entriesPerPage,
            sorter.field,
            sorter.order
        );
        navigate(`?${newParams}`);
        // fetchData will be called by useEffect after resolvedDeviceIdToSend and appliedFilters update
        setLoading(false);
    }, [pendingFilters, entriesPerPage, sorter.field, sorter.order, buildUrlParams, navigate, deviceOptions]); // Added deviceOptions to dependencies

    const handleClearFilters = useCallback(() => {
        setPendingFilters({});
        setAppliedFilters({});
        setResolvedDeviceIdToSend(undefined); // Clear resolved ID
        setDeviceSearchInput(''); // Clear device search input
        setPagination(prev => ({ ...prev, currentPage: 1 }));

        const newParams = buildUrlParams(
            {},        // Empty UI filters for URL
            undefined, // No resolved deviceId for URL
            1,
            entriesPerPage,
            sorter.field,
            sorter.order
        );
        navigate(`?${newParams}`);
    }, [entriesPerPage, sorter.field, sorter.order, buildUrlParams, navigate]);

    const handleSorterChange = useCallback((field: string) => {
        if (field === 'timestamp' || field === '_id') {
            setSorter(prev => {
                const newField = field === '_id' ? 'id' : field as 'timestamp' | 'id';
                const newOrder = prev.field === newField && prev.order === 'desc' ? 'asc' : 'desc';

                const newParams = buildUrlParams(
                    appliedFilters,
                    resolvedDeviceIdToSend, // Pass resolvedDeviceId
                    1, // Reset to page 1 on sort change
                    entriesPerPage,
                    newField,
                    newOrder
                );
                navigate(`?${newParams}`);

                return {
                    field: newField,
                    order: newOrder,
                };
            });
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        } else {
            console.warn(`Sắp xếp theo cột '${field}' hiện không được hỗ trợ.`);
        }
    }, [appliedFilters, entriesPerPage, resolvedDeviceIdToSend, buildUrlParams, navigate]);

    const handlePaginationButtonClick = useCallback((page: number | 'prev' | 'next' | 'last') => {
        const totalPages = pagination.totalRecords !== undefined
            ? Math.ceil(pagination.totalRecords / entriesPerPage)
            : 1;

        let targetPage = pagination.currentPage;

        if (typeof page === 'number') {
            targetPage = page;
        } else if (page === 'prev') {
            targetPage = pagination.currentPage - 1;
        }
        else if (page === 'next') {
            targetPage = pagination.currentPage + 1;
        } else if (page === 'last') {
            targetPage = totalPages;
        }

        targetPage = Math.max(1, Math.min(totalPages, targetPage));

        if (targetPage !== pagination.currentPage) {
            setPagination(prev => {
                const newPage = targetPage;
                const newParams = buildUrlParams(
                    appliedFilters,
                    resolvedDeviceIdToSend, // Pass resolvedDeviceId
                    newPage,
                    entriesPerPage,
                    sorter.field,
                    sorter.order
                );
                navigate(`?${newParams}`);
                return { ...prev, currentPage: newPage };
            });
        }
    }, [pagination.currentPage, pagination.totalRecords, entriesPerPage, appliedFilters, resolvedDeviceIdToSend, sorter.field, sorter.order, buildUrlParams, navigate]);

    const renderPageNumbers = useCallback(() => {
        const totalPages = pagination.totalRecords !== undefined
            ? Math.ceil(pagination.totalRecords / entriesPerPage)
            : 1;
        const currentPage = pagination.currentPage;
        const pageNumbers: (number | string)[] = [];
        const maxPagesToShow = 5;

        if (totalPages <= 1) return null;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);

            let startMiddle = Math.max(2, currentPage - Math.floor((maxPagesToShow - 3) / 2));
            let endMiddle = Math.min(totalPages - 1, currentPage + Math.ceil((maxPagesToShow - 3) / 2));

            if (currentPage <= Math.ceil(maxPagesToShow / 2) + 1) {
                endMiddle = maxPagesToShow - 1;
                startMiddle = 2;
            } else if (currentPage >= totalPages - Math.floor(maxPagesToShow / 2)) {
                startMiddle = totalPages - (maxPagesToShow - 2);
                endMiddle = totalPages - 1;
            }

            if (startMiddle > 2) {
                pageNumbers.push('...');
            }

            for (let i = startMiddle; i <= endMiddle; i++) {
                pageNumbers.push(i);
            }

            if (endMiddle < totalPages - 1) {
                pageNumbers.push('...');
            }

            if (totalPages > 1 && !pageNumbers.includes(totalPages)) {
                pageNumbers.push(totalPages);
            }
        }

        const finalPageNumbers = pageNumbers.filter((item, index, arr) => !(item === '...' && arr[index - 1] === '...'));

        return finalPageNumbers.map((p, idx) => (
            <button
                key={`page-${p}-${idx}`}
                style={{
                    ...styles.paginationButton,
                    ...(p === currentPage ? styles.paginationButtonActive : {}),
                    ...(typeof p !== 'number' ? styles.paginationButtonDisabled : {})
                }}
                onClick={() => typeof p === 'number' && handlePaginationButtonClick(p)}
                disabled={typeof p !== 'number' || loading}
                data-tooltip-id="global-tooltip"
                data-tooltip-content={`Trang ${p}`}
            >
                {p}
            </button>
        ));
    }, [pagination.totalRecords, pagination.currentPage, entriesPerPage, loading, handlePaginationButtonClick]);

    const handleColumnToggle = useCallback((columnKey: string, isChecked: boolean) => {
        setSelectedColumnKeys(prev => {
            const newSet = new Set(prev);
            if (columnKey === 'stt') { // STT column should always be visible and cannot be toggled
                return newSet;
            }
            if (isChecked) {
                newSet.add(columnKey);
            } else {
                newSet.delete(columnKey);
            }
            return newSet;
        });
    }, []);

    // New handler for pause/play
    const togglePause = useCallback(() => {
        setIsPaused(prev => !prev);
    }, []);


    const totalRecords = pagination.totalRecords || 0;
    const startIndex = totalRecords > 0 ? (pagination.currentPage - 1) * pagination.pageSize + 1 : 0;
    const endIndex = Math.min(startIndex + pagination.pageSize - 1, totalRecords);

    // Tính toán tổng số trang cho hiển thị ở footer
    const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / entriesPerPage) : 1;


    return (
        <div style={styles.container}>
            <h2>Giám sát dữ liệu</h2>

            {/* Filter Panel */}
            <div style={styles.filterPanel}>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel} htmlFor="filterDeviceName">Tên thiết bị</label>
                    <AutoComplete
                        options={deviceOptions}
                        style={{ width: '250px', borderRadius: 0 }} // Adjusted width to match other inputs
                        onSearch={handleDeviceSearch}
                        onSelect={handleDeviceSelect}
                        // onChange is important for clearing or typing non-suggested text
                        onChange={handleDeviceSearch}
                        value={deviceSearchInput}
                        placeholder="Tìm theo tên hoặc MAC"
                        allowClear
                        size="large"
                        filterOption={(inputValue, option) => {
                            // option here is of type { value: string; label: React.ReactNode; deviceId: string }
                            // @ts-ignore
                            const optionText = String(option.value || '').toLowerCase(); // This holds "Device Name (MAC)"
                            const input = inputValue.toLowerCase();
                            return optionText.includes(input);
                        }}
                        onClear={handleDeviceClear}
                        disabled={loading}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel} htmlFor="filterCmd">Lệnh</label>
                    <AutoComplete
                        options={descriptionOptions}
                        style={{ width: '250px', borderRadius: 0 }} // Adjusted width
                        onSearch={handleCmdSearch}
                        onSelect={handleCmdSelect}
                        // For controlled component, onChange should update the state
                        onChange={(value) => {
                            // When typing, value is the description string.
                            // We store the command name (CMD_xxx) in pendingFilters.cmd.
                            const foundCmdName = commandsMapping.find(cmd => cmd.description.toLowerCase() === value.toLowerCase())?.name || value;
                            setPendingFilters(prev => ({ ...prev, cmd: foundCmdName }));
                        }}
                        // Display the description in the input, but store cmd.name in state
                        value={pendingFilters.cmd ? (commandsMapping.find(c => c.name === pendingFilters.cmd)?.description || pendingFilters.cmd) : ''}
                        placeholder="VD: Kết nối & Trạng thái"
                        allowClear
                        size="large"
                        filterOption={(inputValue, option) =>
                            // option here is of type { value: string; label: string }
                            String(option?.value || '').toUpperCase().indexOf(inputValue.toUpperCase()) !== -1 // Fixed option potentially undefined
                        }
                        onClear={handleCmdClear}
                        disabled={loading}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Thời gian</label>
                    <div style={styles.filterDateRange}>
                        <DatePicker
                            value={pendingFilters.startTime ? moment(pendingFilters.startTime) : null}
                            onChange={(date: Moment | null) => handleDateFilterChange('startTime', date)}
                            showTime={{ format: 'HH:mm:ss' }}
                            format="DD-MM-YYYY HH:mm:ss"
                            allowClear
                            style={{ ...styles.filterInput, width: '250px', height: '40px' }} // Adjusted width
                            placeholder="Thời gian bắt đầu"
                            disabled={loading}
                        />
                        <DatePicker
                            value={pendingFilters.endTime ? moment(pendingFilters.endTime) : null}
                            onChange={(date: Moment | null) => handleDateFilterChange('endTime', date)}
                            showTime={{ format: 'HH:mm:ss' }}
                            format="DD-MM-YYYY HH:mm:ss"
                            allowClear
                            style={{ ...styles.filterInput, width: '250px', height: '40px' }} // Adjusted width
                            placeholder="Thời gian kết thúc"
                            disabled={loading}
                        />
                    </div>
                </div>
                <div style={styles.filterActions}>
                    <Button
                        type="primary"
                        onClick={handleApplyFilters}
                        disabled={loading}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Áp dụng các bộ lọc đã chọn"
                        icon={<FaFilter />}
                        size="large" // Make it match other inputs
                        className="button-form"
                    >
                        Áp dụng Bộ lọc
                    </Button>
                    <Button
                        onClick={handleClearFilters}
                        disabled={loading}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Xóa tất cả bộ lọc"
                        icon={<FaTimes />}
                        size="large" // Make it match other inputs
                        className="button-form"
                    >
                        Xóa Bộ lọc
                    </Button>
                </div>
            </div>

            {/* Header Section (Pause/Play, Entries per page, Column Picker) */}
            <div style={styles.headerSection}>
                <div style={styles.controlButtonsContainer}>
                    <Button
                        type={isPaused ? 'primary' : 'default'}
                        onClick={togglePause}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content={isPaused ? "Tiếp tục nhận dữ liệu" : "Tạm dừng nhận dữ liệu"}
                        icon={isPaused ? <FaPlay /> : <FaPause />}
                        size="large"
                        className="button-form"
                    >
                        {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                    </Button>
                </div>

                <div style={styles.entriesDropdown}>
                    <span>Hiển thị</span>
                    <select
                        style={styles.entriesSelect}
                        value={entriesPerPage}
                        onChange={(e) => {
                            const newLimit = parseInt(e.target.value);
                            setEntriesPerPage(newLimit);
                            setPagination(prev => {
                                const newPage = 1; // Reset to page 1 when changing limit
                                const newParams = buildUrlParams(
                                    appliedFilters,
                                    resolvedDeviceIdToSend, // Pass resolvedDeviceId
                                    newPage,
                                    newLimit,
                                    sorter.field,
                                    sorter.order
                                );
                                navigate(`?${newParams}`);
                                return { ...prev, currentPage: newPage };
                            });
                        }}
                        disabled={loading}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Số bản ghi hiển thị trên mỗi trang"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span>bản ghi</span>
                </div>

                <div style={styles.columnPickerContainer} ref={columnPickerRef}>
                    <Button
                        onClick={() => setIsColumnPickerOpen(prev => !prev)}
                        disabled={loading}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Chọn các cột để hiển thị/ẩn"
                        icon={<FaColumns />}
                        size="large"
                        className="button-form"
                    >
                        Chọn cột hiển thị
                    </Button>
                    {isColumnPickerOpen && (
                        <div style={styles.columnPickerDropdown}>
                            {tableColumns
                                .filter(col => col.hideable !== false) // Only show hideable columns in the picker
                                .map(column => (
                                    <div
                                        key={`col-picker-${column.key}`}
                                        style={styles.columnPickerItem}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.columnPickerItemHover.backgroundColor as string)}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <input
                                            type="checkbox"
                                            id={`col-toggle-${column.key}`}
                                            style={styles.columnPickerCheckbox}
                                            checked={selectedColumnKeys.has(column.key)}
                                            onChange={(e) => handleColumnToggle(column.key, e.target.checked)}
                                            disabled={loading || column.key === 'stt'} // Disable STT checkbox
                                        />
                                        <label htmlFor={`col-toggle-${column.key}`}>
                                            {column.title}
                                            {column.key === 'stt' && " (luôn hiển thị)"} {/* Add note for STT */}
                                        </label>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Data Table Wrapper */}
            <div style={styles.tableWrapper}>
                {loading && (
                    <div style={styles.loadingOverlay}>
                        Đang tải dữ liệu...
                    </div>
                )}
                <table style={styles.table}>
                    <thead>
                    <tr>
                        {tableColumns
                            .filter(column => selectedColumnKeys.has(column.key))
                            .map(column => (
                                <th
                                    key={column.key}
                                    style={{
                                        ...styles.th,
                                        ...(column.key === 'stt' ? styles.thCentered : {}),
                                        ...(column.sortable ? { cursor: 'pointer' } : { cursor: 'default' }),
                                    }}
                                    onClick={() => column.sortable && handleSorterChange(column.key)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent : 'space-between' }}>
                                        {column.title}
                                        {column.sortable && (
                                            <span style={styles.sorterIcon}>
                                                {sorter.field === column.key && sorter.order === 'asc' ? '▲' :
                                                    sorter.field === column.key && sorter.order === 'desc' ? '▼' : '⇅'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                    </tr>
                    </thead>
                    <tbody>
                    {monitorData.length === 0 && !loading ? (
                        <tr>
                            <td colSpan={tableColumns.filter(column => selectedColumnKeys.has(column.key)).length} style={{ ...styles.td, textAlign: 'left' }}>
                                Không có dữ liệu để hiển thị.
                            </td>
                        </tr>
                    ) : (
                        monitorData.map((item, index) => (
                            <tr
                                key={item.key}
                                style={{
                                    ...styles.tableRow,
                                    ...(item.isMissed ? styles.rowMissedPacket : (index % 2 === 0 ? {} : styles.tableRowEven))
                                }}
                            >
                                {tableColumns
                                    .filter(column => selectedColumnKeys.has(column.key))
                                    .map(column => (
                                        <td
                                            key={column.key}
                                            style={{
                                                ...styles.td,
                                                ...(column.key === 'stt' ? styles.tdCentered : {}),
                                            }}
                                        >
                                            {(() => {
                                                if (column.key === 'stt') {
                                                    return (pagination.currentPage - 1) * pagination.pageSize + index + 1;
                                                }

                                                const displayValue = item[column.dataIndex as keyof MonitorDataItem];

                                                if ((column.key === 'timestamp' || column.key === 'recovery_time') && typeof displayValue === 'number') {
                                                    return moment(displayValue * 1000).format('DD-MM-YYYY HH:mm:ss');
                                                }
                                                if (typeof displayValue === 'boolean') {
                                                    return <span style={{ ...styles.tag, ...(displayValue ? styles.tagGreen : styles.tagRed) }}>{displayValue ? 'TRUE' : 'FALSE'}</span>;
                                                }
                                                if (displayValue === null || typeof displayValue === 'undefined' || (typeof displayValue === 'string' && displayValue.trim() === '')) {
                                                    return '-';
                                                }
                                                return String(displayValue);
                                            })()}
                                        </td>
                                    ))}
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Footer Section (Pagination) */}
            <div style={styles.footerSection}>
                <div style={styles.infoText}>
                    Hiển thị {startIndex} đến {endIndex} trên tổng số {totalRecords} bản ghi.
                    <br />
                    Tổng số trang: {totalPages}
                </div>
                <div style={styles.paginationContainer}>
                    {renderPageNumbers()}
                    <button
                        style={{ ...styles.paginationButton, ...(!pagination.hasNextPage || loading ? styles.paginationButtonDisabled : {}) }}
                        onClick={() => handlePaginationButtonClick('next')}
                        disabled={!pagination.hasNextPage || loading}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Trang tiếp theo"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            </div>
            <Tooltip id="global-tooltip" />
        </div>
    );
}

export default Monitor;