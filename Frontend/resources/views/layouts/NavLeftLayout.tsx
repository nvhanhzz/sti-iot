import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { BsHouseDoor } from 'react-icons/bs';
import { BsDeviceHddFill } from "react-icons/bs";

interface ChildProps {
    collapsed: boolean;
    mode: string;
}

interface itemsType {
    key: string;
    label: string;
    class?: string; // Class này có thể không cần thiết nếu dùng inline style cho active state
    target?: boolean;
    icon?: React.ReactNode;
    link?: string;
    children?: itemsType[];
}

const NavLeftLayout: React.FC<ChildProps> = ({ collapsed, mode }) => {
    const { t } = useTranslation();
    const authContext = useContext(AuthContext);
    const location = useLocation();

    if (!authContext) {
        throw new Error('AuthContext not found');
    }

    const items: itemsType[] = [
        {
            key: 'home',
            label: 'navleft.dashboard',
            class: 'nav-item',
            target: false,
            icon: <BsHouseDoor size={20} />,
            link: '/home'
        },
        {
            key: 'settings.iot',
            label: t('navleft.device_iot'),
            class: 'nav-item',
            target: false,
            icon: <BsDeviceHddFill size={20} />,
            link: '/settings-iot'
        },
        // ... (các item khác)
    ];

    const [menuitems, setMenuitems] = useState(items);

    const toggleMenutrigger = (key: string): void => {
        const updatedMenu = menuitems.map((item) =>
            item.key === key
                ? { ...item, class: (item.children ? (item.target ? 'nav-item pcoded-hasmenu' : 'nav-item pcoded-hasmenu pcoded-trigger') : 'nav-item'), target: !item.target, }
                : item
        );
        setMenuitems(updatedMenu);
    };

    // Định nghĩa inline style cho trạng thái active
    const activeLinkStyle = {
        backgroundColor: '#e0f2f7', // Màu nền nhẹ
        color: '#007bff',           // Màu chữ xanh
        fontWeight: 'bold',         // Chữ đậm
    };

    // Style cho icon khi active (nếu icon là SVG hoặc cần thay đổi màu)
    const activeIconStyle = {
        color: '#007bff'
    };

    return (
        <>
            <nav className={collapsed ? `pcoded-navbar menu-${mode} navbar-collapsed` : `pcoded-navbar menu-${mode}`}  >
                <div className="navbar-wrapper">
                    <div className="navbar-content scroll-div">
                        <ul className="nav pcoded-inner-navbar">
                            {menuitems.map((item) => {
                                const isActive = location.pathname === item.link;

                                // Kết hợp class hiện có và style inline
                                const listItemInlineStyle = isActive ? activeLinkStyle : {};

                                if (item.children) {
                                    return (
                                        <li key={item.key} className={item.class || ''} style={listItemInlineStyle}> {/* Apply inline style here */}
                                            <a href="#" className="nav-link" onClick={() => toggleMenutrigger(item.key)}>
                                                <span className="pcoded-micon">
                                                    <i className="feather icon-layout" style={isActive ? activeIconStyle : {}}/> {/* Apply inline style to icon if needed */}
                                                </span>
                                                <span className="pcoded-mtext">{t(item.label)}</span>
                                            </a>
                                            <ul className="pcoded-submenu" style={item.target ? { display: 'block', backgroundColor: "transparent" } : { display: 'none' }}>
                                                {item.children.map((itemChild) => {
                                                    const isChildActive = location.pathname === itemChild.link;
                                                    const childListItemInlineStyle = isChildActive ? activeLinkStyle : {};
                                                    return (
                                                        <li key={itemChild.key} style={childListItemInlineStyle}> {/* Apply inline style to child */}
                                                            <Link to={{ pathname: itemChild.link }}>
                                                                {t(itemChild.label)}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </li>
                                    );
                                } else {
                                    return (
                                        <li key={item.key} className={item.class || ''} style={listItemInlineStyle}> {/* Apply inline style here */}
                                            <Link to={{ pathname: item.link }}>
                                                <span className="pcoded-micon">
                                                    {React.cloneElement(item.icon as React.ReactElement, {
                                                        style: isActive ? activeIconStyle : {}
                                                    })}
                                                </span>
                                                <span className="pcoded-mtext">
                                                    {t(item.label)}
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                }
                            })}
                        </ul>
                    </div>
                </div>
            </nav >
        </>
    );
};

export default NavLeftLayout;