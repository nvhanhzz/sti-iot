import React, { useEffect, useState, useCallback, useRef } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import moment from "moment";

interface DataPoint {
    time: string; // Key cho XAxis, định dạng "HH:mm:ss.SSS"
    // Các keys động cho YAxis (ví dụ: "ADC1_Value (V)", "ADC2_Value (V)")
    [key: string]: string | number | boolean | null | undefined;
}

interface ConfigIotsProps {
    dataIotsDetail: {
        data: any[]; // Mảng chứa các điểm dữ liệu
    };
    settings: boolean;
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

// Màu mặc định khi không tìm thấy màu tùy chỉnh hoặc tĩnh
const DEFAULT_COLOR = "#8884d8"; // Màu tím nhạt

// --- ĐÂY LÀ PHẦN ĐỔI MÀU ---
// Định nghĩa các màu tùy chỉnh cho từng kênh dữ liệu cụ thể
const CUSTOM_COLOR_MAP: { [key: string]: string } = {
    "ADC1_Value (V)": "#1A73E8",      // Google Blue - Xanh dương đậm
    "ADC2_Value (mA)": "#D93025",     // Google Red - Đỏ đậm
    "ADC3_Value (pH)": "#F9AB00",     // Google Yellow - Vàng cam (ví dụ nếu có thêm kênh)
    "Temperature (C)": "#00A693",     // Teal - Xanh ngọc
    "Humidity (%)": "#8F44AD",        // Amethyst - Tím
    // Thêm các ánh xạ khác nếu bạn có thêm kênh dữ liệu muốn tùy chỉnh màu
};

// Mảng màu dự phòng, sẽ dùng nếu CUSTOM_COLOR_MAP không có key tương ứng
const FALLBACK_COLOR_PALETTE: string[] = [
    "#4285F4", // Blue
    "#EA4335", // Red
    "#FBBC05", // Yellow
    "#34A853", // Green
    "#9C27B0", // Purple
    "#00BCD4", // Cyan
    "#FF9800", // Orange
    "#607D8B", // Blue Grey
    "#E91E63", // Pink
    "#03A9F4", // Light Blue
];
// --- KẾT THÚC PHẦN ĐỔI MÀU ---


// Hàm nội suy tuyến tính để tạo điểm dữ liệu trung gian (giữ nguyên)
const interpolateData = (data: DataPoint[], keys: string[]): DataPoint[] => {
    if (data.length < 2) return data;

    const result: DataPoint[] = [];
    const sortedData = [...data].sort((a, b) =>
        moment(a.time, "HH:mm:ss.SSS").valueOf() - moment(b.time, "HH:mm:ss.SSS").valueOf()
    );

    for (let i = 0; i < sortedData.length; i++) {
        result.push(sortedData[i]);

        if (i < sortedData.length - 1) {
            const currentTime = moment(sortedData[i].time, "HH:mm:ss.SSS");
            const nextTime = moment(sortedData[i + 1].time, "HH:mm:ss.SSS");
            const timeDiff = nextTime.diff(currentTime);

            if (timeDiff > 5000) {
                const midTime = moment(currentTime.valueOf() + timeDiff / 2);
                const midPoint: DataPoint = {
                    time: midTime.format("HH:mm:ss.SSS")
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

// Hàm làm mượt dữ liệu bằng moving average (giữ nguyên)
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

        console.log(`📊 Chart Update: Processing ${newValidRecords.length} new ADC records with unique time`);

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
                time: record.time,
                [dataKey]: value
            };
            newPoints.push(newPoint);
        });

        if (newPoints.length === 0) {
            return;
        }

        setChartData((prevChartData) => {
            let combinedData = [...prevChartData, ...newPoints];

            combinedData.sort((a, b) =>
                moment(a.time, "HH:mm:ss.SSS").valueOf() - moment(b.time, "HH:mm:ss.SSS").valueOf()
            );

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

            finalChartData = interpolateData(finalChartData, allKeys);

            finalChartData = smoothData(finalChartData, allKeys, 3);

            const MAX_DATA_POINTS = 300;
            if (finalChartData.length > MAX_DATA_POINTS) {
                finalChartData = finalChartData.slice(-MAX_DATA_POINTS);
            }

            const currentTime = moment().format("HH:mm:ss");
            setLastUpdateTime(currentTime);
            console.log(`✅ Chart Updated at ${currentTime}: ${finalChartData.length} total points, latest values:`,
                finalChartData.slice(-2));

            return finalChartData;
        });

        setChartDataKeys((prevChartDataKeys) => {
            const combinedSet = new Set([...prevChartDataKeys, ...Array.from(currentBatchKeys)]);
            return Array.from(combinedSet);
        });

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
        return `Thời gian: ${moment(label, "HH:mm:ss.SSS").format("HH:mm:ss")}`;
    }, []);

    const xAxisTickFormatter = useCallback((value: string) => {
        const time = moment(value, "HH:mm:ss.SSS");
        return time.format("HH:mm:ss");
    }, []);

    const yAxisTickFormatter = useCallback((value: number) => formatNumber(value), []);

    return (
        <>
            <ResponsiveContainer width="100%" height={720}>
                <LineChart data={chartData}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        tickFormatter={xAxisTickFormatter}
                        interval="preserveStartEnd"
                        height={60}
                    />
                    <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={yAxisTickFormatter}
                        width={80}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            fontSize: 11,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                        labelStyle={{ fontWeight: 'bold', fontSize: 11, marginBottom: '5px' }}
                        formatter={tooltipFormatter}
                        labelFormatter={tooltipLabelFormatter}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 13, textAlign: 'center', paddingTop: '10px' }}
                    />
                    {chartDataKeys.map((dataKey, index) => (
                        <Line
                            type="monotone"
                            key={dataKey}
                            dataKey={dataKey}
                            // Sử dụng CUSTOM_COLOR_MAP trước, sau đó fallback tới FALLBACK_COLOR_PALETTE, cuối cùng là DEFAULT_COLOR
                            stroke={CUSTOM_COLOR_MAP[dataKey] || FALLBACK_COLOR_PALETTE[index % FALLBACK_COLOR_PALETTE.length] || DEFAULT_COLOR}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            connectNulls={true}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </>
    );
};

export default ViewChart;