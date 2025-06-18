import React, { useCallback, useEffect, useState, useRef, CSSProperties } from "react";
import { useSocket } from "../../../context/SocketContext"; // Đảm bảo đường dẫn đúng
import moment from "moment"; // Đảm bảo đã cài đặt: npm install moment

// --- Interfaces ---

// Loại bỏ IotDeviceInfo vì không còn cần lấy thông tin thiết bị riêng
// interface IotDeviceInfo {
//     id: string;
//     name: string;
//     mac: string;
// }

// Interface cho dữ liệu giám sát
interface MonitorDataItem {
    _id: string;
    isMissed?: boolean;
    cmd?: string;
    deviceId: string;
    deviceName?: string; // Giờ đây có thể nhận trực tiếp từ backend
    mac?: string;       // Giờ đây có thể nhận trực tiếp từ backend
    timestamp: number; // Unix timestamp in SECONDS (sẽ nhân * 1000 cho moment)
    value?: number | string | boolean;
    key: string;
    [key: string]: any;
}

// Interface cho thông tin phân trang
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

// Interface cho cấu hình cột bảng
interface TableColumn {
    title: string;
    dataIndex: string;
    key: string;
    sortable?: boolean;
}

// Kiểu dữ liệu cho các giá trị input trong panel lọc
type FilterInputValues = {
    deviceId?: string; // Sẽ lấy từ dropdown deviceName (nhưng dropdown sẽ không cần load thiết bị nữa)
    cmd?: string;
    startTime?: string; // Chuỗi datetime-local (YYYY-MM-DDTHH:mm)
    endTime?: string;   // Chuỗi datetime-local (YYYY-MM-DDTHH:mm)
};


// --- Hằng số ---
const API_BASE_URL = 'http://localhost:3335/api'; // Đã đổi port thành 3335

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
    filterInput: {
        padding: '10px 12px',
        border: '1px solid #ddd',
        borderRadius: '3px',
        fontSize: '14px',
        width: '200px',
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
};

