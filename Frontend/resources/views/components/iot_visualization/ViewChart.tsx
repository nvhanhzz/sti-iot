import React, { useEffect, useState, useCallback, useRef } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import moment from "moment";

interface DataPoint {
    time: string; // Key cho XAxis, định dạng "HH:mm:ss.SSS"
    [dataKey: string]: string | number | null; // Các keys động cho YAxis (ví dụ: "ADC1_Value (V)", "ADC2_Value (V)")
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

const STATIC_COLOR_MAP: string[] = [
    "#FF5733", "#33FF57", "#3380FF", "#FF33A1", "#FFD700",
    "#800080", "#00CED1", "#DC143C", "#008080", "#8B4513"
];

// Hàm nội suy tuyến tính để tạo điểm dữ liệu trung gian
const interpolateData = (data: DataPoint[], keys: string[]): DataPoint[] => {
    if (data.length < 2) return data;

    const result: DataPoint[] = [];
    const sortedData = [...data].sort((a, b) =>
        moment(a.time, "HH:mm:ss.SSS").valueOf() - moment(b.time, "HH:mm:ss.SSS").valueOf()
    );

    for (let i = 0; i < sortedData.length; i++) {
        result.push(sortedData[i]);

        // Nếu không phải điểm cuối cùng, kiểm tra khoảng cách thời gian
        if (i < sortedData.length - 1) {
            const currentTime = moment(sortedData[i].time, "HH:mm:ss.SSS");
            const nextTime = moment(sortedData[i + 1].time, "HH:mm:ss.SSS");
            const timeDiff = nextTime.diff(currentTime);

            // Nếu khoảng cách > 5 giây, tạo điểm trung gian
            if (timeDiff > 5000) {
                const midTime = moment(currentTime.valueOf() + timeDiff / 2);
                const midPoint: DataPoint = {
                    time: midTime.format("HH:mm:ss.SSS")
                };

                // Nội suy giá trị cho mỗi key
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

    // Sử dụng ref để theo dõi records đã xử lý (dựa trên CMD + time)
    const processedRecordsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const newRecordsFromProps = dataIotsDetail.data;

        if (!newRecordsFromProps || newRecordsFromProps.length === 0) {
            return;
        }

        // Chỉ xử lý các records có time và là ADC channels
        const validRecords = newRecordsFromProps.filter((record: any) => {
            return record.time &&
                (record.CMD === 'CMD_ADC_CHANNEL1' || record.CMD === 'CMD_ADC_CHANNEL2') &&
                record.data !== undefined;
        });

        if (validRecords.length === 0) {
            return;
        }

        // Tạo key unique cho mỗi record dựa trên CMD + time
        const getRecordKey = (record: any) => `${record.CMD}_${record.time}`;

        // Lọc ra những records chưa được xử lý
        const newValidRecords = validRecords.filter((record: any) => {
            const recordKey = getRecordKey(record);
            return !processedRecordsRef.current.has(recordKey);
        });

        if (newValidRecords.length === 0) {
            return;
        }

        // Cập nhật danh sách records đã xử lý
        newValidRecords.forEach((record: any) => {
            const recordKey = getRecordKey(record);
            processedRecordsRef.current.add(recordKey);
        });

        console.log(`📊 Chart Update: Processing ${newValidRecords.length} new ADC records with unique time`);

        // Xử lý records mới
        const newPoints: DataPoint[] = [];
        const currentBatchKeys = new Set<string>();

        newValidRecords.forEach((record: any) => {
            let dataKey: string;
            if (record.CMD === 'CMD_ADC_CHANNEL1') {
                dataKey = `ADC1_Value (V)`;
            } else if (record.CMD === 'CMD_ADC_CHANNEL2') {
                dataKey = `ADC2_Value (mA)`;
            } else {
                return; // Skip nếu không phải ADC channel
            }

            currentBatchKeys.add(dataKey);

            // Xử lý giá trị null/undefined và đảm bảo giá trị hợp lệ
            let value = parseFloat(record.data);
            if (isNaN(value)) {
                value = 0; // Thay vị null/undefined bằng 0
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
            // Nối các điểm mới vào dữ liệu hiện có
            let combinedData = [...prevChartData, ...newPoints];

            // Sắp xếp theo thời gian
            combinedData.sort((a, b) =>
                moment(a.time, "HH:mm:ss.SSS").valueOf() - moment(b.time, "HH:mm:ss.SSS").valueOf()
            );

            // Hợp nhất các điểm tại cùng một thời điểm
            const mergedDataMap = new Map<string, DataPoint>();
            combinedData.forEach(point => {
                if (mergedDataMap.has(point.time)) {
                    const existingPoint = mergedDataMap.get(point.time)!;
                    // Kết hợp dữ liệu, ưu tiên giá trị mới nếu có
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

            // Áp dụng nội suy và làm mượt dữ liệu
            const allKeys = Array.from(new Set([...chartDataKeys, ...Array.from(currentBatchKeys)]));

            // Nội suy để tạo điểm trung gian
            finalChartData = interpolateData(finalChartData, allKeys);

            // Làm mượt dữ liệu
            finalChartData = smoothData(finalChartData, allKeys, 3);

            // Giữ 300 phần tử mới nhất
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

        // Cập nhật chartDataKeys
        setChartDataKeys((prevChartDataKeys) => {
            const combinedSet = new Set([...prevChartDataKeys, ...Array.from(currentBatchKeys)]);
            return Array.from(combinedSet);
        });

        // Dọn dẹp processedRecordsRef để tránh memory leak
        // Chỉ giữ lại 1000 records gần nhất
        if (processedRecordsRef.current.size > 1000) {
            const recordsArray = Array.from(processedRecordsRef.current);
            const toKeep = recordsArray.slice(-500); // Giữ 500 records gần nhất
            processedRecordsRef.current = new Set(toKeep);
        }

    }, [dataIotsDetail.data, chartDataKeys]);

    // --- Các hàm định dạng ---
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
            <ResponsiveContainer width="100%" height={350}>
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
                            stroke={STATIC_COLOR_MAP[index % STATIC_COLOR_MAP.length]}
                            strokeWidth={2}
                            dot={false} // Tắt dots để đường line mượt hơn
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            connectNulls={true} // Kết nối qua null values
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </>
    );
};

export default ViewChart;