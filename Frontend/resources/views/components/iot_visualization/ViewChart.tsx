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

// Màu mặc định khi không tìm thấy màu tùy chỉnh hoặc tĩnh
const DEFAULT_COLOR = "#8884d8";

// Định nghĩa các màu tùy chỉnh cho từng kênh dữ liệu cụ thể
const CUSTOM_COLOR_MAP: { [key: string]: string } = {
    "ADC1_Value (V)": "#1A73E8",      // Google Blue - Xanh dương đậm
    "ADC2_Value (mA)": "#D93025",     // Google Red - Đỏ đậm
    "ADC3_Value (pH)": "#F9AB00",     // Google Yellow - Vàng cam
    "Temperature (C)": "#00A693",     // Teal - Xanh ngọc
    "Humidity (%)": "#8F44AD",        // Amethyst - Tím
};

// Mảng màu dự phòng
const FALLBACK_COLOR_PALETTE: string[] = [
    "#4285F4", "#EA4335", "#FBBC05", "#34A853", "#9C27B0",
    "#00BCD4", "#FF9800", "#607D8B", "#E91E63", "#03A9F4",
];

// Helper function để xử lý thời gian linh hoạt
const normalizeTime = (time: string | number): string => {
    if (typeof time === 'number') {
        // Detect nếu là seconds (< 1e10) hoặc milliseconds (>= 1e10)
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
        // Parse "HH:mm:ss.SSS" format
        const [timePart, msPart = '0'] = time.split('.');
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        // Tạo timestamp cho hôm nay với thời gian này
        const today = new Date();
        today.setHours(hours, minutes, seconds, parseInt(msPart));
        return today.getTime();
    }
};

// Hàm nội suy tuyến tính để tạo điểm dữ liệu trung gian
const interpolateData = (data: DataPoint[], keys: string[]): DataPoint[] => {
    if (data.length < 2) return data;

    const result: DataPoint[] = [];
    const sortedData = [...data].sort((a, b) => parseTime(a.time) - parseTime(b.time));

    for (let i = 0; i < sortedData.length; i++) {
        result.push(sortedData[i]);

        if (i < sortedData.length - 1) {
            const currentTime = parseTime(sortedData[i].time);
            const nextTime = parseTime(sortedData[i + 1].time);
            const timeDiff = nextTime - currentTime;

            if (timeDiff > 5000) { // 5 seconds
                const midTime = currentTime + timeDiff / 2;
                const midTimeString = normalizeTime(midTime);

                const midPoint: DataPoint = {
                    time: midTimeString
                };

                keys.forEach(key => {
                    const currentValue = sortedData[i][key] as number;
                    const nextValue = sortedData[i + 1][key] as number;

                    if (typeof currentValue === 'number' && typeof nextValue === 'number') {
                        midPoint[key] = (currentValue + nextValue) / 2;
                    } else if (typeof currentValue === 'number') {
                        midPoint[key] = currentValue;
                    } else if (typeof nextValue === 'number') {
                        midPoint[key] = nextValue;
                    } else {
                        midPoint[key] = 0;
                    }
                });

                result.push(midPoint);
            }
        }
    }
    return result;
};

