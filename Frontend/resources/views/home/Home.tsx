import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from "react-router-dom";
import { useSocket } from '../../../context/SocketContext';
import IotService from '../../../services/IotService';
import CardList from '../components/CardList';

type ContextType = {
    changePageName: (page: string) => void;
};

const Home: React.FC = () => {
    const { t } = useTranslation();
    const socket = useSocket();
    const { changePageName } = useOutletContext<ContextType>();
    const [dataAll, setDataAll] = useState<any[]>([]);
    const [dataIots, setDataIots] = useState<any[]>([]);

    // Ref để theo dõi các event listeners đã đăng ký
    const registeredListenersRef = useRef<Set<string>>(new Set());

    React.useEffect(() => {
        changePageName(t('navleft.dashboard'));
    }, [changePageName, t]);

    const fetchData = async () => {
        try {
            const response: any = await IotService.GetDataIots({});
            const allData = response.data.data;
            setDataAll(allData);
            // Sử dụng strict equality và kiểm tra kiểu
            setDataIots(allData.filter((item: any) => item.isdelete !== true && item.isdelete !== 1));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Thêm callback để cập nhật device type
    const handleUpdateDeviceType = useCallback((deviceId: number, newType: number) => {
        setDataIots((prevData) => {
            return prevData.map((item) => {
                if (item.id === deviceId) {
                    return {
                        ...item,
                        type: newType,
                    };
                }
                return item;
            });
        });
    }, []);

    const handleSocketEvent = useCallback((eventData: any) => {
        console.log("Event data", eventData);
        setDataIots((prevData) => {
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
        setDataIots((prevData) => {
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
        socket.off("iot_update_status", handleSocketEventStatus);

        // Cleanup các listeners đã đăng ký
        registeredListenersRef.current.forEach((eventName) => {
            socket.off(eventName, handleSocketEvent);
        });
        registeredListenersRef.current.clear();
    }, [socket, handleSocketEvent, handleSocketEventStatus]);

    useEffect(() => {
        // Cleanup listeners cũ trước khi đăng ký mới
        cleanupSocketListeners();

        // Đăng ký listener cho status update
        socket.on("iot_update_status", handleSocketEventStatus);

        // Đăng ký listeners cho từng device
        dataIots.forEach((device: any) => {
            const eventName = `iot_send_data_${device.id}`;
            socket.on(eventName, handleSocketEvent);
            registeredListenersRef.current.add(eventName);
        });

        // Cleanup khi component unmount hoặc dependencies thay đổi
        return cleanupSocketListeners;
    }, [socket, dataIots, handleSocketEvent, handleSocketEventStatus, cleanupSocketListeners]);

    useEffect(() => {
        if (dataAll.length > 0) {
            socket.emit("iot:iot_status");
        }
    }, [dataAll, socket]);

    return (
        <>
            <div style={{ backgroundColor: 'white' }}>
                <CardList
                    dataIots={dataIots}
                    onUpdateDeviceType={handleUpdateDeviceType}
                />
            </div>
        </>
    );
};

export default Home;