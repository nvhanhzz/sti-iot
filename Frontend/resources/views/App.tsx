import React from 'react';
import AppRouter from '../../router/router'

import '../assets/css/style.css'
const App: React.FC = () => {
  return (
    <>
      <AppRouter />
    </>
  );
};

export default App;
//
// // Trong component cha của ViewTable, ví dụ App.tsx hoặc một trang nào đó
//
// import React, { useState, useEffect } from 'react';
// import ViewTable from "./components/iot_visualization/ViewTable.tsx";
//
// // mockData.ts hoặc trong ViewTable.tsx
//
// import moment from 'moment';
//
// const generateMockIotData = (numRecords: number = 50) => {
//     const mockData = [];
//     const cmds = [
//         "CMD_DEVICE_INFO",
//         "CMD_GET_SENSOR_DATA",
//         "CMD_SET_THRESHOLD",
//         "CMD_STATUS_REPORT",
//         "CMD_FIRMWARE_UPDATE",
//         "CMD_PUSH_MODBUS_RS485", // CMD đặc biệt 1
//         "CMD_PUSH_MODBUS_RS232", // CMD đặc biệt 2
//         "CMD_INPUT_CHANNEL_1", // Để kiểm tra màu boolean
//         "CMD_INPUT_CHANNEL_2", // Để kiểm tra màu boolean
//         "CMD_NOTIFY_ERROR", // Sẽ bị lọc bỏ
//         "CMD_NOTIFY_WARNING" // Sẽ bị lọc bỏ
//     ];
//     const payloadNames = ["temperature", "humidity", "pressure", "voltage", "current", "status", "data", "value"];
//     const units = ["°C", "%RH", "hPa", "V", "A", "", "", ""];
//
//     for (let i = 0; i < numRecords; i++) {
//         const randomCmd = cmds[Math.floor(Math.random() * cmds.length)];
//         const randomPayloadName = payloadNames[Math.floor(Math.random() * payloadNames.length)];
//         const randomUnit = units[Math.floor(Math.random() * units.length)];
//
//         let dataValue: any;
//         if (randomCmd.startsWith("CMD_INPUT_CHANNEL")) {
//             dataValue = Math.random() > 0.5; // true/false cho input channel
//         } else if (randomPayloadName === "data" && (randomCmd === "CMD_PUSH_MODBUS_RS485" || randomCmd === "CMD_PUSH_MODBUS_RS232")) {
//             // Dữ liệu string cho các CMD đẩy Modbus
//             const sampleModbusData = ["010300000001840A", "010300010001D5CA", "HelloModbus", "SensorRead"];
//             dataValue = sampleModbusData[Math.floor(Math.random() * sampleModbusData.length)];
//         } else if (randomPayloadName === "id") {
//             dataValue = moment().subtract(Math.random() * 3600, 'seconds').unix(); // timestamp ngẫu nhiên
//         } else if (typeof Math.random() > 0.7 && randomPayloadName !== "data") {
//             dataValue = Math.floor(Math.random() * 100); // Giá trị số nguyên
//         }
//         else {
//             dataValue = (Math.random() * 100).toFixed(2); // Giá trị số thập phân
//         }
//
//
//         mockData.push({
//             CMD: randomCmd,
//             CMD_Decriptions: `${randomCmd.replace("CMD_", "")} description`,
//             payload_name: randomPayloadName,
//             data: dataValue,
//             unit: randomUnit,
//             time: moment().subtract(i * 100, 'milliseconds').format("HH:mm:ss.SSS") // Thời gian giảm dần
//         });
//     }
//
//     return { data: mockData };
// };
//
// function App() {
//     const [iotData, setIotData] = useState<any>(null);
//
//     useEffect(() => {
//         // Sinh dữ liệu giả định khi component mount
//         const mockData = generateMockIotData(100); // Sinh 100 bản ghi
//         setIotData(mockData);
//
//         // Giả lập cập nhật dữ liệu sau mỗi vài giây
//         const interval = setInterval(() => {
//             setIotData(generateMockIotData(100)); // Cập nhật dữ liệu mới
//         }, 5000); // Cập nhật sau mỗi 5 giây
//
//         return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
//     }, []);
//
//     if (!iotData) {
//         return <div>Đang tải dữ liệu...</div>;
//     }
//
//     return (
//         <div style={{ padding: '20px' }}>
//             <h1>Dashboard IoT</h1>
//             <ViewTable dataIotsDetail={iotData} />
//         </div>
//     );
// }
//
// export default App;