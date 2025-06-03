import React, { useState, useEffect } from "react";
import { Table } from "antd";
interface ConfigIotsProps {
    dataIotsDetail: any;
    dataOnEvent: any;
    settings: boolean;
}

const SetingsTable: React.FC<ConfigIotsProps> = ({ dataIotsDetail }) => {
    const [data, setData] = useState<[]>([]);

    useEffect(() => {
        try {
            if (dataIotsDetail.data) {
                setData(dataIotsDetail.data);
            }
        } catch (error) {
            console.error("Lỗi khi parse JSON:", error);
        }
    }, [dataIotsDetail]);

    return (

        <Table
            bordered
            columns={[
                { title: "Key", dataIndex: "key", key: "key" },
                {
                    title: "Data",
                    dataIndex: "data",
                    key: "data",
                    render: (status) => String(status),
                },
                { title: "Unit", dataIndex: "unit", key: "unit" },
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

export default SetingsTable;
