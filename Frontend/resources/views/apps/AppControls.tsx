import React, { useState, useEffect } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { FileAddOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useFetchApps } from '../../../hook/useFetchApps';
import TableSettingApps from '../components/TableSettingApps';
import ErrorPage from '../components/ErrorPage';
import AppData from '../components/AppData';
type ContextType = {
    changePageName: (page: string) => void;
};
const AppControls: React.FC = () => {
    const { t } = useTranslation();
    const { changePageName } = useOutletContext<ContextType>();
    const { serverRes, menuItems, setMenuItems } = useFetchApps();
    const [isModalVisible, setIsModalVisible] = useState(false);
    useEffect(() => {
        changePageName(t('navleft.apps'));
    }, [changePageName]);
    return (
        <>
            <div className="card">
                <div className="card-header">
                    <Button
                        type="primary"
                        size={'large'}
                        icon={<FileAddOutlined />}
                        onClick={() => setIsModalVisible(true)}
                    >
                        {t('apps.settings')}
                    </Button>
                </div>
                <div className="card-body">
                    {serverRes?.status === 200 ? (
                        <AppData AppItemArray={menuItems} span={6} />
                    ) : (
                        <ErrorPage ServerRes={serverRes} />
                    )}
                </div>
            </div>
            <Modal
                title={t('apps.settings')}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                width={1500}
                footer={[
                    <Button key="cancel" onClick={() => setIsModalVisible(false)}>{t('cancel')}</Button>,
                    <Button key="ok" type="primary">{t('ok')}</Button>,
                ]}
            >
                <TableSettingApps
                    dataApps={menuItems}
                    updateMenu={setMenuItems}
                />
            </Modal>
        </>
    );
};

export default AppControls;
