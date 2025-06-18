import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext, useParams } from "react-router-dom"; // Import useParams here
import { useSocket } from '../../../context/SocketContext';
import IotService from '../../../services/IotService';
import CardList from '../components/CardList';

type ContextType = {
    changePageName: (page: string) => void;
};

const ViewDevice: React.FC = () => {
    const { t } = useTranslation();
    const socket = useSocket();
    const { changePageName } = useOutletContext<ContextType>();
    const [dataAll, setDataAll] = useState<any[]>([]); // All data fetched from API
    const [dataIots, setDataIots] = useState<any[]>([]); // Filtered data for display (excluding isdelete)
    const [filteredDataIots, setFilteredDataIots] = useState<any[]>([]); // New state for data filtered by URL ID

    const { id: deviceIdFromUrl } = useParams<{ id: string }>(); // Get 'id' from path parameters
    // console.log("Device ID from URL params:", deviceIdFromUrl); // Log for debugging

    const registeredListenersRef = useRef<Set<string>>(new Set());

    React.useEffect(() => {
        // Change page name to reflect the specific device if an ID is present
        if (deviceIdFromUrl) {
            changePageName(t('navleft.dashboard_detail') + ` (${deviceIdFromUrl})`); // Example: "Dashboard (ABC12345)"
        } else {
            changePageName(t('navleft.dashboard'));
        }
    }, [changePageName, t, deviceIdFromUrl]); // Add deviceIdFromUrl to dependencies

    const fetchData = async () => {
        try {
            const response: any = await IotService.GetDataIots({});
            const allData = response.data.data;
            setDataAll(allData);
            setDataIots(allData.filter((item: any) => item.isdelete !== true && item.isdelete !== 1));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Effect to filter dataIots based on deviceIdFromUrl
    useEffect(() => {
        debugger;
        if (deviceIdFromUrl) {
            const filtered = dataIots.filter(item => item.id === parseInt(deviceIdFromUrl) && !item.isdelete);
            setFilteredDataIots(filtered);
            console.log(`Filtering data for device ID: ${deviceIdFromUrl}`, filtered);
        } else {
            setFilteredDataIots([]);
        }
    }, [deviceIdFromUrl, dataIots]);

    const handleSocketEvent = useCallback((eventData: any) => {
        setDataIots((prevData) => { // Update base dataIots
            return prevData.map((item) => {
                if (item.id === eventData.device_id) {
                    return {
                        ...item,
                        data: eventData.payload,
                    };
                }
                return item;
            });
        });
    }, []);

    const handleSocketEventStatus = useCallback((eventData: any) => {
        setDataIots((prevData) => { // Update base dataIots
            const newData = [...prevData];
            eventData.forEach((e: any) => {
                const index = newData.findIndex((item: any) => item.id === e.iotId);
                if (index >= 0) {
                    const updatedItem = { ...newData[index], ...e };
                    newData.splice(index, 1, updatedItem);
                }
            });
            return newData;
        });
    }, []);

    // Cleanup tất cả socket listeners
    const cleanupSocketListeners = useCallback(() => {
        // Tắt listener chung cho status update
        if (socket) {
            socket.off("iot_update_status", handleSocketEventStatus);
        }

        // Cleanup các listeners đã đăng ký riêng cho từng device
        if (socket && registeredListenersRef.current.size > 0) {
            registeredListenersRef.current.forEach((eventName) => {
                socket.off(eventName, handleSocketEvent);
            });
            registeredListenersRef.current.clear();
        }
    }, [socket, handleSocketEvent, handleSocketEventStatus]);

    useEffect(() => {
        // Cleanup listeners cũ trước khi đăng ký mới
        cleanupSocketListeners();

        // Đăng ký listener chung cho status update
        socket.on("iot_update_status", handleSocketEventStatus);

        // Đăng ký listeners cho từng device trong dataIots
        // Chỉ đăng ký nếu dataIots đã có dữ liệu để tránh lỗi
        if (dataIots.length > 0) {
            dataIots.forEach((device: any) => {
                const eventName = `iot_send_data_${device.id}`;
                socket.on(eventName, handleSocketEvent);
                registeredListenersRef.current.add(eventName);
            });
        }

        // Cleanup khi component unmount hoặc dependencies thay đổi
        return cleanupSocketListeners;
    }, [socket, dataIots, handleSocketEvent, handleSocketEventStatus, cleanupSocketListeners]);

    useEffect(() => {
        // Gửi yêu cầu cập nhật trạng thái khi dataAll có dữ liệu
        if (dataAll.length > 0) {
            socket.emit("iot:iot_status");
        }
    }, [dataAll, socket]);

    return (
        <>
            <div style={{ backgroundColor: 'white' }}>
                {/* Truyền filteredDataIots xuống CardList */}
                <CardList
                    dataIots={filteredDataIots}
                />
            </div>
        </>
    );
};

export default ViewDevice;