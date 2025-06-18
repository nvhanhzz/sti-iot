import React, { useCallback, useEffect, useState, useRef, CSSProperties } from "react";
import { useSocket } from "../../../context/SocketContext";
import moment, { Moment } from "moment";
import { useLocation, useNavigate } from 'react-router-dom';

import { DatePicker } from 'antd';
import 'antd/dist/reset.css'; // For Ant Design v5. For v4: 'antd/dist/antd.css'

import ClearableInput from './ClearableInput'; // Keep this for text inputs
import "./Monitor.css";

// Import React Icons
import { FaFilter, FaTimes, FaColumns, FaPlay, FaPause, FaChevronRight } from 'react-icons/fa';
// Import Tooltip from react-tooltip
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'; // Import tooltip CSS

// --- Interfaces ---

interface MonitorDataItem {
    _id: string;
    isMissed?: boolean;
    cmd?: string;
    deviceId: string;
    deviceName?: string;
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

type FilterInputValues = {
    deviceId?: string;
    cmd?: string;
    startTime?: string;
    endTime?: string;
};


// --- Hằng số ---
const API_BASE_URL = 'http://localhost:3335/api';

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
    filterInput: { // This style will be passed to Ant Design DatePicker via its `style` prop
        padding: '10px 12px', // Ant Design already has good padding, but can override
        border: '1px solid #ddd', // Ant Design inputs have their own borders
        borderRadius: '3px',
        fontSize: '14px',
        // width: '200px', // Set width directly on DatePicker style prop
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
        display: 'flex', // Added for icon alignment
        alignItems: 'center', // Added for icon alignment
        gap: '5px', // Space between icon and text if any
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
        backgroundColor: '#f6f6f6',
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
        display: 'flex', // For icon alignment
        alignItems: 'center', // For icon alignment
        justifyContent: 'center', // For icon centering
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

const Monitor: React.FC = () => {
    const socket = useSocket();
    const navigate = useNavigate();
    const location = useLocation();

    const [monitorData, setMonitorData] = useState<MonitorDataItem[]>([]);
    const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [entriesPerPage, setEntriesPerPage] = useState<number>(10);

    const [appliedFilters, setAppliedFilters] = useState<FilterInputValues>({});
    const [pendingFilters, setPendingFilters] = useState<FilterInputValues>({}); // For inputs not yet applied

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
    const columnPickerRef = useRef<HTMLDivElement>(null);

    // New state for pause/play
    const [isPaused, setIsPaused] = useState<boolean>(false);

    // --- Helper Functions ---
    const titleCase = useCallback((str: string): string => {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
    }, []);

    const buildUrlParams = useCallback((
        currentAppliedFilters: FilterInputValues,
        currentPage: number,
        currentLimit: number,
        currentSorterField: 'timestamp' | 'id',
        currentSorterOrder: 'asc' | 'desc'
    ): string => {
        const params = new URLSearchParams();

        if (currentAppliedFilters.deviceId) params.append('deviceId', currentAppliedFilters.deviceId);
        if (currentAppliedFilters.cmd) params.append('cmd', currentAppliedFilters.cmd);

        // Convert string date time to Unix timestamp (seconds) for URL
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

        return params.toString();
    }, []);

    // --- Column Generation Logic ---
    const generateColumns = useCallback((currentData: MonitorDataItem[]) => {
        const fixedColumns: TableColumn[] = [
            // Đảm bảo cột STT được định nghĩa ở đây
            { title: 'STT', dataIndex: 'stt', key: 'stt', hideable: false },
            { title: 'Tên thiết bị', dataIndex: 'deviceName', key: 'deviceName', sortable: false, hideable: true },
            { title: 'MAC', dataIndex: 'mac', key: 'mac', sortable: false, hideable: true },
            { title: 'Lệnh (CMD)', dataIndex: 'cmd', key: 'cmd', sortable: false, hideable: true },
            { title: 'Thời gian', dataIndex: 'timestamp', key: 'timestamp', sortable: true, hideable: true },
        ];

        const newKeysFromData = new Set<string>();
        currentData.forEach(item => {
            Object.keys(item).forEach(key => newKeysFromData.add(key));
        });

        // Tạm thời lưu trữ các khóa cột đã biết trước khi cập nhật allKeysRef
        const previouslyKnownKeys = new Set(allKeysRef.current);

        newKeysFromData.forEach(key => {
            if (!allKeysRef.current.has(key)) {
                allKeysRef.current.add(key);
            }
        });

        const preferredOrder = ['deviceName', 'mac', 'cmd', 'status', 'timestamp', 'value', '_id'];
        const hiddenKeys = new Set(['isMissed', 'deviceId', 'key', '__v', '_id']);

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

        // --- SỬA ĐỔI LOGIC ĐỂ GIỮ TRẠẠNG THÁI HIỂN THỊ CỘT ---
        setSelectedColumnKeys(prevKeys => {
            if (prevKeys.size === 0) {
                // Tải lần đầu: chọn tất cả các cột có thể ẩn (hideable) theo mặc định, bao gồm STT
                return new Set(finalColumns.filter(c => c.hideable !== false || c.key === 'stt').map(c => c.key));
            } else {
                // Giữ trạng thái đã chọn trước đó và chỉ thêm các cột THỰC SỰ MỚI
                const newSet = new Set<string>();

                // Giữ lại các cột đã chọn trước đó (nếu chúng vẫn tồn tại trong finalColumns)
                prevKeys.forEach(key => {
                    if (finalColumns.some(col => col.key === key)) {
                        newSet.add(key);
                    }
                });

                // Đảm bảo cột STT luôn được chọn
                newSet.add('stt');

                // Thêm các cột MỚI được phát hiện (chưa từng có trong allKeysRef.current trước đó)
                // và chúng là hideable, vào trạng thái đã chọn (hiển thị)
                finalColumns.forEach(col => {
                    if (col.hideable !== false && !previouslyKnownKeys.has(col.key)) {
                        newSet.add(col.key);
                    }
                });
                return newSet;
            }
        });
        // -------------------------------------------------------------

    }, [titleCase]); // tableColumns.length không cần thiết ở đây, nó sẽ gây vòng lặp vô tận

    // --- Data Fetching Logic ---
    const fetchData = useCallback(async (
        {
            page: reqPage = 1,
            limit: reqLimit = entriesPerPage,
            sortBy: reqSortBy = sorter.field,
            sortOrder: reqSortOrder = sorter.order,
            deviceId: reqDeviceId,
            cmd: reqCmd,
            startTime: reqStartTime,
            endTime: reqEndTime,
        }: {
            page?: number;
            limit?: number;
            sortBy?: 'timestamp' | 'id';
            sortOrder?: 'asc' | 'desc';
            deviceId?: string;
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

            if (reqDeviceId) params.append('deviceId', reqDeviceId);
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

            const response = await fetch(`${API_BASE_URL}/iots/statistics?${params.toString()}`);
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

        } catch (error: unknown) {
            console.error("Lỗi khi tải dữ liệu:", error);
            if (error instanceof Error) {
                alert(`Lỗi: ${error.message}`);
            } else {
                alert('Đã xảy ra lỗi không xác định khi tải dữ liệu.');
            }
            setMonitorData([]);
            setPagination(prev => ({ ...prev, totalRecords: 0, currentPage: 1, hasNextPage: false, hasPreviousPage: false }));
        } finally {
            setLoading(false);
        }
    }, [entriesPerPage, sorter.field, sorter.order, generateColumns]);

    // --- Socket.IO Event Handler ---
    const handleSocketEventMonitor = useCallback((eventData: MonitorDataItem) => {
        if (isPaused) { // Check if paused
            console.log("Dữ liệu socket bị tạm dừng, không thêm vào bảng.");
            return;
        }

        console.log("Dữ liệu nhận từ socket:", eventData);

        const { deviceId, cmd, startTime, endTime } = appliedFilters; // Use appliedFilters

        let passesFilter = true;

        if (deviceId && eventData.deviceId) {
            if (!eventData.deviceId.includes(deviceId)) {
                passesFilter = false;
            }
        }

        if (cmd && eventData.cmd) {
            if (!eventData.cmd.includes(cmd)) {
                passesFilter = false;
            }
        }

        const eventTimestampInSeconds = eventData.timestamp;

        if (startTime) {
            const filterStartTimeMoment = moment(startTime);
            if (filterStartTimeMoment.isValid() && eventTimestampInSeconds < filterStartTimeMoment.unix()) {
                passesFilter = false;
            }
        }

        if (endTime) {
            const filterEndTimeMoment = moment(endTime);
            if (filterEndTimeMoment.isValid() && eventTimestampInSeconds > filterEndTimeMoment.unix()) {
                passesFilter = false;
            }
        }

        if (!passesFilter) {
            console.log("Dữ liệu từ socket không phù hợp với bộ lọc hiện tại.");
            return;
        }

        // Only add new data from socket if on page 1 and sorted by timestamp desc
        if (pagination.currentPage === 1 && sorter.field === 'timestamp' && sorter.order === 'desc') {
            const rowKey = eventData._id || `${eventData.timestamp || Date.now()}-${eventData.deviceId || 'unknown'}-${Math.random().toString(36).substr(2, 9)}`;

            const dataWithKey = {
                ...eventData,
                key: rowKey,
            };

            setMonitorData(prevData => {
                const newData = [dataWithKey, ...prevData];
                // Slice to maintain page size for real-time additions on page 1
                return newData.slice(0, pagination.pageSize);
            });
            generateColumns([dataWithKey]); // Re-generate columns in case new keys appear
        } else {
            console.log("Dữ liệu từ socket phù hợp bộ lọc nhưng không thêm vào vì không ở trang 1 hoặc sắp xếp khác.");
        }
    }, [appliedFilters, pagination.currentPage, pagination.pageSize, sorter.field, sorter.order, generateColumns, isPaused]); // Add isPaused to dependencies

    // --- Effects ---

    // Effect to read URL params and set initial state
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const initialFilters: FilterInputValues = {
            deviceId: params.get('deviceId') || '',
            cmd: params.get('cmd') || '',
            startTime: '', // Initialize as empty string
            endTime: '',   // Initialize as empty string
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

        setAppliedFilters(initialFilters);
        setPendingFilters(initialFilters); // pendingFilters also initialized from URL

        setPagination(prev => ({
            ...prev,
            currentPage: initialPage,
            pageSize: initialLimit,
        }));
        setEntriesPerPage(initialLimit);
        setSorter({ field: initialSortBy, order: initialSortOrder });

    }, [location.search]);


    // Effect to fetch monitoring data when applied filters, sorter, pagination.currentPage, or entriesPerPage change
    useEffect(() => {
        const currentFilters: Parameters<typeof fetchData>[0] = {
            page: pagination.currentPage,
            limit: entriesPerPage,
            sortBy: sorter.field,
            sortOrder: sorter.order,
            deviceId: appliedFilters.deviceId,
            cmd: appliedFilters.cmd,
            startTime: appliedFilters.startTime,
            endTime: appliedFilters.endTime,
        };
        fetchData(currentFilters);
    }, [entriesPerPage, appliedFilters, sorter, pagination.currentPage, fetchData]);

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

    // Handle change for text inputs (deviceId, cmd)
    const handleFilterInputChange = useCallback((field: 'deviceId' | 'cmd', value: string) => {
        setPendingFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    // Handle change for DatePicker inputs (startTime, endTime)
    const handleDateFilterChange = useCallback((field: 'startTime' | 'endTime', date: Moment | null) => {
        setPendingFilters(prev => ({
            ...prev,
            [field]: date && date.isValid() ? date.format('YYYY-MM-DDTHH:mm:ss') : '' // Convert Moment to string or empty string
        }));
    }, []);

    const handleApplyFilters = useCallback(() => {
        setAppliedFilters(pendingFilters); // Apply pending filters
        setPagination(prev => ({ ...prev, currentPage: 1 }));

        const newParams = buildUrlParams(
            pendingFilters, // Use pendingFilters to build URL
            1, // Reset to page 1
            entriesPerPage,
            sorter.field,
            sorter.order
        );
        navigate(`?${newParams}`);
    }, [pendingFilters, entriesPerPage, sorter.field, sorter.order, buildUrlParams, navigate]);

    const handleClearFilters = useCallback(() => {
        setPendingFilters({});    // Clear input UI
        setAppliedFilters({});    // Clear applied filters to trigger data fetch
        setPagination(prev => ({ ...prev, currentPage: 1 }));

        const newParams = buildUrlParams(
            {}, // Empty filters for URL
            1,  // Page 1
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
    }, [appliedFilters, entriesPerPage, buildUrlParams, navigate]);

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
                    newPage,
                    entriesPerPage,
                    sorter.field,
                    sorter.order
                );
                navigate(`?${newParams}`);
                return { ...prev, currentPage: newPage };
            });
        }
    }, [pagination.currentPage, pagination.totalRecords, entriesPerPage, appliedFilters, sorter.field, sorter.order, buildUrlParams, navigate]);

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

    return (
        <div style={styles.container}>
            <h2>Giám sát dữ liệu</h2>

            {/* Filter Panel */}
            <div style={styles.filterPanel}>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel} htmlFor="filterDeviceId">ID Thiết bị</label>
                    <ClearableInput
                        id="filterDeviceId"
                        type="text"
                        inputStyle={styles.filterInput}
                        value={pendingFilters.deviceId || ''}
                        onChange={(e) => handleFilterInputChange('deviceId', e.target.value)}
                        onClear={() => handleFilterInputChange('deviceId', '')}
                        placeholder="Nhập Device ID"
                        disabled={loading}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel} htmlFor="filterCmd">Lệnh (CMD)</label>
                    <ClearableInput
                        id="filterCmd"
                        type="text"
                        inputStyle={styles.filterInput}
                        value={pendingFilters.cmd || ''}
                        onChange={(e) => handleFilterInputChange('cmd', e.target.value)}
                        onClear={() => handleFilterInputChange('cmd', '')}
                        placeholder="Nhập lệnh CMD"
                        disabled={loading}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Thời gian</label>
                    <div style={styles.filterDateRange}>
                        <DatePicker
                            // Convert string in state to Moment object for DatePicker, or null if empty/invalid
                            value={pendingFilters.startTime ? moment(pendingFilters.startTime) : null}
                            onChange={(date: Moment | null) => handleDateFilterChange('startTime', date)}
                            showTime={{ format: 'HH:mm:ss' }} // Enable time selection with seconds
                            format="DD-MM-YYYY HH:mm:ss"      // Display format
                            allowClear                       // Enable the clear button
                            style={{ ...styles.filterInput, width: '250px' }} // Apply your custom style
                            placeholder="Thời gian bắt đầu"
                            disabled={loading}
                        />
                        <DatePicker
                            value={pendingFilters.endTime ? moment(pendingFilters.endTime) : null}
                            onChange={(date: Moment | null) => handleDateFilterChange('endTime', date)}
                            showTime={{ format: 'HH:mm:ss' }}
                            format="DD-MM-YYYY HH:mm:ss"
                            allowClear
                            style={{ ...styles.filterInput, width: '250px' }}
                            placeholder="Thời gian kết thúc"
                            disabled={loading}
                        />
                    </div>
                </div>
                <div style={styles.filterActions}>
                    <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={handleApplyFilters}
                        disabled={loading}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Áp dụng các bộ lọc đã chọn"
                    >
                        <FaFilter /> Áp dụng Bộ lọc
                    </button>
                    <button
                        style={styles.button}
                        onClick={handleClearFilters}
                        disabled={loading}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Xóa tất cả bộ lọc"
                    >
                        <FaTimes /> Xóa Bộ lọc
                    </button>
                </div>
            </div>

            {/* Header Section (Pause/Play, Entries per page, Column Picker) */}
            <div style={styles.headerSection}>
                <div style={styles.controlButtonsContainer}>
                    <button
                        style={{ ...styles.button, ...(isPaused ? styles.primaryButton : {}) }}
                        onClick={togglePause}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content={isPaused ? "Tiếp tục nhận dữ liệu" : "Tạm dừng nhận dữ liệu"}
                    >
                        {isPaused ? <FaPlay /> : <FaPause />}
                        {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                    </button>
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
                    <button
                        style={{ ...styles.button }}
                        onClick={() => setIsColumnPickerOpen(prev => !prev)}
                        disabled={loading}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Chọn các cột để hiển thị/ẩn"
                    >
                        <FaColumns /> Chọn cột hiển thị
                    </button>
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
                                        // STT column should always be centered if desired
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
                                                // Ensure STT column is centered
                                                ...(column.key === 'stt' ? styles.tdCentered : {}),
                                            }}
                                        >
                                            {(() => {
                                                if (column.key === 'stt') {
                                                    // Calculate STT based on current page and page size
                                                    return (pagination.currentPage - 1) * pagination.pageSize + index + 1;
                                                }

                                                const displayValue = item[column.dataIndex as keyof MonitorDataItem];

                                                if (column.key === 'timestamp' && typeof displayValue === 'number') {
                                                    // Convert Unix timestamp (seconds) to readable date-time string
                                                    return moment(displayValue * 1000).format('DD-MM-YYYY HH:mm:ss');
                                                }
                                                if (typeof displayValue === 'boolean') {
                                                    return <span style={{ ...styles.tag, ...(displayValue ? styles.tagGreen : styles.tagRed) }}>{displayValue ? 'TRUE' : 'FALSE'}</span>;
                                                }
                                                // Handle null, undefined, or empty string values by displaying '-'
                                                if (displayValue === null || typeof displayValue === 'undefined' || (typeof displayValue === 'string' && displayValue.trim() === '')) {
                                                    return '-';
                                                }
                                                // Default to string conversion for other data types
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
                    Hiển thị {startIndex} đến {endIndex} trên tổng số {totalRecords} bản ghi
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
            <Tooltip id="global-tooltip" /> {/* Add the Tooltip component here */}
        </div>
    );
}

export default Monitor;