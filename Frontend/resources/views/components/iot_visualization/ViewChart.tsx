import React, { useEffect, useState, useCallback, useRef } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DataPoint {
    time: string; // Key cho XAxis, định dạng "HH:mm:ss.SSS"
    // Các keys động cho YAxis (ví dụ: "ADC1_Value (V)", "ADC2_Value (V)")
    [key: string]: string | number | boolean | null | undefined;
}

interface ConfigIotsProps {
    dataIotsDetail: {
        data: any[]; // Mảng chứa các điểm dữ liệu
    };
    settings?: boolean;
}

// Hàm định dạng số lớn nhỏ
const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) {
        return '';
    }
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    let result = '';
    if (absNum >= 1e9) {
        result = (absNum / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
    } else if (absNum >= 1e6) {
        result = (absNum / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
    } else if (absNum >= 1e3) {
        result = (absNum / 1e3).toFixed(2).replace(/\.?0+$/, '') + 'k';
    } else if (absNum >= 1) {
        result = absNum.toFixed(2).replace(/\.?0+$/, '');
    } else if (absNum > 0) {
        result = absNum.toFixed(4).replace(/\.?0+$/, '');
    } else {
        result = '0';
    }
    return isNegative ? '-' + result : result;
};

// Màu sắc đơn giản, dễ nhìn
const CHANNEL_CONFIGS = {
    "ADC1_Value (V)": {
        color: "#ca8a04", // Blueca8a04
        name: "ADC1 (V)",
        unit: "V"
    },
    "ADC2_Value (mA)": {
        color: "#2563eb", // Red
        name: "ADC2 (mA)",
        unit: "mA"
    },
    "ADC3_Value (pH)": {
        color: "#ca8a04", // Yellow
        name: "ADC3 (pH)",
        unit: "pH"
    },
    "Temperature (C)": {
        color: "#059669", // Green
        name: "Nhiệt độ",
        unit: "°C"
    },
    "Humidity (%)": {
        color: "#7c3aed", // Purple
        name: "Độ ẩm",
        unit: "%"
    },
};

// Màu dự phòng đơn giản
const FALLBACK_COLORS = [
    "#2563eb", "#dc2626", "#ca8a04", "#059669", "#7c3aed",
    "#0891b2", "#ea580c", "#6b7280", "#db2777", "#0284c7",
];

// Helper function để xử lý thời gian linh hoạt
const normalizeTime = (time: string | number): string => {
    if (typeof time === 'number') {
        const timestamp = time > 1e10 ? time : time * 1000;
        const date = new Date(timestamp);
        return date.toTimeString().split(' ')[0] + '.' + date.getMilliseconds().toString().padStart(3, '0');
    }
    return time;
};

// Parse time helper để convert về milliseconds
const parseTime = (time: string | number): number => {
    if (typeof time === 'number') {
        return time > 1e10 ? time : time * 1000;
    } else {
        const [timePart, msPart = '0'] = time.split('.');
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        const today = new Date();
        today.setHours(hours, minutes, seconds, parseInt(msPart));
        return today.getTime();
    }
};

// Custom Tooltip Component - đơn giản
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                    {label}
                </p>
                {payload.map((entry: any, index: number) => {
                    const config = CHANNEL_CONFIGS[entry.dataKey as keyof typeof CHANNEL_CONFIGS];
                    const unit = config?.unit || '';
                    return (
                        <div key={index} className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm text-gray-600">
                                    {config?.name || entry.dataKey}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-800 ml-3">
                                {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value} {unit}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

const ViewChart: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const [chartDataKeys, setChartDataKeys] = useState<string[]>([]);
    const [, setLastUpdateTime] = useState<string>('');
    const [dataStats, setDataStats] = useState<{[key: string]: {count: number, latest: number}}>({});

    const processedRecordsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const newRecordsFromProps = dataIotsDetail.data;

        if (!newRecordsFromProps || newRecordsFromProps.length === 0) {
            return;
        }

        const validRecords = newRecordsFromProps.filter((record: any) => {
            return record.time &&
                (record.CMD === 'CMD_ADC_CHANNEL1' || record.CMD === 'CMD_ADC_CHANNEL2') &&
                record.data !== undefined;
        });

        if (validRecords.length === 0) {
            return;
        }

        const getRecordKey = (record: any) => `${record.CMD}_${record.time}`;

        const newValidRecords = validRecords.filter((record: any) => {
            const recordKey = getRecordKey(record);
            return !processedRecordsRef.current.has(recordKey);
        });

        if (newValidRecords.length === 0) {
            return;
        }

        newValidRecords.forEach((record: any) => {
            const recordKey = getRecordKey(record);
            processedRecordsRef.current.add(recordKey);
        });

        console.log(`📊 Chart Update: Processing ${newValidRecords.length} new ADC records`);

        const newPoints: DataPoint[] = [];
        const currentBatchKeys = new Set<string>();
        const newStats: {[key: string]: {count: number, latest: number}} = {};

        newValidRecords.forEach((record: any) => {
            let dataKey: string;
            if (record.CMD === 'CMD_ADC_CHANNEL1') {
                dataKey = `ADC1_Value (V)`;
            } else if (record.CMD === 'CMD_ADC_CHANNEL2') {
                dataKey = `ADC2_Value (mA)`;
            } else {
                return;
            }

            currentBatchKeys.add(dataKey);

            // GIỮ NGUYÊN DỮ LIỆU THÔ - KHÔNG MODIFY
            let value = parseFloat(record.data);
            if (isNaN(value)) {
                value = 0;
            }

            // Update stats
            if (!newStats[dataKey]) {
                newStats[dataKey] = { count: 0, latest: value };
            }
            newStats[dataKey].count++;
            newStats[dataKey].latest = value;

            const newPoint: DataPoint = {
                time: normalizeTime(record.time),
                [dataKey]: value // DỮ LIỆU CHÍNH XÁC 100%
            };
            newPoints.push(newPoint);
        });

        if (newPoints.length === 0) {
            return;
        }

        // Update stats
        setDataStats(prevStats => {
            const updatedStats = { ...prevStats };
            Object.keys(newStats).forEach(key => {
                if (updatedStats[key]) {
                    updatedStats[key].count += newStats[key].count;
                    updatedStats[key].latest = newStats[key].latest;
                } else {
                    updatedStats[key] = newStats[key];
                }
            });
            return updatedStats;
        });

        setChartData((prevChartData) => {
            let combinedData = [...prevChartData, ...newPoints];

            // Chỉ sort theo thời gian - KHÔNG làm mịn dữ liệu
            combinedData.sort((a, b) => parseTime(a.time) - parseTime(b.time));

            // Merge data points với cùng timestamp (nhưng giữ nguyên giá trị)
            const mergedDataMap = new Map<string, DataPoint>();
            combinedData.forEach(point => {
                if (mergedDataMap.has(point.time)) {
                    const existingPoint = mergedDataMap.get(point.time)!;
                    Object.keys(point).forEach(key => {
                        if (key !== 'time' && point[key] !== null && point[key] !== undefined) {
                            existingPoint[key] = point[key]; // GIỮ NGUYÊN GIÁ TRỊ
                        }
                    });
                } else {
                    mergedDataMap.set(point.time, { ...point });
                }
            });

            let finalChartData = Array.from(mergedDataMap.values());

            // Limit data points for performance (chỉ giữ lại số lượng, không thay đổi giá trị)
            const MAX_DATA_POINTS = 100;
            if (finalChartData.length > MAX_DATA_POINTS) {
                finalChartData = finalChartData.slice(-MAX_DATA_POINTS);
            }

            const currentTime = new Date().toLocaleTimeString();
            setLastUpdateTime(currentTime);
            console.log(`✅ Chart Updated at ${currentTime}: ${finalChartData.length} total RAW data points`);

            return finalChartData;
        });

        setChartDataKeys((prevChartDataKeys) => {
            const combinedSet = new Set([...prevChartDataKeys, ...Array.from(currentBatchKeys)]);
            return Array.from(combinedSet);
        });

        // Clean up processed records cache
        if (processedRecordsRef.current.size > 1000) {
            const recordsArray = Array.from(processedRecordsRef.current);
            const toKeep = recordsArray.slice(-500);
            processedRecordsRef.current = new Set(toKeep);
        }

    }, [dataIotsDetail.data, chartDataKeys]);

    const xAxisTickFormatter = useCallback((value: string) => {
        return value.split('.')[0]; // Chỉ ẩn milliseconds trên trục X để gọn
    }, []);

    const yAxisTickFormatter = useCallback((value: number) => formatNumber(value), []);

    return (
        <div className="w-full h-full bg-white p-4 rounded-lg shadow-sm border border-gray-200">

            <ResponsiveContainer width="100%" height={700}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid
                        stroke="#e5e7eb"
                        strokeDasharray="2 2"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickFormatter={xAxisTickFormatter}
                        interval="preserveStartEnd"
                        height={60}
                        angle={-45}
                        textAnchor="end"
                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                        tickLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                    />

                    <YAxis
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickFormatter={yAxisTickFormatter}
                        width={80}
                        domain={['auto', 'auto']}
                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                        tickLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Legend
                        wrapperStyle={{
                            fontSize: '13px',
                            textAlign: 'center',
                            paddingTop: '15px',
                            color: '#374151'
                        }}
                    />

                    {chartDataKeys.map((dataKey, index) => {
                        const config = CHANNEL_CONFIGS[dataKey as keyof typeof CHANNEL_CONFIGS];
                        const color = config?.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

                        return (
                            <Line
                                type="monotone"
                                key={dataKey}
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                dot={{
                                    r: 2,
                                    fill: color
                                }}
                                activeDot={{
                                    r: 4,
                                    strokeWidth: 2,
                                    stroke: '#fff',
                                    fill: color
                                }}
                                connectNulls={false} // Không nối các điểm null - chỉ vẽ khi có dữ liệu
                                name={config?.name || dataKey}
                            />
                        );
                    })}
                </LineChart>
            </ResponsiveContainer>

            {chartData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="text-4xl mb-3">📊</div>
                        <div className="text-lg font-medium text-gray-600 mb-2">Đang chờ dữ liệu...</div>
                        <div className="text-sm text-gray-500">Hệ thống sẽ hiển thị biểu đồ khi có dữ liệu ADC</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewChart;