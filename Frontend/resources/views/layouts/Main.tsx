import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { RadioChangeEvent } from 'antd';
import { NotificationOutlined, SettingOutlined, FullscreenOutlined } from '@ant-design/icons';
import { FloatButton, Card, Drawer, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import FooterLayout from './FooterLayout';
import HeaderLayout from './HeaderLayout';
import NavLeftLayout from './NavLeftLayout';
import compactImg from "../../assets/img/compact.png";
import captiononImg from "../../assets/img/caption-on.png";
const Main: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [collapsed, setCollapsed] = useState(localStorage.getItem('collapsed') == 'true' ? true : false);
    const [open, setOpen] = useState(false);
    const [pageName, setPageName] = useState('');
    const [mode, setMode] = useState(localStorage.getItem('mode') ? localStorage.getItem('mode') : 'light');
    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };
    const showDrawer = () => {
        setOpen(true);
    };
    const onClose = () => {
        setOpen(false);
    };
    const onChangeMode = (e: RadioChangeEvent) => {
        if (e.target.value == 'light') {
            setMode('light');
            localStorage.setItem('mode', 'light');
        }
        else {
            setMode('dark');
            localStorage.setItem('mode', 'dark');
        }
    };
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('lang', lng);
    };
    const changePageName = (page: string) => {
        setPageName(page);
    };
    const onChangeCollapsed = (e: RadioChangeEvent) => {
        if (e.target.value) {
            setCollapsed(true);
            localStorage.setItem('collapsed', 'true');
        }
        else {
            setCollapsed(false);
            localStorage.setItem('collapsed', 'false');
        }
    };
    return (
        <>
            <NavLeftLayout collapsed={collapsed} mode={mode ?? 'light'}></NavLeftLayout>
            <HeaderLayout collapsed={collapsed} toggleCollapsed={toggleCollapsed}></HeaderLayout>
            <div className={`pcoded-main-container ${mode}-mode`}>
                <div className="pcoded-content">
                    <div className="page-header">
                        <div className="page-block">
                            <div className="row align-items-center">
                                <div className="col-md-12">
                                    <div className="page-header-title">
                                        <h3 className="m-b-10">{pageName}</h3>
                                    </div>
                                    <ul className="breadcrumb">
                                        <li className="breadcrumb-item">
                                            <a href="index.html">
                                                <i className="feather icon-home" />
                                            </a>
                                        </li>
                                        <li className="breadcrumb-item">
                                            <a href="#!">{pageName}</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Outlet context={{ changePageName }} />
                    <FloatButton.Group
                        trigger="click"
                        type="primary"
                        style={{ insetBlockEnd: '10vh' }}
                        icon={<FullscreenOutlined />}
                    >
                        <FloatButton icon={<NotificationOutlined />} tooltip={<div>{t('notifications')}</div>} />
                        <FloatButton icon={<SettingOutlined />} tooltip={<div>{t('settings')}</div>} onClick={showDrawer} />
                    </FloatButton.Group>
                    <Drawer title={t('settings')} onClose={onClose} open={open} className={`${mode}-mode`}>
                        <div className='row' >
                            <Card title={t('mode')} className={`col-12 ${mode}-mode`}>
                                <Radio.Group onChange={onChangeMode} value={mode} className={`${mode}-mode`}>
                                    <Radio value={'light'}>{t('light')}</Radio>
                                    <Radio value={'dark'}>{t('dark')}</Radio>
                                </Radio.Group>
                            </Card>
                            <Card title={t('language')} className={`col-12 ${mode}-mode`}>
                                <Radio.Group defaultValue={i18n.language} buttonStyle="solid">
                                    <Radio.Button value="vi" onClick={() => changeLanguage('vi')}>Tiếng Việt</Radio.Button>
                                    <Radio.Button value="en" onClick={() => changeLanguage('en')}>English</Radio.Button>
                                    <Radio.Button value="jp" onClick={() => changeLanguage('jp')}>日本語</Radio.Button>
                                </Radio.Group>
                            </Card>
                            <Card title={t('menu')} className={`col-12 ${mode}-mode`}>
                                <Radio.Group onChange={onChangeCollapsed} value={collapsed} className={`${mode}-mode`}>
                                    <Radio value={false}>
                                        <img src={captiononImg} alt="caption-on" className="logo-settings" />
                                    </Radio>
                                    <Radio value={true}>
                                        <img src={compactImg} alt="compact" className="logo-settings" />
                                    </Radio>
                                </Radio.Group>
                            </Card>
                        </div>
                    </Drawer>
                </div>
            </div >
            <FooterLayout mode={mode ?? 'light'}></FooterLayout>
        </>
    );
};

export default Main;