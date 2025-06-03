import React, { useState, useEffect, useCallback } from 'react';
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

    React.useEffect(() => {
        changePageName(t('navleft.dashboard'));
    }, [changePageName]);

    const fetchData = async () => {
        try {
            const response: any = await IotService.GetDataIots({});
            setDataAll(response.data.data)
            setDataIots(response.data.data.filter(item => item.isdelete !== true))
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSocketEvent = useCallback((eventData: any) => {
        console.log("event data: ----------------------------------------------------------", eventData);
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

    useEffect(() => {
        socket.on("iot_update_status", handleSocketEventStatus);
        dataIots.map((e: any) => {
            socket.on("iot_send_data_" + (e.id), handleSocketEvent);
        })
        return () => {
            socket.off("iot_send_data");
            dataIots.map((e: any) => {
                socket.off("iot_send_data_" + (e.id), handleSocketEvent);
            })
        };
    }, [socket, dataIots]);

    useEffect(() => {
        socket.emit("iot:iot_status");
    }, [dataAll]);

    return <>
        <div className='row'>
            <div className="col-lg-6 col-md-12">
                <div className="row">
                    <div className="col-sm-12">
                        <div className="card support-bar overflow-hidden">
                            <div className="card-body pb-0">
                                <h3 className="m-0">Tổng Số Lượng Kết Nối : {dataAll.length} Thiết Bị</h3>
                            </div>
                            <div className="card-footer bg-success text-white">
                                <div className="row text-center">
                                    <div className="col">
                                        <h4 className="m-0 text-white">{dataAll.filter((e: any) => e.isdelete == 0).length}</h4>
                                        <span>Đã Active</span>
                                    </div>
                                    <div className="col">
                                        <h4 className="m-0 text-white">{dataAll.filter((e: any) => e.isdelete == 1).length}</h4>
                                        <span>Chưa Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-lg-6 col-md-12">
                <div className="row">
                    <div className="col-sm-6">
                        <div className="card">
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-8">
                                        <h4 className="text-c-yellow">Số Lượng Topic</h4>
                                        <h6 className="text-muted m-b-0">Topic</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="card">
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-8">
                                        <h4 className="text-c-green">Số Lượng Subcrible</h4>
                                        <h6 className="text-muted m-b-0">Sub</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="card">
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-8">
                                        <h4 className="text-c-red">Số Lượng Message Gửi Lên</h4>
                                        <h6 className="text-muted m-b-0"> Message</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="card">
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-8">
                                        <h4 className="text-c-blue">Số Lượng Message Trả Về</h4>
                                        <h6 className="text-muted m-b-0"> Message</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div style={{ backgroundColor: 'white' }}>
            <CardList dataIots={dataIots}></CardList>
        </div>
    </>
};

export default Home;