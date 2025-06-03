// src/pages/Main.tsx

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../../../context/AuthContext';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';

type MenuItem = Required<MenuProps>['items'][number];

const Main: React.FC = () => {
    const { t } = useTranslation();
    const authContext = useContext(AuthContext);
    if (!authContext) {
        throw new Error('AuthContext not found');
    }
    const handleLogout = () => {
        authContext.logout(); // Gọi hàm logout từ AuthContext
    };
    const items: MenuItem[] =
        [
            {
                key: 'user-detail',
                icon: <UserOutlined />,
                label: 'Admin',
                children: [
                    {
                        key: 'setting-account',
                        label: <Link to="/about">{t('navleft.settings')}</Link>,
                    },
                    {
                        key: 'apps',
                        label: <Link to="/about">{t('navleft.apps')}</Link>,
                    },
                    {
                        key: 'logout',
                        icon: <LogoutOutlined />,
                        label: t('navleft.logout'),
                    },
                ],
            },
        ];
    const onClick: MenuProps['onClick'] = (e) => {
        if (e.key == 'logout') {
            handleLogout();
        }
    };
    return (
        <div>
            <Menu onClick={onClick} mode="vertical" items={items} />
        </div>
    );
};

export default Main;
