import React, { useState, useEffect } from "react";
import { Table } from "antd";

interface ConfigIotsProps {
    dataIotsDetail: any;
    dataOnEvent: any;
    settings: boolean;
}

const ViewCount: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [data, setData] = useState<any>([]);
    const [dataRef, setDataRef] = useState<any>([]);

    useEffect(() => {
        if (dataIotsDetail.data) {
            const combinedData = [...dataRef, ...dataIotsDetail.data];
            const groupedMap = new Map();

            for (const item of combinedData) {
                const key = item.dataName;
                if (!groupedMap.has(key)) {
                    groupedMap.set(key, {
                        ...item,
                        data: Number(item.data) || 0,
                    });
                }
                else {
                    const existing = groupedMap.get(key);
                    groupedMap.set(key, {
                        ...existing,
                        data: existing.data + (Number(item.data) || 0),
                    });
                }
            }

            const result = Array.from(groupedMap.values());
            setDataRef(result);
            setData(result);
        }
    }, [dataIotsDetail.data]);

    return (
        <Table
            bordered
            columns={[
                {
                    title: "Key",
                    dataIndex: "key",
                    key: "key",
                },
                {
                    title: "Data",
                    dataIndex: "data",
                    key: "data",
                    render: (status) => String(status),
                },
                {
                    title: "Unit",
                    dataIndex: "unit",
                    key: "unit",
                },
            ]}
            dataSource={data.map((val: any) => ({
                key: val.dataName,
                data: val.data,
                unit: val.unit,
            }))}
            pagination={false}
        />
    );
};

export default ViewCount;