// Hàm làm mượt dữ liệu bằng moving average
const smoothData = (data: DataPoint[], keys: string[], windowSize: number = 3): DataPoint[] => {
    if (data.length < windowSize) return data;

    return data.map((point, index) => {
        const smoothedPoint: DataPoint = { ...point };

        keys.forEach(key => {
            const values: number[] = [];
            const start = Math.max(0, index - Math.floor(windowSize / 2));
            const end = Math.min(data.length - 1, index + Math.floor(windowSize / 2));

            for (let i = start; i <= end; i++) {
                const value = data[i][key];
                if (typeof value === 'number' && !isNaN(value)) {
                    values.push(value);
                }
            }

            if (values.length > 0) {
                smoothedPoint[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
            }
        });

        return smoothedPoint;
    });
};

const ViewChart: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const [chartDataKeys, setChartDataKeys] = useState<string[]>([]);
    const [, setLastUpdateTime] = useState<string>('');

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
            if (isNaN(value)) {
                value = 0;
            }

            const newPoint: DataPoint = {
                time: normalizeTime(record.time), // Normalize time here
                [dataKey]: value
            };
            newPoints.push(newPoint);
        });

        if (newPoints.length === 0) {
            return;
        }

        setChartData((prevChartData) => {
            let combinedData = [...prevChartData, ...newPoints];

            // Sort by time using the parseTime helper
            combinedData.sort((a, b) => parseTime(a.time) - parseTime(b.time));

            // Merge data points with same timestamp
            const mergedDataMap = new Map<string, DataPoint>();
            combinedData.forEach(point => {
                if (mergedDataMap.has(point.time)) {
                    const existingPoint = mergedDataMap.get(point.time)!;
                    Object.keys(point).forEach(key => {
                        if (key !== 'time' && point[key] !== null && point[key] !== undefined) {
                            existingPoint[key] = point[key];
                        }
                    });
                } else {
                    mergedDataMap.set(point.time, { ...point });
                }
            });

            let finalChartData = Array.from(mergedDataMap.values());

            const allKeys = Array.from(new Set([...chartDataKeys, ...Array.from(currentBatchKeys)]));

            // Apply interpolation and smoothing
            finalChartData = interpolateData(finalChartData, allKeys);
            finalChartData = smoothData(finalChartData, allKeys, 3);

            // Limit data points for performance
            const MAX_DATA_POINTS = 300;
            if (finalChartData.length > MAX_DATA_POINTS) {
                finalChartData = finalChartData.slice(-MAX_DATA_POINTS);
            }

            const currentTime = new Date().toLocaleTimeString();
            setLastUpdateTime(currentTime);
            console.log(`✅ Chart Updated at ${currentTime}: ${finalChartData.length} total points`);

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

    const tooltipFormatter = useCallback((value: any, name: string) => {
        if (value === null || value === undefined) return null;
        return [formatNumber(Number(value)), name];
    }, []);

    const tooltipLabelFormatter = useCallback((label: string) => {
        const timeOnly = label.split('.')[0]; // Remove milliseconds for display
        return `Thời gian: ${timeOnly}`;
    }, []);

    const xAxisTickFormatter = useCallback((value: string) => {
        return value.split('.')[0]; // Remove milliseconds for X-axis display
    }, []);

    const yAxisTickFormatter = useCallback((value: number) => formatNumber(value), []);
//FIXME: có lẽ sẽ cần fix ở height ở 3 dòng dưới
    return (
        <div className="w-full h-full bg-white p-4 rounded-lg shadow-sm">
            <ResponsiveContainer width="100%" height={700}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: '#666' }}
                        tickFormatter={xAxisTickFormatter}
                        interval="preserveStartEnd"
                        height={60}
                        angle={-45}
                        textAnchor="end"
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: '#666' }}
                        tickFormatter={yAxisTickFormatter}
                        width={80}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            fontSize: 12,
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        labelStyle={{ fontWeight: 'bold', fontSize: 12, marginBottom: '8px', color: '#333' }}
                        formatter={tooltipFormatter}
                        labelFormatter={tooltipLabelFormatter}
                    />
                    <Legend
                        wrapperStyle={{
                            fontSize: '13px',
                            textAlign: 'center',
                            paddingTop: '15px',
                            color: '#555'
                        }}
                    />
                    {chartDataKeys.map((dataKey, index) => (
                        <Line
                            type="monotone"
                            key={dataKey}
                            dataKey={dataKey}
                            stroke={CUSTOM_COLOR_MAP[dataKey] || FALLBACK_COLOR_PALETTE[index % FALLBACK_COLOR_PALETTE.length] || DEFAULT_COLOR}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{
                                r: 5,
                                strokeWidth: 2,
                                stroke: '#fff',
                                fill: CUSTOM_COLOR_MAP[dataKey] || FALLBACK_COLOR_PALETTE[index % FALLBACK_COLOR_PALETTE.length] || DEFAULT_COLOR
                            }}
                            connectNulls={true}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {chartData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                        <div className="text-xl mb-2">📊</div>
                        <div>Đang chờ dữ liệu...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewChart;