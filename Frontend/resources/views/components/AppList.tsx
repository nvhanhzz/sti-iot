import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'antd';
import AppService from '../../../services/AppService';
import ErrorPage from './ErrorPage';
import appImg from "../../assets/img/app-store.png";
import { AppItemsType } from '../../../interface/AppInterface';
import { ServerStatus } from '../../../interface/ServerInterface'
import AppData from './AppData';
interface ChildProps {
    mode: string;
}
const AppList: React.FC<ChildProps> = ({ mode }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const showDrawer = () => {
        fetchData();
        setOpen(true);
    };
    const onClose = () => {
        setOpen(false);
    };
    const items: AppItemsType[] = [];
    const [menuitems, setMenuitems] = useState(items);
    const ServerStatusDefaut: ServerStatus = {
        status: 500,
        message: "error Server"
    };
    const [ServerRes, setServerRes] = useState(ServerStatusDefaut);
    const fetchData = async () => {
        const dataApps = await AppService.getDataApps();
        setServerRes(dataApps);
        if (dataApps.status == 200) {
            const itemsApps = dataApps.data.data ?? [];
            setMenuitems(itemsApps);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    return (
        <>
            <a href="#" onClick={showDrawer}>
                <span className="pcoded-micon">
                    <img src={appImg} alt="" className="logo-thumb"></img>
                </span>
                <span className="pcoded-mtext" style={{ marginLeft: '10px' }}>
                    {t('navleft.apps')}
                </span>
            </a>
            <Drawer
                title={t('navleft.apps')}
                placement="left"
                closable={false}
                onClose={onClose}
                open={open}
                key="left"
                width={640}
                className={`${mode}-mode`}
            >
                {
                    ServerRes?.status == 200 ?
                        <AppData AppItemArray={menuitems} span={10}></AppData>
                        :
                        <ErrorPage ServerRes={ServerRes}></ErrorPage>
                }
            </Drawer>
        </>
    )
}



export default AppList;