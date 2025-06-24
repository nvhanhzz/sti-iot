import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AutoComplete, Card, Col, DatePicker, Row, Select, Spin, Statistic, Table } from 'antd';
import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import "./Home.css";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const API_DASHBOARD_PREFIX = 'http://localhost:3335/api/dashboard';
const { RangePicker } = DatePicker;
const { Option } = Select;

const CHART_COLORS = {
    success: '#4680ff',
    missed: '#ff4d4f',
    missedLine: '#ff7875',
    pieColors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', '#ff1493', '#1e90ff', '#ffa500'],
    grid: '#e0e0e0',
    tooltipBg: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#333',
    textSecondary: '#666',
    otherCommands: '#cccccc'
};

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
    // Thêm các lệnh lỗi vào mapping để có description nếu cần
    { "name": "CMD_STATUS_WIFI_WEAK", "description": "Lỗi WiFi Yếu" },
    { "name": "CMD_STATUS_MQTT_LOST", "description": "Lỗi Mất kết nối MQTT" },
    { "name": "CMD_STATUS_ACK_FAIL", "description": "Lỗi ACK Thất bại" }
];

const cmdDescriptionMap = new Map(commandsMapping.map(cmd => [cmd.description.toLowerCase(), cmd.name]));
const descriptionOptions = commandsMapping.map(cmd => ({ value: cmd.description }));

// --- NEW INTERFACE ---
interface DeviceListItem {
    id: string;
    name: string;
    mac?: string;
}
// --- END NEW INTERFACE ---

interface CommonDashboardQueryParams {
    startTime: number | null;
    endTime: number | null;
    deviceId?: string;
    cmd?: string;
    page?: number;   // Thêm page
    limit?: number;  // Thêm limit
}

interface OverallSummaryData {
    totalPackets: number;
    successfulPackets: number;
    missedPackets: number;
    missRatePercentage: number;
    averageResendAttempts?: number;
    totalUniqueDevices: number;
    totalUniqueCommands: number;
}
interface PacketCountOverTimeData {
    timeBucket: number;
    successfulPackets: number;
    missedPackets: number;
    missRatePercentage: number;
}
interface PacketCountsByCommandData {
    cmd: string;
    totalPackets: number;
    successfulPackets: number;
    missedPackets: number;
}

interface PieChartDataItem {
    name: string;
    value: number;
    percentage?: string;
    successfulPackets?: number;
    missedPackets?: number;
    missRatePercentageForCommand?: number;
}

// --- NEW INTERFACE FOR PAGINATED RESPONSE ---
interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        totalDocuments: number;
        currentPage: number;
        limit: number;
        totalPages: number;
    };
}

// --- NEW INTERFACE FOR FAILED COMMAND DATA ---
interface FailedCommandDataItem {
    deviceId: string;
    cmd: string;
    timestamp: number;
    isMissed: boolean;
}
// --- END NEW INTERFACES ---


const formatTimeBucketLabel = (timestamp: number, interval: 'hourly' | 'daily' | 'weekly'): string => {
    const date = dayjs(timestamp);
    switch (interval) {
        case 'hourly':
            return date.format('HH:mm DD/MM');
        case 'daily':
            return date.format('DD/MM');
        case 'weekly':
            return `Tuần của ${date.format('DD/MM')}`;
        default:
            return date.format('DD/MM/YYYY');
    }
};
const formatNumber = (num: number): string => {
    return num?.toLocaleString() || '0';
};
const formatPercentage = (num: number): string => {
    return `${(num || 0).toFixed(2)}%`;
};

