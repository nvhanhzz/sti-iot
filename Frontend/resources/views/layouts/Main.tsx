import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { RadioChangeEvent } from 'antd';
import { Card, Drawer, Radio } from 'antd';
import { useTranslation } from 'react-i18next';

// Import components (assuming correct paths)
import HeaderLayout from './HeaderLayout';
import NavLeftLayout from './NavLeftLayout';

// Import images (assuming correct paths)
import compactImg from "../../assets/img/compact.png";
import captiononImg from "../../assets/img/caption-on.png";

const Main: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [collapsed, setCollapsed] = useState(localStorage.getItem('collapsed') === 'true'); // Simpler boolean check
    const [open, setOpen] = useState(false);
    const [, setPageName] = useState(''); // This state might be better managed by context or routing metadata
    const [mode, setMode] = useState(localStorage.getItem('mode') || 'light'); // Default to 'light'

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
        localStorage.setItem('collapsed', String(!collapsed)); // Store boolean as string
    };

    const onClose = () => {
        setOpen(false);
    };

    const onChangeMode = (e: RadioChangeEvent) => {
        const newMode = e.target.value as string;
        setMode(newMode);
        localStorage.setItem('mode', newMode);
    };

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('lang', lng);
    };

    // This function can be passed to Outlet context if child components need to update pageName
    const changePageName = (page: string) => {
        setPageName(page);
    };

    const onChangeCollapsed = (e: RadioChangeEvent) => {
        const newCollapsed = e.target.value as boolean; // Value from Radio might be boolean if configured, or string
        setCollapsed(newCollapsed);
        localStorage.setItem('collapsed', String(newCollapsed));
    };

    return (
        // Wrapper for the entire layout
        <div className="admin-dashboard-layout">
            {/* Left Navigation (Sidebar) */}
            <NavLeftLayout collapsed={collapsed} mode={mode}></NavLeftLayout>

            {/* Main Content Area (Header + Content */}
            <div className={`main-content-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Header */}
                <HeaderLayout collapsed={collapsed} toggleCollapsed={toggleCollapsed}></HeaderLayout>

                {/* Page Content Area */}
                <div className={`pcoded-main-container ${mode}-mode`}>
                    <div className="pcoded-content">
                        <Outlet context={{ changePageName }} />
                    </div>
                </div>
            </div>

            {/* Settings Drawer */}
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
    );
};

export default Main;