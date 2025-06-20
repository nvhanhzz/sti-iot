import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Col, Row, Statistic, DatePicker, Select, Input, Spin, Alert, Button, Table } from 'antd';
import {
    PieChart, Pie, Cell,
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line
} from 'recharts';
import dayjs, { Dayjs } from 'dayjs';
import "./Home.css";

// =========================================================================
// CONSTANTS
// =========================================================================
const API_DASHBOARD_PREFIX = 'http://localhost:3335/api/dashboard';
const { RangePicker } = DatePicker;
const { Option } = Select;

const CHART_COLORS = {
    success: '#4680ff', // Xanh cho Realtime
    missed: '#ff4d4f', // Đỏ cho Gửi lại (missed)
    missedLine: '#ff7875', // Màu đỏ nhạt hơn cho đường Gửi lại
    pieColors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', '#ff1493', '#1e90ff', '#ffa500'],
    grid: '#e0e0e0',
    tooltipBg: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#333',
    textSecondary: '#666',
    otherCommands: '#cccccc' // Màu cho "Các lệnh khác"
};

// =========================================================================
// INTERFACES
// =========================================================================
// Query params chung để truyền xuống các component con
interface CommonDashboardQueryParams {
    startTime: number | null; // Unix timestamp in SECONDS
    endTime: number | null;   // Unix timestamp in SECONDS
    deviceId?: string;
    cmd?: string;
}

// Data interfaces cho từng loại dữ liệu trả về từ API
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
    timeBucket: number; // Unix timestamp in SECONDS (từ BE)
    successfulPackets: number;
    missedPackets: number;
    missRatePercentage: number;
}
interface TopMissedDeviceData {
    deviceId: string;
    deviceName: string;
    mac: string;
    totalPackets: number;
    missedPackets: number;
    missRatePercentage: number;
    lastSeen: number; // Unix timestamp in SECONDS (từ BE)
}
interface PacketCountsByCommandData {
    cmd: string;
    totalPackets: number;
    successfulPackets: number;
    missedPackets: number;
    missRatePercentage: number;
}
interface PieChartDataItem {
    name: string;
    value: number;
    percentage?: string;
}

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================
const formatTimeBucketLabel = (timestamp: number, interval: 'hourly' | 'daily' | 'weekly'): string => {
    // timestamp nhận vào là MILISECONDS (vì đã nhân 1000 khi gọi Date)
    const date = dayjs(timestamp); // Sử dụng dayjs để tạo đối tượng ngày/giờ

    switch (interval) {
        case 'hourly':
            // Sử dụng dayjs.format() với 'h:mm A DD/MM'
            // 'h': giờ (1-12), 'mm': phút, 'A': AM/PM, 'DD': ngày, 'MM': tháng
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

const groupPieData = (data: PieChartDataItem[], thresholdPercentage: number = 2): PieChartDataItem[] => {
    if (!data || data.length === 0) return [];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    const filteredData: PieChartDataItem[] = [];
    let otherValue = 0;
    let otherCount = 0;

    data.forEach(item => {
        const itemPercentage = (item.value / total) * 100;
        if (itemPercentage < thresholdPercentage) {
            otherValue += item.value;
            otherCount++;
        } else {
            filteredData.push(item);
        }
    });

    if (otherValue > 0) {
        filteredData.push({
            name: `Các lệnh khác (${otherCount})`,
            value: otherValue,
            percentage: ((otherValue / total) * 100).toFixed(1)
        });
    }

    return filteredData.sort((a, b) => {
        if (a.name === "Các lệnh khác" && b.name !== "Các lệnh khác") return 1;
        if (a.name !== "Các lệnh khác" && b.name === "Các lệnh khác") return -1;
        return b.value - a.value;
    });
};

// Custom Tooltip cho biểu đồ cột/đường
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

// Custom Tooltip cho biểu đồ tròn
const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
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

// =========================================================================
// API FUNCTIONS
// =========================================================================
// Helper để tạo URLSearchParams từ object
const createSearchParams = (params: Record<string, any>): URLSearchParams => {
    const sp = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null && String(params[key]).trim() !== '') {
            sp.append(key, params[key].toString());
        }
    }
    return sp;
};

// Helper để xử lý response
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

const fetchOverallSummaryApi = async (params: CommonDashboardQueryParams): Promise<OverallSummaryData> => {
    // FE và BE đều dùng GIÂY, nên không cần nhân/chia 1000
    const queryParams = createSearchParams(params);
    const url = `${API_DASHBOARD_PREFIX}/summary?${queryParams.toString()}`;
    return handleResponse(await fetch(url));
};

