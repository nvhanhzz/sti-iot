import React, { useState } from 'react';
import { Button, Drawer, Menu } from 'antd';
import { SettingOutlined, FontColorsOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
type MenuItem = Required<MenuProps>['items'][number];

const ButtonSetings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const items: MenuItem[] =
        [
            {
                key: 'Language',
                icon: <FontColorsOutlined />,
                label: 'Language',
                children: [
                    {
                        key: 'vi',
                        label: 'Tiếng Việt',
                    },
                    {
                        key: 'en',
                        label: 'English',
                    },
                ],
            },
        ];
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng); // Thay đổi ngôn ngữ
    };

    const onClick: MenuProps['onClick'] = (e) => {
        changeLanguage(e.key);
    };
    return (
        <>
            <Button type="primary" onClick={showDrawer} icon={<SettingOutlined />}>
            </Button>
            <Drawer title={t('navleft.setings_sofware')} width={520} closable={false} onClose={onClose} open={open}>
                <Menu onClick={onClick} mode="vertical" items={items} />
            </Drawer>
        </>
    );
};

export default ButtonSetings;