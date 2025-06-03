import React from 'react';
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { useTranslation } from 'react-i18next';

type MenuItem = Required<MenuProps>['items'][number];
const NavUrl: React.FC = () => {
    const { t } = useTranslation();
    const items: MenuItem[] = [
        {
            type: 'divider',
        },
        {
            key: 'dashboard',
            label: t('navleft.dashboard'),
            icon: <MailOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: 'production_tracking',
            label: t('navleft.production_tracking'),
            icon: <AppstoreOutlined />,
            children: [
                {
                    key: 'production_tracking.statistical',
                    label: t('navleft.statistical')
                },
                {
                    key: 'production_tracking.report',
                    label: t('navleft.report'),
                    children: [
                        {
                            key: 'production_tracking.report.Output',
                            label: t('navleft.output')
                        },
                        {
                            key: 'production_tracking.report.fabric_waste_generation',
                            label: t('navleft.fabric_waste_generation')
                        },
                        {
                            key: 'production_tracking.report.kensa',
                            label: t('navleft.kensa')
                        },
                    ],
                },
            ],
        },
        {
            type: 'divider',
        },
        {
            key: 'settings.factory',
            label: t('navleft.factory'),
            icon: <SettingOutlined />,
            children: [
                {
                    key: 'settings.factory.area',
                    label: <Link to="/settings/factory/area">{t('navleft.area')}</Link>
                },
                {
                    key: 'settings.factory.quota',
                    label: <Link to="/settings/factory/quota">{t('navleft.quota')}</Link>
                },
                {
                    key: 'settings.factory.kensa',
                    label: <Link to="/about">{t('navleft.kensa')}</Link>
                },
                {
                    key: 'settings.factory.tbyear',
                    label: <Link to="/about">{t('navleft.tbyear')}</Link>
                },
            ],
        },
    ];
    const onClick: MenuProps['onClick'] = (e) => {
        console.log('click ', e);
    };

    return (
        <Menu
            onClick={onClick}
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            mode="inline"
            items={items}
        />
    );
};

export default NavUrl;