interface PacketCountsOverTimeApiParams extends CommonDashboardQueryParams {
    interval: 'hourly' | 'daily' | 'weekly';
}
const fetchPacketCountsOverTimeApi = async (params: PacketCountsOverTimeApiParams): Promise<PacketCountOverTimeData[]> => {
    // FE và BE đều dùng GIÂY, nên không cần nhân/chia 1000
    const queryParams = createSearchParams(params);
    const url = `${API_DASHBOARD_PREFIX}/packet-counts-over-time?${queryParams.toString()}`;
    const rawData = await handleResponse(await fetch(url));
    // BE trả về GIÂY, FE nhận GIÂY. Không cần nhân 1000 ở đây nữa.
    // Việc nhân 1000 để tạo Date object sẽ làm trong formatTimeBucketLabel
    return rawData;
};

interface TopMissedDevicesApiParams extends CommonDashboardQueryParams {
    topLimit: string;
}
const fetchTopMissedDevicesApi = async (params: TopMissedDevicesApiParams): Promise<TopMissedDeviceData[]> => {
    // FE và BE đều dùng GIÂY, nên không cần nhân/chia 1000
    const queryParams = createSearchParams(params);
    const url = `${API_DASHBOARD_PREFIX}/top-missed-devices?${queryParams.toString()}`;
    const rawData = await handleResponse(await fetch(url));
    // BE trả về GIÂY, FE nhận GIÂY. Không cần nhân 1000 ở đây nữa.
    // Việc nhân 1000 để tạo Date object sẽ làm trong render function của Table
    return rawData;
};

const fetchPacketCountsByCommandApi = async (params: CommonDashboardQueryParams): Promise<PacketCountsByCommandData[]> => {
    // FE và BE đều dùng GIÂY, nên không cần nhân/chia 1000
    const queryParams = createSearchParams(params);
    const url = `${API_DASHBOARD_PREFIX}/packet-counts-by-command?${queryParams.toString()}`;
    return handleResponse(await fetch(url));
};


// =========================================================================
// SUB-COMPONENTS CHO TỪNG BIỂU ĐỒ (Sử dụng React.memo)
// =========================================================================

