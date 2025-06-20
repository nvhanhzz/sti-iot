import React, { useState, useEffect, useCallback } from 'react';
import { Card, Col, Row, Statistic, DatePicker, Select, Input, Spin, Alert, Button, Table } from 'antd';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs, { Dayjs } from 'dayjs'; // Thêm import dayjs

// =========================================================================
// INTERFACES
// =========================================================================
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
interface TopMissedDeviceData {
    deviceId: string;
    deviceName: string;
    mac: string;
    totalPackets: number;
    missedPackets: number;
    missRatePercentage: number;
    lastSeen: number;
}
interface PacketCountsByCommandData {
    cmd: string;
    totalPackets: number;
    successfulPackets: number;
    missedPackets: number;
    missRatePercentage: number;
}
interface DashboardResponse {
    metadata: {
        requestedStartTime?: number;
        requestedEndTime?: number;
        appliedDeviceId?: string;
        appliedCmd?: string;
        appliedInterval?: 'hourly' | 'daily' | 'weekly';
        appliedTopLimit?: number;
        generatedAt: number;
    };
    overallSummary?: OverallSummaryData;
    overallSummaryError?: string;
    packetCountsOverTime?: PacketCountOverTimeData[] | { error: string };
    topMissedDevices?: TopMissedDeviceData[] | { error: string };
    packetCountsByCommand?: PacketCountsByCommandData[] | { error: string };
}
// =========================================================================
// CONSTANTS
// =========================================================================
const API_BASE_URL = 'http://localhost:3335/api/dashboard/getData';
const { RangePicker } = DatePicker;
const { Option } = Select;
// Màu sắc cho biểu đồ
const COLORS = {
    success: '#52c41a',
    missed: '#ff4d4f',
    pieColors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', '#ff1493', '#1e90ff', '#ffa500']
};
// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================
const formatTimeBucketLabel = (timestamp: number, interval: 'hourly' | 'daily' | 'weekly'): string => {
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    switch (interval) {
        case 'hourly':
            return `${hours}:${minutes} ${day}/${month}`;
        case 'daily':
            return `${day}/${month}`;
        case 'weekly':
            return `${day}/${month}/${year}`;
        default:
            return `${day}/${month}/${year}`;
    }
};
const formatNumber = (num: number): string => {
    return num?.toLocaleString() || '0';
};
const formatPercentage = (num: number): string => {
    return `${(num || 0).toFixed(2)}%`;
};
// =========================================================================
// MAIN COMPONENT
// =========================================================================
const Dashboard: React.FC = () => {
    // States - Đổi type của dateRange từ Date sang Dayjs
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [deviceId, setDeviceId] = useState<string>('');
    const [cmd, setCmd] = useState<string>('');
    const [interval, setInterval] = useState<'hourly' | 'daily' | 'weekly'>('daily');
    const [topLimit, setTopLimit] = useState<string>('5');
    const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // Initialize date range - Sử dụng dayjs thay vì Date
    useEffect(() => {
        const now = dayjs();
        const sevenDaysAgo = dayjs().subtract(7, 'day').startOf('day');
        const endOfToday = now.endOf('day');

        setDateRange([sevenDaysAgo, endOfToday]);
    }, []);
    // =========================================================================
    // API FUNCTIONS
    // =========================================================================
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!dateRange || !dateRange[0] || !dateRange[1]) {
                throw new Error("Vui lòng chọn khoảng thời gian.");
            }
            // Chuyển đổi dayjs objects thành timestamps
            const startTimestamp = dateRange[0].valueOf();
            const endTimestamp = dateRange[1].valueOf();
            const queryParams = new URLSearchParams({
                startTime: startTimestamp.toString(),
                endTime: endTimestamp.toString(),
                interval: interval,
                topLimit: topLimit,
                dataTypes: 'summary,packetCountsOverTime,topMissedDevices,packetCountsByCommand',
            });
            if (deviceId.trim()) queryParams.append('deviceId', deviceId.trim());
            if (cmd.trim()) queryParams.append('cmd', cmd.trim());
            const url = `${API_BASE_URL}?${queryParams.toString()}`;
            console.log('🔄 Fetching data from:', url);
            const response = await fetch(url);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            const data: DashboardResponse = await response.json();
            console.log('📊 Received data:', data);
            setDashboardData(data);
        } catch (err) {
            console.error('❌ Error fetching dashboard data:', err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
            setDashboardData(null);
        } finally {
            setLoading(false);
        }
    }, [dateRange, deviceId, cmd, interval, topLimit]);
    useEffect(() => {
        if (dateRange && dateRange[0] && dateRange[1]) {
            fetchData();
        }
    }, [fetchData]);
    // =========================================================================
    // DATA PROCESSING
    // =========================================================================
    const getOverallSummaryPieData = () => {
        if (!dashboardData?.overallSummary) return [];
        const { successfulPackets, missedPackets } = dashboardData.overallSummary;
        const total = (successfulPackets || 0) + (missedPackets || 0);

        if (total === 0) return [];
        return [
            {
                name: 'Realtime',
                value: successfulPackets || 0,
                percentage: ((successfulPackets || 0) / total * 100).toFixed(1)
            },
            {
                name: 'Gửi lại',
                value: missedPackets || 0,
                percentage: ((missedPackets || 0) / total * 100).toFixed(1)
            },
        ].filter(item => item.value > 0);
    };
    const getCommandPieData = () => {
        const packetCountsByCommand = dashboardData?.packetCountsByCommand;

        if (!packetCountsByCommand || !Array.isArray(packetCountsByCommand)) return [];
        return packetCountsByCommand.map(item => ({
            name: item.cmd || 'Unknown',
            value: item.totalPackets || 0
        })).filter(item => item.value > 0);
    };
    const getTimeSeriesData = () => {
        const packetCountsOverTime = dashboardData?.packetCountsOverTime;

        if (!packetCountsOverTime || !Array.isArray(packetCountsOverTime)) return [];
        return packetCountsOverTime.map(item => ({
            time: formatTimeBucketLabel(item.timeBucket, interval),
            'Thành công': item.successfulPackets || 0,
            'Bị Miss': item.missedPackets || 0,
            timestamp: item.timeBucket
        })).sort((a, b) => a.timestamp - b.timestamp);
    };
    // =========================================================================
    // CUSTOM TOOLTIP COMPONENTS
    // =========================================================================
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{`${label}`}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ margin: '4px 0', color: entry.color }}>
                            {`${entry.dataKey}: ${formatNumber(entry.value)}`}
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
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
                    <p style={{ margin: 0, color: payload[0].color }}>
                        {`Số lượng: ${formatNumber(data.value)}`}
                    </p>
                    {data.percentage && (
                        <p style={{ margin: 0, color: payload[0].color }}>
                            {`Tỷ lệ: ${data.percentage}%`}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };
    // =========================================================================
    // RENDER FUNCTIONS
    // =========================================================================
    const renderFilters = () => (
        <Card title="🔧 Bộ lọc Dashboard" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]} align="top">
                <Col xs={24} sm={12} md={8} lg={6}>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Khoảng thời gian:</strong>
                    </div>
                    <RangePicker
                        showTime={{ format: 'HH:mm' }}
                        format="YYYY-MM-DD HH:mm"
                        value={dateRange}
                        onChange={(dates) => {
                            // Không cần chuyển đổi sang Date, giữ nguyên dayjs objects
                            setDateRange(dates as [Dayjs | null, Dayjs | null]);
                        }}
                        style={{ width: '100%' }}
                        placeholder={['Từ ngày', 'Đến ngày']}
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <div style={{ marginBottom: 8 }}>
                        <strong>ID thiết bị:</strong>
                    </div>
                    <Input
                        placeholder="VD: 101"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Lệnh (CMD):</strong>
                    </div>
                    <Input
                        placeholder="VD: sensor_data"
                        value={cmd}
                        onChange={(e) => setCmd(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Khoảng thời gian:</strong>
                    </div>
                    <Select
                        value={interval}
                        onChange={(value) => setInterval(value)}
                        style={{ width: '100%' }}
                    >
                        <Option value="hourly">Theo giờ</Option>
                        <Option value="daily">Theo ngày</Option>
                        <Option value="weekly">Theo tuần</Option>
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Top N:</strong>
                    </div>
                    <Input
                        type="number"
                        min={1}
                        max={50}
                        value={topLimit}
                        onChange={(e) => setTopLimit(e.target.value)}
                    />
                </Col>
                {/*<Col xs={24}>*/}
                {/*    <Button*/}
                {/*        type="primary"*/}
                {/*        onClick={fetchData}*/}
                {/*        loading={loading}*/}
                {/*        size="large"*/}
                {/*        style={{ minWidth: 120 }}*/}
                {/*    >*/}
                {/*        {loading ? 'Đang tải...' : '🔄 Áp dụng bộ lọc'}*/}
                {/*    </Button>*/}
                {/*</Col>*/}
            </Row>
        </Card>
    );
    const renderOverallSummaryCard = () => {
        const { overallSummary, overallSummaryError } = dashboardData || {};
        if (overallSummaryError) {
            return (
                <Col xs={24} lg={12}>
                    <Alert
                        message="Lỗi tải Tổng quan"
                        description={overallSummaryError}
                        type="warning"
                        showIcon
                    />
                </Col>
            );
        }
        if (!overallSummary || overallSummary.totalPackets === 0) {
            return (
                <Col xs={24} lg={12}>
                    <Alert
                        message="Không có dữ liệu"
                        description="Không tìm thấy dữ liệu tổng quan gói tin."
                        type="info"
                        showIcon
                    />
                </Col>
            );
        }
        const pieData = getOverallSummaryPieData();
        return (
            <Col xs={24} lg={12}>
                <Card title="📊 Tổng quan gói tin" style={{ height: 500 }}>
                    <div style={{ height: 250, marginBottom: 16 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                                >
                                    {pieData.map((_entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === 0 ? COLORS.success : COLORS.missed}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <Row gutter={[8, 8]}>
                        <Col span={5}>
                            <Statistic
                                title="Tổng gói"
                                value={overallSummary.totalPackets}
                                formatter={(value) => formatNumber(Number(value))}
                            />
                        </Col>
                        <Col span={5}>
                            <Statistic
                                title="Realtime"
                                value={overallSummary.successfulPackets}
                                valueStyle={{ color: COLORS.success }}
                                formatter={(value) => formatNumber(Number(value))}
                            />
                        </Col>
                        <Col span={5}>
                            <Statistic
                                title="Gửi lại"
                                value={overallSummary.missedPackets}
                                valueStyle={{ color: COLORS.missed }}
                                formatter={(value) => formatNumber(Number(value))}
                            />
                        </Col>
                        <Col span={5}>
                            <Statistic
                                title="Tỷ lệ gửi lại"
                                value={overallSummary.missRatePercentage}
                                precision={2}
                                suffix="%"
                                valueStyle={{ color: overallSummary.missRatePercentage > 5 ? COLORS.missed : COLORS.success }}
                            />
                        </Col>
                        <Col span={4}>
                            <Statistic
                                title="Thiết bị"
                                value={overallSummary.totalUniqueDevices}
                                formatter={(value) => formatNumber(Number(value))}
                            />
                        </Col>
                    </Row>
                </Card>
            </Col>
        );
    };
    const renderCommandDistributionCard = () => {
        const packetCountsByCommand = dashboardData?.packetCountsByCommand;
        if (packetCountsByCommand && !Array.isArray(packetCountsByCommand)) {
            return (
                <Col xs={24} lg={12}>
                    <Alert
                        message="Lỗi tải Phân phối theo lệnh"
                        description={(packetCountsByCommand as any).error}
                        type="warning"
                        showIcon
                    />
                </Col>
            );
        }
        const pieData = getCommandPieData();
        if (!pieData.length) {
            return (
                <Col xs={24} lg={12}>
                    <Alert
                        message="Không có dữ liệu"
                        description="Không tìm thấy dữ liệu phân phối theo lệnh."
                        type="info"
                        showIcon
                    />
                </Col>
            );
        }
        return (
            <Col xs={24} lg={12}>
                <Card title="📋 Phân phối gói tin theo lệnh" style={{ height: 500 }}>
                    <div style={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((_entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS.pieColors[index % COLORS.pieColors.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </Col>
        );
    };
    const renderTimeSeriesCard = () => {
        const packetCountsOverTime = dashboardData?.packetCountsOverTime;
        if (packetCountsOverTime && !Array.isArray(packetCountsOverTime)) {
            return (
                <Col xs={12}>
                    <Alert
                        message="Lỗi tải Xu hướng gói tin"
                        description={(packetCountsOverTime as any).error}
                        type="warning"
                        showIcon
                    />
                </Col>
            );
        }
        const timeSeriesData = getTimeSeriesData();
        if (!timeSeriesData.length) {
            return (
                <Col xs={12}>
                    <Alert
                        message="Không có dữ liệu"
                        description="Không tìm thấy dữ liệu xu hướng theo thời gian."
                        type="info"
                        showIcon
                    />
                </Col>
            );
        }
        const intervalLabel = interval === 'hourly' ? 'giờ' : interval === 'daily' ? 'ngày' : 'tuần';
        return (
            <Col xs={24}>
                <Card title={`📈 Xu hướng gói tin theo ${intervalLabel}`}>
                    <div style={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="Thành công" fill={COLORS.success} />
                                <Bar dataKey="Bị Miss" fill={COLORS.missed} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </Col>
        );
    };
    const renderTopMissedDevicesCard = () => {
        const topMissedDevices = dashboardData?.topMissedDevices;
        if (topMissedDevices && !Array.isArray(topMissedDevices)) {
            return (
                <Col xs={12}>
                    <Alert
                        message="Lỗi tải Top thiết bị Miss"
                        description={(topMissedDevices as any).error}
                        type="warning"
                        showIcon
                    />
                </Col>
            );
        }
        if (!Array.isArray(topMissedDevices) || !topMissedDevices.length) {
            return (
                <Col xs={12}>
                    <Alert
                        message="Không có dữ liệu"
                        description="Không tìm thấy dữ liệu top thiết bị miss."
                        type="info"
                        showIcon
                    />
                </Col>
            );
        }
        const columns = [
            {
                title: 'ID Thiết bị',
                dataIndex: 'deviceId',
                key: 'deviceId',
                width: 120,
                fixed: 'left' as const,
            },
            {
                title: 'Tên Thiết bị',
                dataIndex: 'deviceName',
                key: 'deviceName',
                ellipsis: true,
            },
            {
                title: 'MAC Address',
                dataIndex: 'mac',
                key: 'mac',
                width: 150,
                render: (mac: string) => <code>{mac}</code>
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
                title: 'Miss',
                dataIndex: 'missedPackets',
                key: 'missedPackets',
                width: 80,
                sorter: (a: TopMissedDeviceData, b: TopMissedDeviceData) => a.missedPackets - b.missedPackets,
                render: (value: number) => (
                    <span style={{ color: COLORS.missed, fontWeight: 'bold' }}>
                        {formatNumber(value)}
                    </span>
                )
            },
            {
                title: 'Tỷ lệ Miss',
                dataIndex: 'missRatePercentage',
                key: 'missRatePercentage',
                width: 100,
                sorter: (a: TopMissedDeviceData, b: TopMissedDeviceData) => a.missRatePercentage - b.missRatePercentage,
                render: (value: number) => (
                    <span style={{
                        color: value > 5 ? COLORS.missed : COLORS.success,
                        fontWeight: 'bold'
                    }}>
                        {formatPercentage(value)}
                    </span>
                )
            },
            {
                title: 'Lần cuối thấy',
                dataIndex: 'lastSeen',
                key: 'lastSeen',
                width: 150,
                render: (timestamp: number) => {
                    if (!timestamp) return 'N/A';
                    const date = new Date(timestamp * 1000);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = String(date.getFullYear()).slice(-2);
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${hours}:${minutes} ${day}/${month}/${year}`;
                }
            }
        ];
        return (
            <Col xs={12}>
                <Card title={`🔝 Top ${topLimit} thiết bị có tỷ lệ gửi lại cao nhất`}>
                    <Table
                        dataSource={topMissedDevices}
                        columns={columns}
                        rowKey="deviceId"
                        pagination={false}
                        size="small"
                        scroll={{ x: 800 }}
                        bordered
                    />
                </Card>
            </Col>
        );
    };
    const renderContent = () => {
        if (loading) {
            return (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" tip="Đang tải dữ liệu dashboard..." />
                </div>
            );
        }
        if (error) {
            return (
                <Alert
                    message="❌ Lỗi tải dữ liệu"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button onClick={fetchData} type="primary" ghost>
                            Thử lại
                        </Button>
                    }
                />
            );
        }
        if (!dashboardData) {
            return (
                <Alert
                    message="📭 Không có dữ liệu"
                    description="Không có dữ liệu để hiển thị với các bộ lọc hiện tại."
                    type="info"
                    showIcon
                />
            );
        }
        return (
            <div style={{ marginTop: 24 }}>
                {/* Row 1: Overall Summary + Command Distribution */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    {renderOverallSummaryCard()}
                    {renderCommandDistributionCard()}
                </Row>
                {/* Row 2: Time Series */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    {renderTimeSeriesCard()}
                    {renderTopMissedDevicesCard()}
                </Row>
                {/*/!* Row 3: Top Missed Devices *!/*/}
                {/*<Row gutter={[16, 16]}>*/}
                {/*</Row>*/}
            </div>
        );
    };
    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ margin: '0 auto' }}>
                {/*<div style={{ marginBottom: 24, textAlign: 'center' }}>*/}
                {/*    <h1 style={{*/}
                {/*        fontSize: '28px',*/}
                {/*        fontWeight: 'bold',*/}
                {/*        color: '#1890ff',*/}
                {/*        margin: 0*/}
                {/*    }}>*/}
                {/*        🚀 IoT Gateway Dashboard*/}
                {/*    </h1>*/}
                {/*    <p style={{ color: '#666', margin: '8px 0 0 0' }}>*/}
                {/*        Thống kê và phân tích dữ liệu gói tin IoT*/}
                {/*    </p>*/}
                {/*</div>*/}
                {renderFilters()}
                {renderContent()}
            </div>
        </div>
    );
};
export default Dashboard;