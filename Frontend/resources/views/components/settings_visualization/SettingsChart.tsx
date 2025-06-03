import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import moment from "moment";
interface DataPoint {
    time: string;
    [key: string]: string | number;
}

interface ConfigIotsProps {
    dataIotsDetail: any;
    settings: boolean;
}
const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
};
const SettingsChart: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {

    const [data, setData] = useState<DataPoint[]>([]);
    const [dataCMD, setDataCMD] = useState<string[]>([]);
    const colorMap: string[] = ["#FF5733", "#33FF57", "#3380FF", "#FF33A1", "#FFD700", "#800080", "#00CED1", "#DC143C", "#008080", "#8B4513"];
    const dataChartRef = useRef<any>(null);

    useEffect(() => {
        if (dataIotsDetail.data) {
            const newEntry: DataPoint =
            {
                time: new Date().toLocaleTimeString(),
            };
            for (const payload of dataIotsDetail.data) {
                const fillCMD = dataCMD.filter((e: any) => e == payload.dataName);
                if (fillCMD.length <= 0) {
                    const dataCMDOld = dataCMD;
                    dataCMDOld.push(payload.dataName);
                    setDataCMD(dataCMDOld);
                }
                newEntry[payload.dataName] = payload.data;
            }
            dataChartRef.current = newEntry;
        }
    }, [dataIotsDetail]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (dataChartRef.current) {
                const dataCurrent = { ...dataChartRef.current };
                const time = moment().format('HH:mm:ss.SSS');
                dataCurrent.time = time;
                setData((prevData) => [...prevData, dataCurrent].slice(-10));
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis tickFormatter={(value: number) => formatNumber(value)} />
                    <Tooltip />
                    <Legend />
                    {dataCMD.map((item, index) => (
                        <Line
                            type="monotone"
                            key={index}
                            dataKey={item}
                            stroke={colorMap[index]}
                            strokeWidth={2}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </>
    );
};
export default SettingsChart;