const groupCommandPieData = (rawData: PacketCountsByCommandData[], thresholdPercentage: number = 2): PieChartDataItem[] => {
    if (!rawData || rawData.length === 0) return [];

    const totalOverallPackets = rawData.reduce((sum, item) => sum + item.totalPackets, 0);
    if (totalOverallPackets === 0) return [];

    const processedData: PieChartDataItem[] = [];

    rawData.forEach(item => {
        const itemTotalPackets = item.totalPackets || 0;
        const itemSuccessfulPackets = item.successfulPackets || 0;
        const itemMissedPackets = item.missedPackets || 0;

        const missRatePercentageForCommand = itemTotalPackets > 0
            ? (itemMissedPackets / itemTotalPackets) * 100
            : 0;

        const itemPercentageOfTotal = (itemTotalPackets / totalOverallPackets) * 100;

        const foundDesc = commandsMapping.find(mapping => mapping.name === item.cmd)?.description;
        const displayName = foundDesc || item.cmd || 'Unknown';

        processedData.push({
            name: displayName,
            value: itemTotalPackets,
            percentage: itemPercentageOfTotal.toFixed(1),
            successfulPackets: itemSuccessfulPackets,
            missedPackets: itemMissedPackets,
            missRatePercentageForCommand: missRatePercentageForCommand
        });
    });

    const filteredData: PieChartDataItem[] = [];
    let otherValue = 0;
    let otherSuccessful = 0;
    let otherMissed = 0;
    let otherCount = 0;

    processedData.forEach(item => {
        const itemPercentage = parseFloat(item.percentage || '0');
        if (itemPercentage < thresholdPercentage) {
            otherValue += item.value;
            otherSuccessful += item.successfulPackets || 0;
            otherMissed += item.missedPackets || 0;
            otherCount++;
        } else {
            filteredData.push(item);
        }
    });

    if (otherValue > 0) {
        const otherMissRatePercentage = otherValue > 0
            ? (otherMissed / otherValue) * 100
            : 0;

        filteredData.push({
            name: `Các lệnh khác (${otherCount})`,
            value: otherValue,
            percentage: ((otherValue / totalOverallPackets) * 100).toFixed(1),
            successfulPackets: otherSuccessful,
            missedPackets: otherMissed,
            missRatePercentageForCommand: otherMissRatePercentage
        });
    }

    return filteredData.sort((a, b) => {
        if (a.name.includes("Các lệnh khác") && !b.name.includes("Các lệnh khác")) return 1;
        if (!a.name.includes("Các lệnh khác") && b.name.includes("Các lệnh khác")) return -1;
        return b.value - a.value;
    });
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: CHART_COLORS.tooltipBg,
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                fontSize: '13px',
            }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: CHART_COLORS.textPrimary, marginBottom: '6px' }}>{`${label}`}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ margin: '3px 0', color: entry.color, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{`${entry.dataKey}:`}</span>
                        <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>{formatNumber(entry.value)}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (data.successfulPackets !== undefined && data.missedPackets !== undefined) {
            return (
                <div style={{
                    backgroundColor: CHART_COLORS.tooltipBg,
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '13px',
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: CHART_COLORS.textPrimary, marginBottom: '6px' }}>{data.name}</p>
                    <p style={{ margin: '3px 0', color: CHART_COLORS.success, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{`Realtime:`}</span>
                        <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>{formatNumber(data.successfulPackets)}</span>
                    </p>
                    <p style={{ margin: '3px 0', color: CHART_COLORS.missed, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{`Gửi lại:`}</span>
                        <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>{formatNumber(data.missedPackets)}</span>
                    </p>
                    <p style={{ margin: '3px 0', color: payload[0].color, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{`Tổng gói lệnh:`}</span>
                        <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>{formatNumber(data.value)}</span>
                    </p>
                    {data.percentage && (
                        <p style={{ margin: '3px 0', color: payload[0].color, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{`Tỷ lệ trên tổng:`}</span>
                            <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>{`${data.percentage}%`}</span>
                        </p>
                    )}
                    {data.missRatePercentageForCommand !== undefined && (
                        <p style={{ margin: '3px 0', color: data.missRatePercentageForCommand > 0 ? CHART_COLORS.missed : CHART_COLORS.success, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{`Tỷ lệ gửi lại lệnh:`}</span>
                            <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>{`${formatPercentage(data.missRatePercentageForCommand)}`}</span>
                        </p>
                    )}
                </div>
            );
        }

        return (
            <div style={{
                backgroundColor: CHART_COLORS.tooltipBg,
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                fontSize: '13px',
            }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: CHART_COLORS.textPrimary, marginBottom: '6px' }}>{data.name}</p>
                <p style={{ margin: '3px 0', color: payload[0].color, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{`Số lượng:`}</span>
                    <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>{formatNumber(data.value)}</span>
                </p>
                {data.percentage && (
                    <p style={{ margin: '3px 0', color: payload[0].color, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{`Tỷ lệ:`}</span>
                        <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>{`${data.percentage}%`}</span>
                    </p>
                )}
            </div>
        );
    }
    return null;
};

const createSearchParams = (params: Record<string, any>): URLSearchParams => {
    const sp = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null && String(params[key]).trim() !== '') {
            sp.append(key, params[key].toString());
        }
    }
    return sp;
};

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        if (res.status === 400 && errorBody.message) {
            throw new Error(errorBody.message);
        }
        throw new Error(errorBody.message || res.statusText);
    }
    return res.json();
};

const fetchDeviceListApi = async (): Promise<DeviceListItem[]> => {
    const url = `${API_DASHBOARD_PREFIX}/devices`;
    return handleResponse(await fetch(url));
};

const fetchOverallSummaryApi = async (params: CommonDashboardQueryParams): Promise<OverallSummaryData> => {
    const queryParams = createSearchParams(params);
    const url = `${API_DASHBOARD_PREFIX}/summary?${queryParams.toString()}`;
    return handleResponse(await fetch(url));
};

interface PacketCountsOverTimeApiParams extends CommonDashboardQueryParams {
    interval: 'hourly' | 'daily' | 'weekly';
}
const fetchPacketCountsOverTimeApi = async (params: PacketCountsOverTimeApiParams): Promise<PacketCountOverTimeData[]> => {
    const queryParams = createSearchParams(params);
    const url = `${API_DASHBOARD_PREFIX}/packet-counts-over-time?${queryParams.toString()}`;
    return await handleResponse(await fetch(url));
};

const fetchPacketCountsByCommandApi = async (params: CommonDashboardQueryParams): Promise<PacketCountsByCommandData[]> => {
    const queryParams = createSearchParams(params);
    const url = `${API_DASHBOARD_PREFIX}/packet-counts-by-command?${queryParams.toString()}`;
    return handleResponse(await fetch(url));
};

// --- NEW API CALL FOR FAILED COMMAND STATISTICS ---
const fetchFailedCommandStatisticsApi = async (params: CommonDashboardQueryParams): Promise<PaginatedResponse<FailedCommandDataItem>> => {
    const queryParams = createSearchParams(params);
    const url = `${API_DASHBOARD_PREFIX}/packet-fail?${queryParams.toString()}`; // Endpoint mới của bạn
    return handleResponse(await fetch(url));
};
// --- END NEW API CALL ---

interface OverallSummaryCardProps {
    commonParams: CommonDashboardQueryParams;
}
const OverallSummaryCard: React.FC<OverallSummaryCardProps> = React.memo(({ commonParams }) => {
    const [data, setData] = useState<OverallSummaryData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!commonParams.startTime || !commonParams.endTime) {
                setData(null);
                return;
            }
            const result = await fetchOverallSummaryApi(commonParams);

            const calculatedTotalPackets = (result.successfulPackets || 0) + (result.missedPackets || 0);
            const calculatedMissRate = calculatedTotalPackets > 0
                ? (result.missedPackets / calculatedTotalPackets) * 100
                : 0;

            setData({ ...result, totalPackets: calculatedTotalPackets, missRatePercentage: calculatedMissRate });
        } catch (err: any) {
            console.error("Error fetching OverallSummary:", err);
            setError(err.message || "Lỗi tải tổng quan gói tin.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [commonParams]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pieData = useMemo(() => {
        if (!data) return [];
        const { successfulPackets, missedPackets, totalPackets } = data;
        const total = totalPackets || 0;

        if (total === 0) return [];
        return [
            {
                name: 'Realtime',
                value: successfulPackets || 0,
                percentage: ((successfulPackets || 0) / total * 100).toFixed(2)
            },
            {
                name: 'Gửi lại',
                value: missedPackets || 0,
                percentage: ((missedPackets || 0) / total * 100).toFixed(2)
            },
        ].filter(item => item.value > 0);
    }, [data]);


    if (loading) {
        return (
            <Col xs={24} lg={12}>
                <Card title="📊 Tổng quan gói tin" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 350 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px' }}>
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Spin tip="Đang tải tổng quan..." />
                    </div>
                </Card>
            </Col>
        );
    }

    if (error) {
        return (
            <Col xs={24} lg={12}>
                <Card title="📊 Tổng quan gói tin" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 350 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px' }}>
                    <Alert message="Lỗi tải Tổng quan" description={error} type="warning" showIcon style={{ borderRadius: 8 }} />
                </Card>
            </Col>
        );
    }

    if (!data || data.totalPackets === 0) {
        return (
            <Col xs={24} lg={12}>
                <Card title="📊 Tổng quan gói tin" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 350 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px' }}>
                    <Alert message="Không có dữ liệu" description="Không tìm thấy dữ liệu tổng quan gói tin." type="info" showIcon style={{ borderRadius: 8 }} />
                </Card>
            </Col>
        );
    }

    return (
        <Col xs={24} lg={12}>
            <Card
                title="📊 Tổng quan gói tin"
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 350 }}
                headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px' }}
            >
                <div style={{ height: 200, marginBottom: 16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                labelLine={false}
                            >
                                {pieData.map((_entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? CHART_COLORS.success : CHART_COLORS.missed}
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <Row gutter={[8, 8]}>
                    <Col span={6}>
                        <Statistic
                            title="Tổng gói"
                            value={data.totalPackets}
                            formatter={(value) => formatNumber(Number(value))}
                            valueStyle={{ color: CHART_COLORS.textPrimary }}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Realtime"
                            value={data.successfulPackets}
                            valueStyle={{ color: CHART_COLORS.success }}
                            formatter={(value) => formatNumber(Number(value))}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Gửi lại"
                            value={data.missedPackets}
                            valueStyle={{ color: CHART_COLORS.missed }}
                            formatter={(value) => formatNumber(Number(value))}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Tỷ lệ gửi lại"
                            value={((data.missedPackets || 0) / data.totalPackets * 100).toFixed(2)}
                            precision={2}
                            suffix="%"
                            valueStyle={{ color: data.missRatePercentage > 5 ? CHART_COLORS.missed : CHART_COLORS.success }}
                        />
                    </Col>
                </Row>
            </Card>
        </Col>
    );
});

interface CommandDistributionCardProps {
    commonParams: CommonDashboardQueryParams;
}
const CommandDistributionCard: React.FC<CommandDistributionCardProps> = React.memo(({ commonParams }) => {
    const [data, setData] = useState<PacketCountsByCommandData[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [cmdDescriptionFilter, setCmdDescriptionFilter] = useState<string>('');
    const [actualCmdToSend, setActualCmdToSend] = useState<string | undefined>(undefined);

    useEffect(() => {
        const lowerCaseDescription = cmdDescriptionFilter.toLowerCase();
        const foundCmd = cmdDescriptionMap.get(lowerCaseDescription);
        setActualCmdToSend(foundCmd);
    }, [cmdDescriptionFilter]);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!commonParams.startTime || !commonParams.endTime) {
                setData(null);
                return;
            }
            const paramsWithCmd = { ...commonParams, cmd: actualCmdToSend };
            const result = await fetchPacketCountsByCommandApi(paramsWithCmd);
            setData(result);
        } catch (err: any) {
            console.error("Error fetching CommandDistribution:", err);
            setError(err.message || "Lỗi tải phân phối gói tin theo lệnh.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [commonParams, actualCmdToSend]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pieData = useMemo(() => {
        if (!data) return [];
        return groupCommandPieData(data, 3);
    }, [data]);

    const handleSearch = useCallback((value: string) => {
        setCmdDescriptionFilter(value);
    }, []);

    const cardTitle = (
        <Row align="middle" justify="space-between" style={{ width: '100%' }}>
            <Col>📋 Phân phối gói tin theo lệnh</Col>
            <Col>
                <AutoComplete
                    options={descriptionOptions}
                    style={{ width: 200 }}
                    onSelect={handleSearch}
                    onSearch={handleSearch}
                    onChange={handleSearch}
                    value={cmdDescriptionFilter}
                    placeholder="Lọc theo mô tả lệnh"
                    allowClear
                    size="small"
                    filterOption={(inputValue, option) =>
                        option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                />
            </Col>
        </Row>
    );

    const CustomCommandLegend = ({ payload }: any) => {
        if (!payload) return null;
        return (
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {payload.map((entry: any, index: number) => (
                    <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{
                            width: 16,
                            height: 16,
                            backgroundColor: entry.color,
                            borderRadius: '50%',
                            marginRight: '8px',
                            border: '1px solid #fff'
                        }}></div>
                        <div style={{ fontSize: '13px', color: CHART_COLORS.textPrimary }}>
                            <span style={{ fontWeight: 'bold' }}>{entry.payload.name}:</span> {formatNumber(entry.payload.value)} gói ({entry.payload.percentage}%)<br />
                        </div>
                    </li>
                ))}
            </ul>
        );
    };


    if (loading) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 350 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Spin tip="Đang tải phân phối lệnh..." />
                    </div>
                </Card>
            </Col>
        );
    }

    if (error) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 350 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <Alert message="Lỗi tải Phân phối theo lệnh" description={error} type="warning" showIcon style={{ borderRadius: 8 }} />
                </Card>
            </Col>
        );
    }

    if (!pieData.length) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 350 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <Alert message="Không có dữ liệu" description="Không tìm thấy dữ liệu phân phối theo lệnh." type="info" showIcon style={{ borderRadius: 8 }} />
                </Card>
            </Col>
        );
    }

    return (
        <Col xs={24} lg={12}>
            <Card
                title={cardTitle}
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 350 }}
                headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}
            >
                <div style={{ height: `300px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(1)}%`}
                                labelLine={false}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.name.includes("Các lệnh khác") ? CHART_COLORS.otherCommands : CHART_COLORS.pieColors[index % CHART_COLORS.pieColors.length]}
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend content={<CustomCommandLegend />} layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </Col>
    );
});