// 1. OverallSummaryCard
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
                setData(null); // Clear data if no time range
                return;
            }
            const result = await fetchOverallSummaryApi(commonParams);
            setData(result);
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
        const total = (successfulPackets || 0) + (missedPackets || 0);

        if (total === 0) return [];
        return [
            {
                name: 'Realtime',
                value: successfulPackets || 0,
                percentage: ((successfulPackets || 0) / totalPackets * 100).toFixed(1)
            },
            {
                name: 'Gửi lại',
                value: missedPackets || 0,
                percentage: ((missedPackets || 0) / totalPackets * 100).toFixed(1)
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
                            value={data.missRatePercentage}
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

// 2. CommandDistributionCard
interface CommandDistributionCardProps {
    commonParams: CommonDashboardQueryParams;
}
const CommandDistributionCard: React.FC<CommandDistributionCardProps> = React.memo(({ commonParams }) => {
    const [data, setData] = useState<PacketCountsByCommandData[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [cmdFilter, setCmdFilter] = useState<string>(commonParams.cmd || '');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!commonParams.startTime || !commonParams.endTime) {
                setData(null);
                return;
            }
            const paramsWithCmd = { ...commonParams, cmd: cmdFilter.trim() || undefined };
            const result = await fetchPacketCountsByCommandApi(paramsWithCmd);
            setData(result);
        } catch (err: any) {
            console.error("Error fetching CommandDistribution:", err);
            setError(err.message || "Lỗi tải phân phối gói tin theo lệnh.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [commonParams, cmdFilter]);

    useEffect(() => {
        // Fetch dữ liệu lần đầu và khi commonParams thay đổi
        fetchData();
    }, [fetchData]); // Chỉ re-run khi fetchData thay đổi (do commonParams hoặc cmdFilter thay đổi)


    const pieData = useMemo(() => {
        if (!data) return [];
        return groupPieData(
            data.map(item => ({ name: item.cmd || 'Unknown', value: item.totalPackets || 0 })),
            3
        );
    }, [data]);

    const cardTitle = (
        <Row align="middle" justify="space-between" style={{ width: '100%' }}>
            <Col>📋 Phân phối gói tin theo lệnh</Col>
            <Col>
                <Input.Search
                    placeholder="Lọc theo lệnh"
                    value={cmdFilter}
                    onChange={(e) => setCmdFilter(e.target.value)}
                    onSearch={fetchData} // Bắt sự kiện nhấn Enter hoặc click Search icon
                    style={{ width: 200 }}
                    allowClear
                    size="small"
                />
            </Col>
        </Row>
    );

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
                                label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
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
                            <Legend layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </Col>
    );
});

// 3. TimeSeriesCard
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
                // item.timeBucket từ API là giây, nhân 1000 để tạo Date object trong formatTimeBucketLabel
                time: formatTimeBucketLabel(item.timeBucket * 1000, interval),
                'Realtime': item.successfulPackets || 0,
                'Gửi lại': item.missedPackets || 0,
                timestamp: item.timeBucket * 1000 // Giữ timestamp là mili giây cho việc sắp xếp
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
                                    const index = data.findIndex(d => d.timeBucket === tick);
                                    if (data.length > 15 && index % 3 !== 0) return '';
                                    if (data.length > 7 && index % 2 !== 0) return '';
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

// 4. TopMissedDevicesCard
interface TopMissedDevicesCardProps {
    commonParams: CommonDashboardQueryParams;
    initialTopLimit?: string;
}
const TopMissedDevicesCard: React.FC<TopMissedDevicesCardProps> = React.memo(({ commonParams, initialTopLimit = '5' }) => {
    const [data, setData] = useState<TopMissedDeviceData[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [topLimit, setTopLimit] = useState<string>(initialTopLimit);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const limitNum = parseInt(topLimit);
            if (isNaN(limitNum) || limitNum < 1) {
                throw new Error("Tham số 'Top N' không hợp lệ. Phải là số dương.");
            }
            if (!commonParams.startTime || !commonParams.endTime) {
                setData(null);
                return;
            }

            const paramsWithLimit: TopMissedDevicesApiParams = { ...commonParams, topLimit: topLimit };
            const result = await fetchTopMissedDevicesApi(paramsWithLimit);
            setData(result);
        } catch (err: any) {
            console.error("Error fetching TopMissedDevices:", err);
            setError(err.message || "Lỗi tải top thiết bị gửi lại.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [commonParams, topLimit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const columns = useMemo(() => [
        {
            title: 'ID',
            dataIndex: 'deviceId',
            key: 'deviceId',
            width: 60,
            fixed: 'left' as const,
            render: (text: string) => <span style={{ fontWeight: 'bold', color: CHART_COLORS.textPrimary }}>{text}</span>
        },
        {
            title: 'Tên Thiết bị',
            dataIndex: 'deviceName',
            key: 'deviceName',
            ellipsis: true,
            render: (text: string) => <span style={{ color: CHART_COLORS.textSecondary }}>{text}</span>
        },
        {
            title: 'MAC Address',
            dataIndex: 'mac',
            key: 'mac',
            width: 170,
            render: (mac: string) => <code style={{ backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>{mac}</code>
        },
        {
            title: 'Tổng gói',
            dataIndex: 'totalPackets',
            key: 'totalPackets',
            width: 100,
            sorter: (a: TopMissedDeviceData, b: TopMissedDeviceData) => a.totalPackets - b.totalPackets,
            render: (value: number) => formatNumber(value)
        },
        {
            title: 'Gửi lại',
            dataIndex: 'missedPackets',
            key: 'missedPackets',
            width: 80,
            sorter: (a: TopMissedDeviceData, b: TopMissedDeviceData) => a.missedPackets - b.missedPackets,
            render: (value: number) => (
                <span style={{ color: CHART_COLORS.missed, fontWeight: 'bold' }}>
                    {formatNumber(value)}
                </span>
            )
        },
        {
            title: '% Gửi lại',
            dataIndex: 'missRatePercentage',
            key: 'missRatePercentage',
            width: 100,
            sorter: (a: TopMissedDeviceData, b: TopMissedDeviceData) => a.missRatePercentage - b.missRatePercentage,
            render: (value: number) => (
                <span style={{
                    color: value > 5 ? CHART_COLORS.missed : CHART_COLORS.success,
                    fontWeight: 'bold'
                }}>
                    {formatPercentage(value)}
                </span>
            )
        },
        {
            title: 'Lần cuối gửi',
            dataIndex: 'lastSeen',
            key: 'lastSeen',
            width: 150,
            render: (timestamp: number) => {
                if (!timestamp) return 'N/A';
                // timestamp từ BE là giây, nhân 1000 để tạo Date object
                const date = new Date(timestamp);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
            }
        }
    ], []);

    const cardTitle = (
        <Row align="middle" justify="space-between" style={{ width: '100%' }}>
            <Col>🔝 Top {topLimit} thiết bị có tỷ lệ gửi lại cao nhất</Col>
            <Col>
                <Input
                    type="number"
                    min={1}
                    max={50}
                    value={topLimit}
                    onChange={(e) => setTopLimit(e.target.value)}
                    onPressEnter={fetchData} // Trigger fetch khi nhấn Enter
                    style={{ width: 80 }}
                    size="small"
                />
                <Button onClick={fetchData} size="small" style={{ marginLeft: 8 }}>Áp dụng</Button>
            </Col>
        </Row>
    );

    if (loading) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Spin tip="Đang tải top thiết bị..." />
                    </div>
                </Card>
            </Col>
        );
    }

    if (error) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <Alert message="Lỗi tải Top thiết bị gửi lại" description={error} type="warning" showIcon style={{ borderRadius: 8 }} />
                </Card>
            </Col>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Col xs={24} lg={12}>
                <Card title={cardTitle} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 400 }} headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: '20px', paddingRight: '12px' }}>
                    <Alert message="Không có dữ liệu" description="Không tìm thấy dữ liệu top thiết bị gửi lại." type="info" showIcon style={{ borderRadius: 8 }} />
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
                    rowKey="deviceId"
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
                    bordered
                    style={{ border: '1px solid #f0f0f0', borderRadius: 8 }}
                />
            </Card>
        </Col>
    );
});

