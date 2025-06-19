import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DataPoint {
    time: number; // time là timestamp số (milliseconds)
    [key: string]: string | number | boolean | null | undefined;
}

interface ConfigIotsProps {
    dataIotsDetail: {
        data: any[]; // Mảng chứa các điểm dữ liệu
    };
    settings?: boolean;
}

// Hàm định dạng số lớn nhỏ (giữ nguyên)
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

// Cấu hình kênh với màu sắc được cải thiện
const CHANNEL_CONFIGS = {
    "ADC1_Value (V)": { color: "#3b82f6", name: "ADC1 (V)", unit: "V" }, // Blue
    "ADC2_Value (mA)": { color: "#ef4444", name: "ADC2 (mA)", unit: "mA" }, // Red
    "ADC3_Value (pH)": { color: "#f59e0b", name: "ADC3 (pH)", unit: "pH" }, // Orange
    "Temperature (C)": { color: "#10b981", name: "Nhiệt độ", unit: "°C" }, // Green
    "Humidity (%)": { color: "#8b5cf6", name: "Độ ẩm", unit: "%" }, // Purple
};

const FALLBACK_COLORS = [
    "#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6",
    "#06b6d4", "#f97316", "#6b7280", "#ec4899", "#0ea5e9",
];

// parseTime helper để convert về milliseconds
const parseTime = (time: string | number): number => {
    if (typeof time === 'number') {
        return time > 1e10 ? time : time * 1000;
    } else {
        const [timePart, msPart = '0'] = time.split('.');
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        const now = new Date(); // Get current date for consistency
        now.setHours(hours, minutes, seconds, parseInt(msPart));
        return now.getTime();
    }
};