interface TimeSeriesCardProps {
    commonParams: CommonDashboardQueryParams;
    initialInterval?: 'hourly' | 'daily' | 'weekly';
}
const TimeSeriesCard: React.FC<TimeSeriesCardProps> = React.memo(({ commonParams, initialInterval = 'daily' }) => {
    const [data, setData] = useState<PacketCountOverTimeData[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [interval, setInterval] = useState<'hourly' | 'daily' | 'weekly'>(initialInterval);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!commonParams.startTime || !commonParams.endTime) {
                setData(null);
                return;
            }
            const paramsWithInterval: PacketCountsOverTimeApiParams = { ...commonParams, interval: interval };
            const result = await fetchPacketCountsOverTimeApi(paramsWithInterval);

            const formattedData = result.map(item => ({
                time: formatTimeBucketLabel(item.timeBucket * 1000, interval),
                'Realtime': item.successfulPackets || 0,
                'Gửi lại': item.missedPackets || 0,
                timestamp: item.timeBucket * 1000
            })).sort((a, b) => a.timestamp - b.timestamp);

            // @ts-ignore
            setData(formattedData);
        } catch (err: any) {
            console.error("Error fetching TimeSeriesData:", err);
            setError(err.message || "Lỗi tải xu hướng gói tin.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [commonParams, interval]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const intervalLabel = interval === 'hourly' ? 'giờ' : interval === 'daily' ? 'ngày' : 'tuần';

    const cardTitle = (
        <Row align="middle" justify="space-between" style={{ width: '100%' }}>
            <Col>📈 Xu hướng gói tin theo {intervalLabel}</Col>
            <Col>
                <Select
                    value={interval}
                    onChange={(value) => setInterval(value as 'hourly' | 'daily' | 'weekly')}
                    style={{ width: 120 }}
                    size="small"
                >
                    <Option value="hourly">Theo giờ</Option>
                    <Option value="daily">Theo ngày</Option>
                    <Option value="weekly">Theo tuần</Option>
                </Select>
            </Col>
        </Row>
    );

    if (loading) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Spin tip="Đang tải xu hướng..." />
                    </div>
                </Card>
            </Col>
        );
    }

    if (error) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <Alert message="Lỗi tải Xu hướng gói tin" description={error} type="warning" showIcon style={{ borderRadius: 8 }} />
                </Card>
            </Col>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <Alert message="Không có dữ liệu" description="Không tìm thấy dữ liệu xu hướng theo thời gian." type="info" showIcon style={{ borderRadius: 8 }} />
                </Card>
            </Col>
        );
    }

    return (
        <Col xs={24} lg={12}>
            <Card
                title={cardTitle}
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }}
                headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}
            >
                <div style={{ height: 330, paddingTop: 10 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                            <XAxis
                                dataKey="time"
                                angle={-30}
                                textAnchor="end"
                                height={50}
                                tickFormatter={(tick) => {
                                    return tick;
                                }}
                            />
                            <YAxis yAxisId="left" orientation="left" stroke={CHART_COLORS.success} />
                            <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.missedLine} />

                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: 0 }} />

                            <Bar yAxisId="left" dataKey="Realtime" fill={CHART_COLORS.success} barSize={20} />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="Gửi lại"
                                stroke={CHART_COLORS.missedLine}
                                strokeWidth={3}
                                dot={{ stroke: CHART_COLORS.missedLine, strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: CHART_COLORS.missedLine, stroke: CHART_COLORS.missedLine, strokeWidth: 2 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </Col>
    );
});

