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

const ViewChart: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const [chartDataKeys, setChartDataKeys] = useState<string[]>([]);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

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
                dataKey = `ADC1_Value (V})`;
            } else if (record.CMD === 'CMD_ADC_CHANNEL2') {
                dataKey = `ADC2_Value (mA})`;
            } else {
                return; // Skip nếu không phải ADC channel
            }

            currentBatchKeys.add(dataKey);

            const newPoint: DataPoint = {
                time: record.time,
                [dataKey]: parseFloat(record.data) || 0
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
                    mergedDataMap.set(point.time, { ...mergedDataMap.get(point.time), ...point });
                } else {
                    mergedDataMap.set(point.time, { ...point });
                }
            });
            let finalChartData = Array.from(mergedDataMap.values());

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

    }, [dataIotsDetail.data]);

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
            {/* Debug info */}
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                Data Points: {chartData.length} | Keys: {chartDataKeys.join(', ')} | Last Update: {lastUpdateTime} | Processed Records: {processedRecordsRef.current.size}
            </div>

            <ResponsiveContainer width="100%" height={300}>
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
                        wrapperStyle={{ fontSize: 11, textAlign: 'center', paddingTop: '10px' }}
                    />
                    {chartDataKeys.map((dataKey, index) => (
                        <Line
                            type="monotone"
                            key={dataKey}
                            dataKey={dataKey}
                            stroke={STATIC_COLOR_MAP[index % STATIC_COLOR_MAP.length]}
                            strokeWidth={2}
                            dot={{ r: 2, strokeWidth: 0 }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            connectNulls={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </>
    );
};

export default ViewChart;