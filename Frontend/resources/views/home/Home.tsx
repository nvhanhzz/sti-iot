import React, { useState, useEffect, useCallback } from 'react';
import { Card, Col, Row, Statistic, DatePicker, Select, Input, Spin, Alert, Table, Tag } from 'antd';
import {
    Line as AntdLineChart,
    Pie as AntdPieChart,
    Column as AntdColumnChart,
} from '@ant-design/charts'; // Import các loại biểu đồ từ Ant Design Charts
import dayjs from 'dayjs'; // Thư viện để làm việc với DatePicker của Antd
import './Home.css'; // Dùng để styling tùy chỉnh nếu cần

// =========================================================================
// INTERFACES CHO DỮ LIỆU TỪ API (GIỮ NGUYÊN)
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
    timeBucket: number; // Unix timestamp
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
    lastSeen: number; // Unix timestamp
}

interface PacketCountsByCommandData {
    cmd: string;
    totalPackets: number;
    successfulPackets: number;
    missedPackets: number;
    missRatePercentage: number;
}

interface DeviceConnectivityData {
    deviceId: string;
    deviceName: string;
    mac: string;
    isOnline: boolean;
    lastConnected: number; // Unix timestamp
    disconnectCount: number;
    averageLatencyMs?: number;
}

interface HourlyPerformanceMetricData {
    timeBucket: number; // Unix timestamp
    deviceId: string;
    avgCpuUsagePercentage?: number;
    avgRamUsageMB?: number;
    avgBatteryLevelPercentage?: number;
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
    packetCountsOverTime?: PacketCountOverTimeData[];
    topMissedDevices?: TopMissedDeviceData[];
    packetCountsByCommand?: PacketCountsByCommandData[];
    deviceConnectivity?: DeviceConnectivityData[];
    hourlyPerformanceMetrics?: HourlyPerformanceMetricData[];
}

// =========================================================================
// HẰNG SỐ & TIỆN ÍCH
// =========================================================================

const API_BASE_URL = 'http://localhost:3335/api/dashboard/getData';
const { RangePicker } = DatePicker;
const { Option } = Select;

// Hàm tiện ích để định dạng nhãn thời gian cho biểu đồ
const formatTimeBucketLabel = (timestamp: number, interval: 'hourly' | 'daily' | 'weekly'): string => {
    const date = dayjs(timestamp);
    switch (interval) {
        case 'hourly':
            return date.format('HH:mm DD/MM');
        case 'daily':
            return date.format('DD/MM');
        case 'weekly':
            return date.format('DD/MM/YYYY [Tuần] WW'); // WW: week of year
        default:
            return date.format('DD/MM/YYYY');
    }
};

// =========================================================================
// DASHBOARD COMPONENT CHÍNH
// =========================================================================

