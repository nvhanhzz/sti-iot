import React, {useEffect, useRef, useState} from "react";
import {CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import moment from "moment";

interface DataPoint {
    time: string;
    [key: string]: string | number | null; // Cho phép giá trị là null
}

interface ConfigIotsProps {
    dataIotsDetail: any;
    settings: boolean; // Dù không dùng trong ví dụ này, vẫn giữ nguyên interface
}

const formatNumber = (num: number): string => {
    // Xử lý số âm
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

const ViewChart: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [dataCMD, setDataCMD] = useState<string[]>([]);
    // Dùng Map để lưu trữ các bản ghi đã xử lý dựa trên time và dataName để tránh trùng lặp
    const processedRecords = useRef<Map<string, Set<string>>>(new Map());
    const colorMap: string[] = ["#FF5733", "#33FF57", "#3380FF", "#FF33A1", "#FFD700", "#800080", "#00CED1", "#DC143C", "#008080", "#8B4513"];

    useEffect(() => {
        if (!dataIotsDetail.data || dataIotsDetail.data.length === 0) {
            return;
        }

        // Lọc chỉ lấy những bản ghi có CMD phù hợp và chưa được xử lý
        const newRawRecords = dataIotsDetail.data.filter((payload: any) => {
            return (payload.CMD && (payload.CMD === 'CMD_ADC_CHANNEL1' || payload.CMD === 'CMD_ADC_CHANNEL2'));
        });

        if (newRawRecords.length === 0) {
            console.log("Không có bản ghi mới hoặc tất cả đã được xử lý, bỏ qua cập nhật biểu đồ");
            return;
        }

        console.log(`Có ${newRawRecords.length} bản ghi mới, cập nhật biểu đồ`);

        setData((prevData) => {
            // Tạo một bản sao của dữ liệu hiện tại để thao tác
            const updatedDataMap = new Map<string, DataPoint>();
            prevData.forEach(dp => {
                updatedDataMap.set(dp.time, { ...dp }); // Sao chép để tránh thay đổi trực tiếp state cũ
            });

            const newDataNames = new Set<string>();

            newRawRecords.forEach((payload: any) => {
                const { time, dataName, data: value } = payload;

                // Cập nhật processedRecords
                if (!processedRecords.current.has(time)) {
                    processedRecords.current.set(time, new Set());
                }
                processedRecords.current.get(time)?.add(dataName);

                // Thêm dataName mới vào danh sách nếu chưa có
                if (!dataCMD.includes(dataName)) {
                    newDataNames.add(dataName);
                }

                // Cập nhật DataPoint cho thời gian này
                if (!updatedDataMap.has(time)) {
                    updatedDataMap.set(time, { time: time });
                }
                updatedDataMap.get(time)![dataName] = value;
            });

            // Cập nhật dataCMD chỉ một lần sau khi xử lý tất cả bản ghi mới
            if (newDataNames.size > 0) {
                setDataCMD(prev => [...prev, ...Array.from(newDataNames)]);
            }

            // Chuyển Map thành mảng
            let result = Array.from(updatedDataMap.values());

            // Sắp xếp theo thời gian
            result.sort((a, b) =>
                moment(a.time, "HH:mm:ss.SSS").valueOf() - moment(b.time, "HH:mm:ss.SSS").valueOf()
            );

            // Giữ 300 phần tử mới nhất
            result = result.slice(-300);

            // Dọn dẹp processedRecords định kỳ
            // Chỉ giữ lại các bản ghi processed tương ứng với 300 điểm dữ liệu cuối cùng
            const recentTimes = new Set(result.map(dp => dp.time));
            const newProcessedRecords = new Map<string, Set<string>>();
            processedRecords.current.forEach((dataNames, time) => {
                if (recentTimes.has(time)) {
                    newProcessedRecords.set(time, dataNames);
                }
            });
            processedRecords.current = newProcessedRecords;


            return result;
        });
    }, [dataIotsDetail.data, dataCMD]); // Thêm dataCMD vào dependency array để cập nhật đúng khi có series mới

    // Debugging logs để xem dữ liệu
    // useEffect(() => {
    //     console.log("Current Data:", data);
    //     console.log("Current DataCMD:", dataCMD);
    // }, [data, dataCMD]);

    return (
        <>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => {
                            // Chỉ hiển thị giờ:phút:giây, bỏ milliseconds
                            const time = moment(value, "HH:mm:ss.SSS");
                            return time.format("HH:mm:ss");
                        }}
                        interval="preserveStartEnd"
                        height={60}
                    />
                    <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value: number) => formatNumber(value)}
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
                        formatter={(value: any, name: string) => {
                            // Chỉ hiển thị nếu giá trị không phải null
                            if (value === null) {
                                return null;
                            }
                            return [formatNumber(Number(value)), name];
                        }}
                        labelFormatter={(label) => `Thời gian: ${moment(label, "HH:mm:ss.SSS").format("HH:mm:ss")}`}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 11, textAlign: 'center', paddingTop: '10px' }}
                    />
                    {dataCMD.map((item, index) => (
                        <Line
                            type="monotone"
                            key={item} // Dùng item (dataKey) làm key để Recharts theo dõi đúng line
                            dataKey={item}
                            stroke={colorMap[index % colorMap.length]}
                            strokeWidth={2}
                            dot={{ r: 2, strokeWidth: 0 }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            connectNulls={false} // Nếu muốn nối các điểm bị thiếu, đặt là true
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </>
    );
};

export default ViewChart;