import React, { useEffect, useState, useCallback, useRef } from "react";
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

// Cấu hình kênh (giữ nguyên)
const CHANNEL_CONFIGS = {
    "ADC1_Value (V)": { color: "#ca8a04", name: "ADC1 (V)", unit: "V" },
    "ADC2_Value (mA)": { color: "#2563eb", name: "ADC2 (mA)", unit: "mA" },
    "ADC3_Value (pH)": { color: "#ca8a04", name: "ADC3 (pH)", unit: "pH" },
    "Temperature (C)": { color: "#059669", name: "Nhiệt độ", unit: "°C" },
    "Humidity (%)": { color: "#7c3aed", name: "Độ ẩm", unit: "%" },
};

const FALLBACK_COLORS = [
    "#2563eb", "#dc2626", "#ca8a04", "#059669", "#7c3aed",
    "#0891b2", "#ea580c", "#6b7280", "#db2777", "#0284c7",
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

// Custom Tooltip Component - hiển thị thời gian đầy đủ (giữ nguyên)
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
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                    {formattedLabel}
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
    const [, setDataStats] = useState<{[key: string]: {count: number, latest: number}}>({});

    const processedRecordsRef = useRef<Set<string>>(new Set());

    // Giới hạn số điểm hiển thị trên biểu đồ
    const MAX_DATA_POINTS = 100;

    // Cố định phạm vi Y từ -5 đến 25
    const yAxisDomain = [-5, 25];

    // Hàm để xử lý dữ liệu mới và cập nhật state của biểu đồ
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

        // Cập nhật dữ liệu hiển thị
        setChartData(prevChartData => {
            const updatedChartData = [...prevChartData];

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

                let existingPoint = updatedChartData.find(p => p.time === time);

                if (existingPoint) {
                    existingPoint[dataKey] = value;
                } else {
                    const newPoint: DataPoint = {
                        time: time,
                        [dataKey]: value
                    };
                    updatedChartData.push(newPoint);
                }
            });

            updatedChartData.sort((a, b) => a.time - b.time);

            // Giới hạn số lượng điểm hiển thị
            if (updatedChartData.length > MAX_DATA_POINTS) {
                return updatedChartData.slice(updatedChartData.length - MAX_DATA_POINTS);
            }

            return updatedChartData;
        });

        // Cập nhật các key dữ liệu đang được hiển thị trên biểu đồ
        setChartDataKeys(prevChartDataKeys => {
            const combinedSet = new Set([...prevChartDataKeys, ...Array.from(currentBatchKeys)]);
            return Array.from(combinedSet);
        });

        const currentTime = new Date().toLocaleTimeString();
        setLastUpdateTime(currentTime);
        console.log(`✅ Chart Updated at ${currentTime}: ${chartData.length} total display data points (after update)`);

        // Dọn dẹp cache của processedRecordsRef để tránh bộ nhớ tăng quá lớn
        if (processedRecordsRef.current.size > 1000) {
            const recordsArray = Array.from(processedRecordsRef.current);
            const toKeep = recordsArray.slice(-500);
            processedRecordsRef.current = new Set(toKeep);
        }

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
                        type="number"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickFormatter={xAxisTickFormatter}
                        domain={['dataMin', 'dataMax']} // Trục X vẫn tự động điều chỉnh
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
                        domain={yAxisDomain} // Sử dụng phạm vi Y đã tính toán cố định
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
                                connectNulls={false}
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