const Dashboard: React.FC = () => {
    // ---------------------------------------------------
    // State quản lý bộ lọc
    // ---------------------------------------------------
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
        dayjs().subtract(7, 'day').startOf('day'),
        dayjs().endOf('day')
    ]);
    const [deviceId, setDeviceId] = useState<string>('');
    const [cmd, setCmd] = useState<string>('');
    const [interval, setInterval] = useState<'hourly' | 'daily' | 'weekly'>('daily');
    const [topLimit, setTopLimit] = useState<string>('5');
    const [dataTypes] = useState<string>('summary,packetCountsOverTime,topMissedDevices,packetCountsByCommand,deviceConnectivity,hourlyPerformanceMetrics');

    // ---------------------------------------------------
    // State quản lý dữ liệu, trạng thái loading, lỗi
    // ---------------------------------------------------
    const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ---------------------------------------------------
    // Hàm fetchData: Gửi request đến API backend
    // ---------------------------------------------------
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setDashboardData(null); // Xóa dữ liệu cũ khi bắt đầu tải mới

        try {
            if (!dateRange || !dateRange[0] || !dateRange[1]) {
                throw new Error("Vui lòng chọn khoảng thời gian.");
            }

            // Chuyển đổi Dayjs object sang Unix timestamp (milliseconds)
            const startTimestamp = dateRange[0].valueOf();
            const endTimestamp = dateRange[1].valueOf();

            // Xây dựng query parameters
            const queryParams = new URLSearchParams({
                startTime: startTimestamp.toString(),
                endTime: endTimestamp.toString(),
                interval: interval,
                topLimit: topLimit,
                dataTypes: dataTypes,
            });

            // Thêm các bộ lọc tùy chọn nếu có giá trị
            if (deviceId) queryParams.append('deviceId', deviceId);
            if (cmd) queryParams.append('cmd', cmd);

            const url = `${API_BASE_URL}?${queryParams.toString()}`;
            console.log('Đang tải dữ liệu từ:', url);

            const response = await fetch(url);

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || 'Lỗi khi tải dữ liệu dashboard');
            }

            const data: DashboardResponse = await response.json();
            setDashboardData(data);
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu dashboard:', err);
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
        } finally {
            setLoading(false);
        }
    }, [dateRange, deviceId, cmd, interval, topLimit, dataTypes]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ---------------------------------------------------
    // Render Filters (Sử dụng Ant Design components)
    // ---------------------------------------------------
    const renderFilters = () => (
        <Card title="Bộ lọc Dashboard" className="dashboard-filters-card">
            <Row gutter={[16, 16]} align="bottom">
                <Col xs={24} sm={12} md={8} lg={6}>
                    <label htmlFor="dateRange">Khoảng thời gian:</label>
                    <RangePicker
                        id="dateRange"
                        showTime={{ format: 'HH:mm' }}
                        format="YYYY-MM-DD HH:mm"
                        value={dateRange}
                        onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <label htmlFor="deviceId">ID thiết bị:</label>
                    <Input
                        id="deviceId"
                        placeholder="VD: 101"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <label htmlFor="cmd">Lệnh (CMD):</label>
                    <Input
                        id="cmd"
                        placeholder="VD: sensor_data"
                        value={cmd}
                        onChange={(e) => setCmd(e.target.value)}
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <label htmlFor="interval">Khoảng thời gian (Xu hướng):</label>
                    <Select
                        id="interval"
                        value={interval}
                        onChange={(value) => setInterval(value as any)}
                        style={{ width: '100%' }}
                    >
                        <Option value="hourly">Theo giờ</Option>
                        <Option value="daily">Theo ngày</Option>
                        <Option value="weekly">Theo tuần</Option>
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <label htmlFor="topLimit">Giới hạn Top N:</label>
                    <Input
                        id="topLimit"
                        type="number"
                        min={1}
                        value={topLimit}
                        onChange={(e) => setTopLimit(e.target.value)}
                    />
                </Col>
            </Row>
        </Card>
    );

    // ---------------------------------------------------
    // Render Dashboard Content (Sử dụng Ant Design components)
    // ---------------------------------------------------
    const renderDashboardContent = () => {
        if (loading) {
            return (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
            );
        }
        if (error) {
            return <Alert message="Lỗi" description={error} type="error" showIcon style={{ margin: '20px 0' }} />;
        }
        if (!dashboardData || Object.keys(dashboardData).length <= 1) {
            return <Alert message="Không có dữ liệu" description="Không có dữ liệu thống kê để hiển thị với các bộ lọc hiện tại." type="info" showIcon style={{ margin: '20px 0' }} />;
        }

        const {overallSummary, packetCountsOverTime, topMissedDevices, packetCountsByCommand, deviceConnectivity, hourlyPerformanceMetrics } = dashboardData;

        return (
            <div className="dashboard-content-grid">
                {/* 1. Tổng quan gói tin (Overall Summary) */}
                {overallSummary && (
                    <Card title="Tổng quan gói tin" className="dashboard-card summary-card">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} lg={8}>
                                <Statistic title="Tổng số gói tin" value={overallSummary.totalPackets} />
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Statistic title="Thành công" value={overallSummary.successfulPackets} valueStyle={{ color: '#3f8600' }} />
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Statistic title="Bị Miss" value={overallSummary.missedPackets} valueStyle={{ color: '#cf1322' }} />
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Statistic title="Tỷ lệ Miss" value={overallSummary.missRatePercentage} precision={2} suffix="%" />
                            </Col>
                            {overallSummary.totalUniqueDevices > 0 && (
                                <Col xs={24} sm={12} lg={8}>
                                    <Statistic title="Tổng thiết bị độc nhất" value={overallSummary.totalUniqueDevices} />
                                </Col>
                            )}
                            {overallSummary.totalUniqueCommands > 0 && (
                                <Col xs={24} sm={12} lg={8}>
                                    <Statistic title="Tổng lệnh độc nhất" value={overallSummary.totalUniqueCommands} />
                                </Col>
                            )}
                        </Row>
                    </Card>
                )}

                {/* 2. Xu hướng gói tin theo thời gian (Line Chart) */}
                {packetCountsOverTime && packetCountsOverTime.length > 0 && (
                    <Card title={`Xu hướng gói tin theo ${interval === 'hourly' ? 'giờ' : interval === 'daily' ? 'ngày' : 'tuần'}`} className="dashboard-card chart-card">
                        <AntdLineChart
                            data={packetCountsOverTime.flatMap(d => [
                                { timeBucket: formatTimeBucketLabel(d.timeBucket, interval), type: 'Thành công', value: d.successfulPackets },
                                { timeBucket: formatTimeBucketLabel(d.timeBucket, interval), type: 'Bị Miss', value: d.missedPackets },
                            ])}
                            xField="timeBucket"
                            yField="value"
                            seriesField="type"
                            color={['#3f8600', '#cf1322']}
                            lineStyle={{ lineWidth: 2 }}
                            point={{ size: 4, shape: 'circle' }}
                            tooltip={{
                                formatter: (datum: any) => ({ name: datum.type, value: datum.value.toLocaleString() + ' gói' }),
                                showTitle: true,
                                title: (_title: string, items: any[]) => items[0]?.data?.timeBucket,
                            }}
                            slider={{ start: 0, end: 1 }}
                        />
                    </Card>
                )}

                {/* 3. Top N thiết bị có tỷ lệ Miss cao nhất (Table) */}
                {topMissedDevices && topMissedDevices.length > 0 && (
                    <Card title={`Top ${topLimit} thiết bị có tỷ lệ Miss cao nhất`} className="dashboard-card table-card">
                        <Table
                            dataSource={topMissedDevices}
                            rowKey="deviceId"
                            pagination={false}
                            size="small"
                        >
                            <Table.Column title="ID" dataIndex="deviceId" key="deviceId" />
                            <Table.Column title="Tên Thiết bị" dataIndex="deviceName" key="deviceName" />
                            <Table.Column title="MAC" dataIndex="mac" key="mac" />
                            <Table.Column title="Tổng gói" dataIndex="totalPackets" key="totalPackets" sorter={(a: TopMissedDeviceData, b: TopMissedDeviceData) => a.totalPackets - b.totalPackets} />
                            <Table.Column title="Miss" dataIndex="missedPackets" key="missedPackets" sorter={(a: TopMissedDeviceData, b: TopMissedDeviceData) => a.missedPackets - b.missedPackets} />
                            <Table.Column
                                title="Tỷ lệ Miss"
                                dataIndex="missRatePercentage"
                                key="missRatePercentage"
                                render={(text: number) => <span style={{ color: text > 5 ? '#cf1322' : '#3f8600' }}>{text.toFixed(2)}%</span>}
                                sorter={(a: TopMissedDeviceData, b: TopMissedDeviceData) => a.missRatePercentage - b.missRatePercentage}
                            />
                            <Table.Column
                                title="Lần cuối thấy"
                                dataIndex="lastSeen"
                                key="lastSeen"
                                render={(timestamp: number) => timestamp ? dayjs(timestamp).format('HH:mm DD/MM/YY') : 'N/A'}
                            />
                        </Table>
                    </Card>
                )}

                {/* 4. Phân phối gói tin theo loại lệnh (Pie Chart) */}
                {packetCountsByCommand && packetCountsByCommand.length > 0 && (
                    <Card title="Phân phối gói tin theo loại lệnh" className="dashboard-card chart-card">
                        <AntdPieChart
                            data={packetCountsByCommand}
                            angleField="totalPackets"
                            colorField="cmd"
                            radius={0.8}
                            innerRadius={0.6} // Tạo biểu đồ donut
                            label={{ type: 'inner', formatter: (datum: any) => `${datum.cmd}\n${(datum.percent * 100).toFixed(1)}%` }}
                            interactions={[{ type: 'element-selected' }, { type: 'element-active' }]}
                            legend={{ position: 'bottom' }}
                            tooltip={{
                                formatter: (datum: any) => ({ name: datum.cmd, value: datum.totalPackets.toLocaleString() + ' gói' }),
                            }}
                        />
                    </Card>
                )}

                {/* 5. Trạng thái kết nối thiết bị (Table) */}
                {deviceConnectivity && deviceConnectivity.length > 0 && (
                    <Card title="Trạng thái kết nối thiết bị" className="dashboard-card table-card">
                        <Table
                            dataSource={deviceConnectivity}
                            rowKey="deviceId"
                            pagination={false}
                            size="small"
                        >
                            <Table.Column title="ID" dataIndex="deviceId" key="deviceId" />
                            <Table.Column title="Tên Thiết bị" dataIndex="deviceName" key="deviceName" />
                            <Table.Column title="MAC" dataIndex="mac" key="mac" />
                            <Table.Column
                                title="Trạng thái"
                                dataIndex="isOnline"
                                key="isOnline"
                                render={(isOnline: boolean) => (
                                    <Tag color={isOnline ? 'green' : 'red'}>
                                        {isOnline ? 'Online' : 'Offline'}
                                    </Tag>
                                )}
                            />
                            <Table.Column
                                title="Lần cuối Online"
                                dataIndex="lastConnected"
                                key="lastConnected"
                                render={(timestamp: number) => timestamp ? dayjs(timestamp).format('HH:mm DD/MM/YY') : 'N/A'}
                            />
                            <Table.Column title="Ngắt kết nối" dataIndex="disconnectCount" key="disconnectCount" sorter={(a: DeviceConnectivityData, b: DeviceConnectivityData) => a.disconnectCount - b.disconnectCount}/>
                            {/* Bạn có thể thêm cột độ trễ trung bình nếu có dữ liệu */}
                            {/* <Table.Column title="Độ trễ TB (ms)" dataIndex="averageLatencyMs" key="averageLatencyMs" render={(text) => text !== undefined ? text.toFixed(2) : 'N/A'} /> */}
                        </Table>
                    </Card>
                )}

                {/* 6. Hiệu suất theo giờ (Column Chart) */}
                {hourlyPerformanceMetrics && hourlyPerformanceMetrics.length > 0 && (
                    <Card title="Hiệu suất thiết bị theo giờ" className="dashboard-card chart-card">
                        <p className="chart-note">*Chỉ hiển thị khi lọc theo một Device ID cụ thể*</p>
                        {!deviceId ? (
                            <div className="placeholder-message">Vui lòng chọn một ID thiết bị để xem hiệu suất chi tiết theo giờ.</div>
                        ) : (
                            <AntdColumnChart
                                data={hourlyPerformanceMetrics.flatMap(d => [
                                    { timeBucket: formatTimeBucketLabel(d.timeBucket, 'hourly'), type: 'CPU (%)', value: d.avgCpuUsagePercentage },
                                    { timeBucket: formatTimeBucketLabel(d.timeBucket, 'hourly'), type: 'RAM (MB)', value: d.avgRamUsageMB },
                                    { timeBucket: formatTimeBucketLabel(d.timeBucket, 'hourly'), type: 'Pin (%)', value: d.avgBatteryLevelPercentage },
                                ]).filter(d => d.value !== undefined && d.value !== null)} // Filter out undefined/null values
                                xField="timeBucket"
                                yField="value"
                                seriesField="type"
                                isGroup={true}
                                columnStyle={{ fillOpacity: 0.8 }}
                                color={['#0088FE', '#82ca9d', '#FFBB28']}
                                tooltip={{
                                    formatter: (datum: any) => ({ name: datum.type, value: datum.value.toFixed(2) }),
                                    showTitle: true,
                                    title: (_title: string, items: any[]) => items[0]?.data?.timeBucket,
                                }}
                                slider={{ start: 0, end: 1 }}
                            />
                        )}
                    </Card>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <h1>IoT Gateway Dashboard Thống kê</h1>
            {renderFilters()}
            {renderDashboardContent()}
        </div>
    );
};

export default Dashboard;