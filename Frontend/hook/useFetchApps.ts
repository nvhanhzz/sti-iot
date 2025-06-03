import { useState, useEffect } from 'react';
import AppService from '../services/AppService';
import { ServerStatus } from '../interface/ServerInterface';

export const useFetchApps = () => {
    const ServerStatusDefault: ServerStatus = {
        status: 500,
        message: "error Server",
    };
    const [serverRes, setServerRes] = useState(ServerStatusDefault);
    const [menuItems, setMenuItems] = useState([]);

    const fetchData = async () => {
        const dataApps = await AppService.getDataApps();
        setServerRes(dataApps);
        if (dataApps.status === 200) {
            const itemsApps = dataApps.data.data ?? [];
            setMenuItems(itemsApps);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    return { serverRes, menuItems, setMenuItems };
};