// =========================================================================
// MAIN DASHBOARD COMPONENT
// =========================================================================
const Dashboard: React.FC = () => {
    // Bộ lọc chung cho toàn bộ dashboard
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [deviceId, setDeviceId] = useState<string>(''); // deviceId là filter chung
    const [cmd, setCmd] = useState<string>(''); // cmd cũng là filter chung

    // Khởi tạo dateRange mặc định khi component mount
    useEffect(() => {
        const now = dayjs();
        const sevenDaysAgo = dayjs().subtract(7, 'day').startOf('day');
        const endOfToday = now.endOf('day');
        setDateRange([sevenDaysAgo, endOfToday]);
    }, []);

    // Tạo commonParams để truyền xuống các component con.
    const commonParams: CommonDashboardQueryParams = useMemo(() => ({
        startTime: dateRange[0]?.unix() || null, // Convert Dayjs to SECONDS
        endTime: dateRange[1]?.unix() || null,   // Convert Dayjs to SECONDS
        deviceId: deviceId.trim() || undefined,
        cmd: cmd.trim() || undefined
    }), [dateRange, deviceId, cmd]);


    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 80px)' }}>
            {/* Tiêu đề Dashboard và nút Filter */}
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
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={4}>
                        <div style={{ marginBottom: 2, fontWeight: 'bold', color: CHART_COLORS.textPrimary }}>
                            ID thiết bị:
                        </div>
                        <Input
                            placeholder="VD: 101"
                            value={deviceId}
                            onChange={(e) => setDeviceId(e.target.value)}
                            allowClear
                            size="large"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={4}>
                        <div style={{ marginBottom: 2, fontWeight: 'bold', color: CHART_COLORS.textPrimary }}>
                            Lệnh (CMD) - Chung:
                        </div>
                        <Input
                            placeholder="VD: sensor_data"
                            value={cmd}
                            onChange={(e) => setCmd(e.target.value)}
                            allowClear
                            size="large"
                            // Không có onSearch ở đây vì đây là filter chung, không tự trigger fetch cho các card khác.
                            // Các card con sẽ tự re-fetch khi commonParams (bao gồm cmd) thay đổi.
                            // Riêng CommandDistributionCard có input riêng cho cmd, sẽ dùng onSearch ở đó.
                        />
                    </Col>
                </Row>
            </Card>

            {/* Các biểu đồ/bảng sẽ tự quản lý việc tải dữ liệu và bộ lọc riêng */}
            {/* Chúng nhận commonParams và tự fetch dữ liệu */}
            <Row gutter={[5, 5]} style={{ marginBottom: 5 }}>
                <OverallSummaryCard commonParams={commonParams} />
                <CommandDistributionCard commonParams={commonParams} />
            </Row>
            <Row gutter={[5, 5]}>
                <TimeSeriesCard commonParams={commonParams} />
                <TopMissedDevicesCard commonParams={commonParams} />
            </Row>
        </div>
    );
};

export default Dashboard;