// Custom Tooltip Component - hiển thị thời gian đầy đủ
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const date = new Date(label);
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
        const formattedLabel = `${formattedTime}.${milliseconds}`;

        return (
            <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-300">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                    {formattedLabel}
                </p>
                {payload.map((entry: any, index: number) => {
                    const config = CHANNEL_CONFIGS[entry.dataKey as keyof typeof CHANNEL_CONFIGS];
                    const unit = config?.unit || '';
                    return (
                        <div key={index} className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full border-2 border-white"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    {config?.name || entry.dataKey}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 ml-4">
                                {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value} {unit}
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
    debugger;
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const [chartDataKeys, setChartDataKeys] = useState<string[]>([]);
    const [, setLastUpdateTime] = useState<string>('');
    const [, setDataStats] = useState<{[key: string]: {count: number, latest: number}}>({});

    const processedRecordsRef = useRef<Set<string>>(new Set());

    // Giới hạn số điểm hiển thị trên biểu đồ
    const MAX_DATA_POINTS = 100;

    // **FIX 1: Tính toán Y-axis domain động dựa trên dữ liệu thực tế**
    const yAxisDomain = useMemo(() => {
        if (chartData.length === 0) return [-5, 25];

        let minValue = Infinity;
        let maxValue = -Infinity;

        chartDataKeys.forEach(key => {
            chartData.forEach(point => {
                const value = point[key];
                if (typeof value === 'number' && !isNaN(value)) {
                    minValue = Math.min(minValue, value);
                    maxValue = Math.max(maxValue, value);
                }
            });
        });

        // Nếu không có dữ liệu hợp lệ, dùng default
        if (minValue === Infinity || maxValue === -Infinity) {
            return [-5, 25];
        }

        // Thêm padding 10% để tránh dữ liệu sát biên
        const padding = Math.max((maxValue - minValue) * 0.1, 1);
        return [
            Math.floor(minValue - padding),
            Math.ceil(maxValue + padding)
        ];
    }, [chartData, chartDataKeys]);

    // **FIX 2: Debounce data processing để tránh update quá thường xuyên**
    const dataProcessingTimeoutRef = useRef<NodeJS.Timeout>();

    // Hàm để xử lý dữ liệu mới và cập nhật state của biểu đồ
    useEffect(() => {
        // Clear timeout cũ
        if (dataProcessingTimeoutRef.current) {
            clearTimeout(dataProcessingTimeoutRef.current);
        }

        // Debounce processing
        dataProcessingTimeoutRef.current = setTimeout(() => {
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

            // Tạo key duy nhất cho mỗi bản ghi. Kết hợp CMD và timestamp đã parse.
            const getRecordKey = (record: any) => `${record.CMD}_${parseTime(record.time)}`;

            const newValidRecords = validRecords.filter((record: any) => {
                const recordKey = getRecordKey(record);
                return !processedRecordsRef.current.has(recordKey);
            });

            if (newValidRecords.length === 0) {
                return;
            }

            // Đánh dấu các bản ghi mới là đã xử lý
            newValidRecords.forEach((record: any) => {
                const recordKey = getRecordKey(record);
                processedRecordsRef.current.add(recordKey);
            });

            console.log(`📊 Chart Update: Processing ${newValidRecords.length} new ADC records`);

            const currentBatchKeys = new Set<string>();

            // Cập nhật thống kê
            setDataStats(prevStats => {
                const updatedStats = { ...prevStats };
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

                    let value = parseFloat(record.data);
                    if (isNaN(value)) value = 0;

                    if (!updatedStats[dataKey]) {
                        updatedStats[dataKey] = { count: 0, latest: value };
                    }
                    updatedStats[dataKey].count++;
                    updatedStats[dataKey].latest = value;
                });
                return updatedStats;
            });

            // **FIX 3: Cập nhật dữ liệu ổn định hơn**
            setChartData(prevChartData => {
                const dataMap = new Map<number, DataPoint>();

                // Tạo map từ dữ liệu cũ
                prevChartData.forEach(point => {
                    dataMap.set(point.time, { ...point });
                });

                // Thêm/cập nhật dữ liệu mới
                newValidRecords.forEach(record => {
                    const time = parseTime(record.time);
                    let dataKey: string;
                    if (record.CMD === 'CMD_ADC_CHANNEL1') {
                        dataKey = `ADC1_Value (V)`;
                    } else if (record.CMD === 'CMD_ADC_CHANNEL2') {
                        dataKey = `ADC2_Value (mA)`;
                    } else {
                        return;
                    }

                    let value = parseFloat(record.data);
                    if (isNaN(value)) value = 0;

                    if (dataMap.has(time)) {
                        dataMap.get(time)![dataKey] = value;
                    } else {
                        dataMap.set(time, {
                            time: time,
                            [dataKey]: value
                        });
                    }
                });

                // Convert map về array và sort
                const sortedData = Array.from(dataMap.values())
                    .sort((a, b) => a.time - b.time);

                // Giới hạn số lượng điểm hiển thị một cách ổn định
                return sortedData.length > MAX_DATA_POINTS
                    ? sortedData.slice(-MAX_DATA_POINTS)
                    : sortedData;
            });

            // Cập nhật các key dữ liệu đang được hiển thị trên biểu đồ
            setChartDataKeys(prevChartDataKeys => {
                const combinedSet = new Set([...prevChartDataKeys, ...Array.from(currentBatchKeys)]);
                return Array.from(combinedSet);
            });

            const currentTime = new Date().toLocaleTimeString();
            setLastUpdateTime(currentTime);

            // Dọn dẹp cache của processedRecordsRef để tránh bộ nhớ tăng quá lớn
            if (processedRecordsRef.current.size > 1000) {
                const recordsArray = Array.from(processedRecordsRef.current);
                const toKeep = recordsArray.slice(-500);
                processedRecordsRef.current = new Set(toKeep);
            }
        }, 100); // Debounce 100ms

        return () => {
            if (dataProcessingTimeoutRef.current) {
                clearTimeout(dataProcessingTimeoutRef.current);
            }
        };
    }, [dataIotsDetail.data]);

    // Hàm định dạng tick cho XAxis (timestamp số thành chuỗi thời gian)
    const xAxisTickFormatter = useCallback((value: number): string => {
        const date = new Date(value);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }, []);

    // Hàm định dạng tick cho YAxis
    const yAxisTickFormatter = useCallback((value: number) => formatNumber(value), []);

    // **FIX 4: Memoize chart component để tránh re-render không cần thiết**
    const memoizedChart = useMemo(() => (
        <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
            <CartesianGrid
                stroke="#e5e7eb"
                strokeDasharray="1 1"
                vertical={false}
                opacity={0.4}
            />

            <XAxis
                dataKey="time"
                type="number"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={xAxisTickFormatter}
                domain={['dataMin', 'dataMax']}
                height={60}
                angle={-45}
                textAnchor="end"
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
            />

            <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={yAxisTickFormatter}
                width={80}
                domain={yAxisDomain}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
                wrapperStyle={{
                    fontSize: '14px',
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
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                            r: 5,
                            strokeWidth: 2,
                            stroke: '#ffffff',
                            fill: color
                        }}
                        connectNulls={true}
                        name={config?.name || dataKey}
                        // **FIX 5: Thêm animationDuration để làm mượt transition**
                        animationDuration={10}
                        isAnimationActive={true}
                    />
                );
            })}
        </LineChart>
    ), [chartData, chartDataKeys, yAxisDomain, xAxisTickFormatter, yAxisTickFormatter]);

    return (
        <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Chart Container */}
            <div className="p-4">
                {/* **FIX 6: Cố định kích thước ResponsiveContainer** */}
                <div style={{ width: '100%', height: '750px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {memoizedChart}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ViewChart;