const Monitor: React.FC = () => {
    const socket = useSocket();
    const [monitorData, setMonitorData] = useState<MonitorDataItem[]>([]);
    // Loại bỏ state iotDevices vì không cần nữa
    // const [iotDevices, setIotDevices] = useState<IotDeviceInfo[]>([]);
    // Loại bỏ state loadingIotDevices vì không cần nữa
    // const [loadingIotDevices, setLoadingIotDevices] = useState<boolean>(true);
    const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
    const [loading, setLoading] = useState<boolean>(false); // Chỉ còn loading cho dữ liệu chính
    const [entriesPerPage, setEntriesPerPage] = useState<number>(10);

    const [filterInputValues, setFilterInputValues] = useState<FilterInputValues>({});

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

    // --- Helper Functions ---
    const titleCase = useCallback((str: string): string => {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
    }, []);

    // Loại bỏ hàm getDeviceInfo vì thông tin đã có sẵn từ backend
    // const getDeviceInfo = useCallback((deviceId: string): { name: string; mac: string } => {
    //     debugger;
    //     const device = iotDevices.find(dev => dev.id === deviceId);
    //     return {
    //         name: device ? device.name : `Thiết bị không rõ (${deviceId})`,
    //         mac: device ? device.mac : 'N/A'
    //     };
    // }, [iotDevices]); // iotDevices không còn là dependency

    // --- Column Generation Logic ---
    const generateColumns = useCallback((currentData: MonitorDataItem[]) => {
        // Cố định các cột chính bao gồm deviceName và mac
        const fixedColumns: TableColumn[] = [
            { title: 'STT', dataIndex: 'stt', key: 'stt' },
            { title: 'Tên thiết bị', dataIndex: 'deviceName', key: 'deviceName', sortable: false },
            { title: 'MAC', dataIndex: 'mac', key: 'mac', sortable: false },
            { title: 'Lệnh (CMD)', dataIndex: 'cmd', key: 'cmd', sortable: false },
            { title: 'Thời gian', dataIndex: 'timestamp', key: 'timestamp', sortable: true },
        ];

        if (!currentData || currentData.length === 0) {
            // Nếu không có dữ liệu, đảm bảo chỉ hiển thị các cột cố định
            if (tableColumns.length !== fixedColumns.length ||
                !fixedColumns.every((col, i) => tableColumns[i] && tableColumns[i].key === col.key)) {
                setTableColumns(fixedColumns);
            }
            return;
        }

        const newKeys = new Set<string>();
        currentData.forEach(item => {
            Object.keys(item).forEach(key => newKeys.add(key));
        });

        let keysAdded = false;
        newKeys.forEach(key => {
            if (!allKeysRef.current.has(key)) {
                allKeysRef.current.add(key);
                keysAdded = true;
            }
        });

        const allCurrentRefKeys = Array.from(allKeysRef.current);
        // Lấy keys của các cột hiện tại, loại trừ STT vì nó được thêm tự động
        const currentColumnKeys = new Set(tableColumns.filter(col => col.key !== 'stt').map(col => col.key));

        const hasColumnStructureChanged = allCurrentRefKeys.length !== currentColumnKeys.size ||
            !allCurrentRefKeys.every(key => currentColumnKeys.has(key));

        if (!keysAdded && !hasColumnStructureChanged) {
            return;
        }

        // Ưu tiên thứ tự hiển thị và các khóa cần ẩn
        const preferredOrder = ['deviceName', 'mac', 'cmd', 'status', 'timestamp', 'value', '_id'];
        const hiddenKeys = new Set(['isMissed', 'deviceId', 'key', '__v', '_id']); // deviceId cũng có thể ẩn đi nếu deviceName/mac đủ

        const sortedDynamicKeys = Array.from(allKeysRef.current).sort((a, b) => {
            const indexA = preferredOrder.indexOf(a);
            const indexB = preferredOrder.indexOf(b);

            // Xử lý các khóa ẩn trước
            if (hiddenKeys.has(a) && hiddenKeys.has(b)) return 0;
            if (hiddenKeys.has(a)) return 1;
            if (hiddenKeys.has(b)) return -1;

            // Xử lý các khóa không có trong preferredOrder
            if (indexA === -1 && indexB === -1) {
                return a.localeCompare(b); // Sắp xếp theo thứ tự chữ cái
            }
            if (indexA === -1) return 1; // a không có trong preferredOrder, đẩy xuống cuối
            if (indexB === -1) return -1; // b không có trong preferredOrder, đẩy b lên trước a
            return indexA - indexB; // Sắp xếp theo preferredOrder
        });

        // Lọc ra các cột động (không phải cột cố định và không bị ẩn)
        const dynamicColumns: TableColumn[] = sortedDynamicKeys
            .filter(key => !hiddenKeys.has(key) && !fixedColumns.some(fCol => fCol.key === key))
            .map(key => {
                const title = titleCase(key);
                const sortable = ['timestamp', '_id'].includes(key); // _id vẫn có thể sortable nếu muốn
                return {
                    title: title,
                    dataIndex: key,
                    key: key,
                    sortable: sortable,
                };
            });

        const finalColumns = [
            ...fixedColumns,
            ...dynamicColumns,
        ];

        setTableColumns(finalColumns);
    }, [tableColumns.length, titleCase]); // Không còn phụ thuộc vào iotDevices

    // --- Data Fetching Logic (for monitoring data) ---
    const fetchData = useCallback(async (
        {
            page: reqPage = 1,
            limit: reqLimit = entriesPerPage,
            sortBy: reqSortBy = sorter.field,
            sortOrder: reqSortOrder = sorter.order,
            deviceId: reqDeviceId,
            cmd: reqCmd,
            startTime: reqStartTime, // This will be the formatted string
            endTime: reqEndTime,     // This will be the formatted string
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
        setLoading(true); // Chỉ còn loading chính
        try {
            const params = new URLSearchParams();
            params.append('page', reqPage.toString());
            params.append('limit', reqLimit.toString());
            params.append('direction', 'jump');
            params.append('sortBy', reqSortBy);
            params.append('sortOrder', reqSortOrder);

            if (reqDeviceId) params.append('deviceId', reqDeviceId);
            if (reqCmd) params.append('cmd', reqCmd);

            // Convert formatted string to Unix timestamp (seconds) before sending to API
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

            // Dữ liệu đã có sẵn deviceName và mac từ backend, chỉ cần thêm key
            const dataWithKeys: MonitorDataItem[] = result.data.map((item: MonitorDataItem, index: number) => {
                return {
                    ...item,
                    key: `${item._id || item.timestamp}-${Date.now()}-${index}`, // Tạo key unique
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
                nextCursor: null, // Keep null for offset pagination
                previousCursor: null, // Keep null for offset pagination
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
    }, [entriesPerPage, sorter.field, sorter.order, generateColumns]); // Loại bỏ getDeviceInfo và loadingIotDevices, iotDevices từ dependencies

    // --- Socket.IO Event Handler ---
    const handleSocketEventMonitor = useCallback((eventData: MonitorDataItem) => {
        console.log(eventData);
        const hasActiveFilters = Object.keys(filterInputValues).some(key => {
            const filterValue = filterInputValues[key as keyof FilterInputValues];
            if (typeof filterValue === 'string') {
                return filterValue.trim() !== '';
            }
            return filterValue !== undefined;
        });

        // Chỉ thêm dữ liệu từ socket nếu đang ở trang 1, không có bộ lọc và sắp xếp theo timestamp giảm dần
        if (pagination.currentPage === 1 && !hasActiveFilters && sorter.field === 'timestamp' && sorter.order === 'desc') {
            const rowKey = eventData._id || `${eventData.timestamp || Date.now()}-${eventData.deviceId || 'unknown'}-${Math.random().toString(36).substr(2, 9)}`;

            // Dữ liệu từ socket đã có sẵn deviceName và mac
            const dataWithKey = {
                ...eventData,
                key: rowKey,
            };

            setMonitorData(prevData => {
                const newData = [dataWithKey, ...prevData];
                return newData.slice(0, pagination.pageSize);
            });
            generateColumns([dataWithKey]);
            setPagination(prev => ({ ...prev, totalRecords: prev.totalRecords + 1 }));
        }
    }, [filterInputValues, pagination.currentPage, pagination.pageSize, sorter.field, sorter.order, generateColumns, pagination.totalRecords]); // Loại bỏ getDeviceInfo từ dependencies

    // --- Effects ---

    // Loại bỏ Effect để tải danh sách thiết bị IoT vì không cần nữa
    // useEffect(() => {
    //     const fetchIotDevices = async () => {
    //         setLoadingIotDevices(true);
    //         try {
    //             const response = await fetch(`${API_BASE_URL}/iots/get-data-iots`);
    //             const result = await response.json();
    //             if (!response.ok) {
    //                 throw new Error(result.message || 'Không thể tải thông tin thiết bị IoT');
    //             }
    //             setIotDevices(result.data);
    //         } catch (error) {
    //             console.error("Lỗi khi tải thông tin thiết bị IoT:", error);
    //             alert("Không thể tải thông tin thiết bị IoT. Vui lòng kiểm tra console.");
    //         } finally {
    //             setLoadingIotDevices(false);
    //         }
    //     };
    //     fetchIotDevices();
    // }, []);

    // Effect để tải dữ liệu giám sát khi các tham số thay đổi (filterInputValues, sorter, pagination.currentPage, entriesPerPage)
    useEffect(() => {
        const currentFilters: Parameters<typeof fetchData>[0] = {
            page: pagination.currentPage,
            limit: entriesPerPage,
            sortBy: sorter.field,
            sortOrder: sorter.order,
            deviceId: filterInputValues.deviceId,
            cmd: filterInputValues.cmd,
            startTime: filterInputValues.startTime,
            endTime: filterInputValues.endTime,
        };
        fetchData(currentFilters);
    }, [entriesPerPage, filterInputValues, sorter, pagination.currentPage, fetchData]); // Loại bỏ loadingIotDevices, iotDevices từ dependencies

    // Effect cho Socket.IO event listener (không đổi)
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

    // --- Handlers ---

    const handleFilterInputChange = useCallback((field: keyof FilterInputValues, value: string) => {
        setFilterInputValues(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleApplyFilters = useCallback(() => {
        fetchData({
            page: 1,
            limit: entriesPerPage,
            sortBy: sorter.field,
            sortOrder: sorter.order,
            ...filterInputValues
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, [filterInputValues, fetchData, entriesPerPage, sorter.field, sorter.order]);

    const handleClearFilters = useCallback(() => {
        setFilterInputValues({});
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    const handleSorterChange = useCallback((field: string) => {
        if (field === 'timestamp' || field === '_id') {
            setSorter(prev => ({
                field: field === '_id' ? 'id' : field as 'timestamp' | 'id',
                order: prev.field === (field === '_id' ? 'id' : field) && prev.order === 'desc' ? 'asc' : 'desc',
            }));
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        } else {
            console.warn(`Sắp xếp theo cột '${field}' hiện không được hỗ trợ.`);
        }
    }, []);

    const handlePaginationButtonClick = useCallback((page: number | 'prev' | 'next' | 'last') => {
        const totalPages = pagination.totalRecords !== undefined
            ? Math.ceil(pagination.totalRecords / entriesPerPage)
            : 1;

        let targetPage = pagination.currentPage;

        if (typeof page === 'number') {
            targetPage = page;
        } else if (page === 'prev') {
            targetPage = pagination.currentPage - 1;
        } else if (page === 'next') {
            targetPage = pagination.currentPage + 1;
        } else if (page === 'last') {
            targetPage = totalPages;
        }

        targetPage = Math.max(1, Math.min(totalPages, targetPage));

        if (targetPage !== pagination.currentPage) {
            setPagination(prev => ({ ...prev, currentPage: targetPage }));
        }
    }, [pagination.currentPage, pagination.totalRecords, entriesPerPage]);


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
                disabled={typeof p !== 'number' || loading} // Chỉ phụ thuộc vào loading chính
            >
                {p}
            </button>
        ));
    }, [pagination.totalRecords, pagination.currentPage, entriesPerPage, loading, handlePaginationButtonClick]);

    const totalRecords = pagination.totalRecords || 0;
    const startIndex = totalRecords > 0 ? (pagination.currentPage - 1) * pagination.pageSize + 1 : 0;
    const endIndex = Math.min(startIndex + pagination.pageSize - 1, totalRecords);

    return (
        <div style={styles.container}>
            {/* Panel Lọc Riêng Biệt */}
            <div style={styles.filterPanel}>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel} htmlFor="filterDeviceId">ID Thiết bị</label>
                    <input
                        id="filterDeviceId"
                        type="text" // Đổi từ select sang input text vì không còn danh sách thiết bị để chọn
                        style={styles.filterInput}
                        value={filterInputValues.deviceId || ''}
                        onChange={(e) => handleFilterInputChange('deviceId', e.target.value)}
                        placeholder="Nhập Device ID"
                        disabled={loading}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel} htmlFor="filterCmd">Lệnh (CMD)</label>
                    <input
                        id="filterCmd"
                        type="text"
                        style={styles.filterInput}
                        value={filterInputValues.cmd || ''}
                        onChange={(e) => handleFilterInputChange('cmd', e.target.value)}
                        placeholder="Nhập lệnh CMD"
                        disabled={loading}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Thời gian</label>
                    <div style={styles.filterDateRange}>
                        <input
                            type="datetime-local"
                            style={{ ...styles.filterInput, width: '250px' }}
                            value={filterInputValues.startTime || ''}
                            onChange={(e) => handleFilterInputChange('startTime', e.target.value)}
                            disabled={loading}
                        />
                        <input
                            type="datetime-local"
                            style={{ ...styles.filterInput, width: '250px' }}
                            value={filterInputValues.endTime || ''}
                            onChange={(e) => handleFilterInputChange('endTime', e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>
                <div style={styles.filterActions}>
                    <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={handleApplyFilters}
                        disabled={loading}
                    >
                        Áp dụng Bộ lọc
                    </button>
                    <button
                        style={styles.button}
                        onClick={handleClearFilters}
                        disabled={loading}
                    >
                        Xóa Bộ lọc
                    </button>
                </div>
            </div>

            {/* Phần điều khiển số lượng hiển thị */}
            <div style={styles.headerSection}>
                <div style={styles.entriesDropdown}>
                    <span>Hiển thị</span>
                    <select
                        style={styles.entriesSelect}
                        value={entriesPerPage}
                        onChange={(e) => {
                            setEntriesPerPage(parseInt(e.target.value));
                            setPagination(prev => ({ ...prev, currentPage: 1 }));
                        }}
                        disabled={loading}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span>bản ghi</span>
                </div>
            </div>

            {/* Wrapper Bảng Dữ liệu */}
            <div style={styles.tableWrapper}>
                {loading && ( // Chỉ kiểm tra loading chính
                    <div style={styles.loadingOverlay}>
                        Đang tải dữ liệu...
                    </div>
                )}
                <table style={styles.table}>
                    <thead>
                    <tr>
                        {tableColumns.map(column => (
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
                            <td colSpan={tableColumns.length} style={{ ...styles.td, textAlign: 'left' }}>
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
                                {tableColumns.map(column => (
                                    <td
                                        key={column.key}
                                        style={{
                                            ...styles.td,
                                            ...(column.key === 'stt' || column.key === 'value' ? styles.tdCentered : {}),
                                        }}
                                    >
                                        {(() => {
                                            if (column.key === 'stt') {
                                                return (pagination.currentPage - 1) * pagination.pageSize + index + 1;
                                            }

                                            // Sử dụng trực tiếp item.deviceName và item.mac
                                            const displayValue = item[column.dataIndex as keyof MonitorDataItem];

                                            if (column.key === 'timestamp' && typeof displayValue === 'number') {
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

            {/* Phần chân trang và phân trang */}
            <div style={styles.footerSection}>
                <div style={styles.infoText}>
                    Hiển thị {startIndex} đến {endIndex} trên tổng số {totalRecords} bản ghi
                </div>
                <div style={styles.paginationContainer}>
                    <button
                        style={{ ...styles.paginationButton, ...(!pagination.hasPreviousPage || loading ? styles.paginationButtonDisabled : {}) }}
                        onClick={() => handlePaginationButtonClick('prev')}
                        disabled={!pagination.hasPreviousPage || loading}
                    >
                        Trước
                    </button>
                    {renderPageNumbers()}
                    <button
                        style={{ ...styles.paginationButton, ...(!pagination.hasNextPage || loading ? styles.paginationButtonDisabled : {}) }}
                        onClick={() => handlePaginationButtonClick('next')}
                        disabled={!pagination.hasNextPage || loading}
                    >
                        Tiếp
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Monitor;