// --- NEW COMPONENT FOR FAILED COMMAND STATISTICS ---
interface FailedCommandStatisticsCardProps {
    commonParams: CommonDashboardQueryParams;
}

const FailedCommandStatisticsCard: React.FC<FailedCommandStatisticsCardProps> = React.memo(({ commonParams }) => {
    const [data, setData] = useState<FailedCommandDataItem[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        limit: 10,
        totalDocuments: 0,
        totalPages: 0,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!commonParams.startTime || !commonParams.endTime) {
                setData(null);
                setPagination({ currentPage: 1, limit: 10, totalDocuments: 0, totalPages: 0 });
                return;
            }

            const paramsWithPagination = {
                ...commonParams,
                page: pagination.currentPage,
                limit: pagination.limit,
            };

            const result = await fetchFailedCommandStatisticsApi(paramsWithPagination);
            setData(result.data);
            setPagination(result.pagination);
        } catch (err: any) {
            console.error("Error fetching FailedCommandStatistics:", err);
            setError(err.message || "Lỗi tải thống kê lệnh lỗi.");
            setData(null);
            setPagination({ currentPage: 1, limit: 10, totalDocuments: 0, totalPages: 0 });
        } finally {
            setLoading(false);
        }
    }, [commonParams, pagination.currentPage, pagination.limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getCommandDescription = (cmd: string): string => {
        return commandsMapping.find(mapping => mapping.name === cmd)?.description || cmd;
    };

    const columns = useMemo(() => [
        {
            title: 'ID Thiết bị',
            dataIndex: 'deviceId',
            key: 'deviceId',
            width: 100,
            fixed: 'left' as const,
            render: (text: string) => <span style={{ fontWeight: 'bold', color: CHART_COLORS.textPrimary }}>{text}</span>
        },
        {
            title: 'Lệnh lỗi',
            dataIndex: 'cmd',
            key: 'cmd',
            width: 180,
            render: (cmd: string) => (
                <span style={{ color: CHART_COLORS.missed, fontWeight: 'bold' }}>
                    {getCommandDescription(cmd)}
                </span>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isMissed',
            key: 'isMissed',
            width: 100,
            render: (isMissed: boolean) => (
                <span style={{ color: isMissed ? CHART_COLORS.missed : CHART_COLORS.success }}>
                    {isMissed ? 'Gửi lại' : 'Realtime'}
                </span>
            ),
        },
        {
            title: 'Thời gian',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 150,
            render: (timestamp: number) => {
                if (!timestamp) return 'N/A';
                const date = new Date(timestamp * 1000);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
            }
        },
    ], []);

    const cardTitle = (
        <Row align="middle" justify="space-between" style={{ width: '100%' }}>
            <Col>⚠️ Thống kê lệnh lỗi</Col>
            <Col>
                {/* Có thể thêm các filter khác ở đây nếu muốn */}
            </Col>
        </Row>
    );

    if (loading) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Spin tip="Đang tải lệnh lỗi..." />
                    </div>
                </Card>
            </Col>
        );
    }

    if (error) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <Alert message="Lỗi tải Thống kê lệnh lỗi" description={error} type="warning" showIcon style={{ borderRadius: 8 }} />
                </Card>
            </Col>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <Alert message="Không có dữ liệu" description="Không tìm thấy dữ liệu lệnh lỗi trong khoảng thời gian đã chọn." type="info" showIcon style={{ borderRadius: 8 }} />
                </Card>
            </Col>
        );
    }

    return (
        <Col xs={24} lg={12}>
            <Card
                title={cardTitle}
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }}
                headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}
            >
                <Table
                    dataSource={data}
                    columns={columns}
                    rowKey={(record, index) => `${record.deviceId}-${record.timestamp}-${index}`} // Unique key
                    pagination={{
                        current: pagination.currentPage,
                        pageSize: pagination.limit,
                        total: pagination.totalDocuments,
                        onChange: (page, pageSize) => {
                            setPagination(prev => ({
                                ...prev,
                                currentPage: page,
                                limit: pageSize,
                            }));
                        },
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '25', '50', '100'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
                    }}
                    size="small"
                    scroll={{ x: 600, y: 250 }} // Cho phép cuộn ngang và giới hạn chiều cao
                    bordered
                    style={{ border: '1px solid #f0f0f0', borderRadius: 8 }}
                />
            </Card>
        </Col>
    );
});
// --- END NEW COMPONENT ---

const Dashboard: React.FC = () => {
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
    const [deviceSearchInput, setDeviceSearchInput] = useState<string>('');
    const [deviceOptions, setDeviceOptions] = useState<{ value: string; label: React.ReactNode; deviceId: string }[]>([]);
    const [cmdDescriptionGlobalFilter, setCmdDescriptionGlobalFilter] = useState<string>('');
    const [actualCmdGlobalToSend, setActualCmdGlobalToSend] = useState<string | undefined>(undefined);

    // Fetch device list on component mount
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
                            <small style={{ color: CHART_COLORS.textSecondary }}>ID: {device.id}</small>
                        </div>
                    ),
                    deviceId: device.id // Store actual deviceId to send to API
                }));
                setDeviceOptions(options);
            } catch (err) {
                console.error("Failed to load device list:", err);
                // Optionally show an alert here
            }
        };
        loadDevices();
    }, []); // Empty dependency array means this runs once on mount

    useEffect(() => {
        const now = dayjs();
        const sevenDaysAgo = dayjs().subtract(7, 'day').startOf('day');
        const endOfToday = now.endOf('day');
        setDateRange([sevenDaysAgo, endOfToday]);
    }, []);

    useEffect(() => {
        const lowerCaseDescription = cmdDescriptionGlobalFilter.toLowerCase();
        const foundCmd = cmdDescriptionMap.get(lowerCaseDescription);
        setActualCmdGlobalToSend(foundCmd);
    }, [cmdDescriptionGlobalFilter]);

    // commonParams giờ sẽ không chứa page/limit vì chúng được quản lý trong từng component con
    // hoặc cho API mới, sẽ được truyền riêng.
    const commonParams: CommonDashboardQueryParams = useMemo(() => ({
        startTime: dateRange[0]?.unix() || null,
        endTime: dateRange[1]?.unix() || null,
        deviceId: selectedDeviceId,
        cmd: actualCmdGlobalToSend
    }), [dateRange, selectedDeviceId, actualCmdGlobalToSend]);

    const handleCmdGlobalFilterChange = useCallback((value: string) => {
        setCmdDescriptionGlobalFilter(value);
    }, []);

    const onDeviceSearch = useCallback((searchText: string) => {
        setDeviceSearchInput(searchText);
    }, []);

    const onDeviceSelect = useCallback((value: string, option: any) => {
        setSelectedDeviceId(option.deviceId);
        setDeviceSearchInput(value);
    }, []);

    const onDeviceClear = useCallback(() => {
        setSelectedDeviceId(undefined);
        setDeviceSearchInput('');
    }, []);


    return (
        <>
            <div style={{ backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 80px)' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 5 }}>
                    <Col>
                        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: CHART_COLORS.textPrimary, margin: 0 }}>
                            Dashboard
                        </h1>
                    </Col>
                </Row>

                <Card style={{ marginBottom: 5, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <Row gutter={[10, 10]} align="top">
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <div style={{ marginBottom: 2, fontWeight: 'bold', color: CHART_COLORS.textPrimary }}>
                                Khoảng thời gian:
                            </div>
                            <RangePicker
                                showTime={{ format: 'HH:mm' }}
                                format="YYYY-MM-DD HH:mm"
                                value={dateRange}
                                onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null])}
                                style={{ width: '100%' }}
                                placeholder={['Từ ngày', 'Đến ngày']}
                                size="large"
                                allowClear={false}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <div style={{ marginBottom: 2, fontWeight: 'bold', color: CHART_COLORS.textPrimary }}>
                                ID thiết bị:
                            </div>
                            <AutoComplete
                                options={deviceOptions}
                                style={{ width: '100%' }}
                                onSearch={onDeviceSearch}
                                onSelect={onDeviceSelect}
                                onChange={onDeviceSearch} // Keep input updated while typing
                                value={deviceSearchInput}
                                placeholder="Tìm theo tên hoặc MAC"
                                allowClear
                                size="large"
                                filterOption={(inputValue, option) => {
                                    const value = String(option?.value || '').toLowerCase();
                                    const label = String(option?.label || '').toLowerCase(); // Use label for display filtering
                                    const input = inputValue.toLowerCase();
                                    return value.includes(input) || label.includes(input);
                                }}
                                onClear={onDeviceClear}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <div style={{ marginBottom: 2, fontWeight: 'bold', color: CHART_COLORS.textPrimary }}>
                                Lệnh:
                            </div>
                            <AutoComplete
                                options={descriptionOptions}
                                style={{ width: '100%' }}
                                onSelect={handleCmdGlobalFilterChange}
                                onSearch={handleCmdGlobalFilterChange}
                                onChange={handleCmdGlobalFilterChange}
                                value={cmdDescriptionGlobalFilter}
                                placeholder="VD: Kết nối & Trạng thái"
                                allowClear
                                size="large"
                                filterOption={(inputValue, option) =>
                                    String(option!.value).toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                }
                            />
                        </Col>
                    </Row>
                </Card>

                <Row gutter={[5, 5]} style={{ marginBottom: 5 }}>
                    <OverallSummaryCard commonParams={commonParams} />
                    <CommandDistributionCard commonParams={commonParams} />
                </Row>
                <Row gutter={[5, 5]}>
                    <TimeSeriesCard commonParams={commonParams} />
                    {/* THAY THẾ TopMissedDevicesCard BẰNG FailedCommandStatisticsCard */}
                    <FailedCommandStatisticsCard commonParams={commonParams} />
                </Row>
            </div>
        </>
    );
};

export default Dashboard;
