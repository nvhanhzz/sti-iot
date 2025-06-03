import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getAuthCookie } from '../../../cookie/AuthCookie';
import AppList from '../components/AppList';
import user from "../../assets/img/user.png";
import AuthContext from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import logoutImg from "../../assets/img/check-out.png";
import iotImg from "../../assets/img/iot.png";
import commandImg from "../../assets/img/command.png";
import requestImg from "../../assets/img/request.png";
import houseImg from "../../assets/img/house.png"
import tranferImg from "../../assets/img/data-synchronization.png"
interface ChildProps {
    collapsed: boolean;
    mode: string;
}
interface itemsType {
    key: string;
    label: string;
    class?: string;
    target?: boolean;
    icon?: string;
    link?: string;
    children?: itemsType[];
}

const NavLeftLayout: React.FC<ChildProps> = ({ collapsed, mode }) => {
    const { t } = useTranslation();
    const [userLocal] = useState(getAuthCookie('userName'));
    const authContext = useContext(AuthContext);
    if (!authContext) {
        throw new Error('AuthContext not found');
    }
    const handleLogout = () => {
        authContext.logout();
    };
    const items: itemsType[] = [
        {
            key: 'home',
            label: 'navleft.dashboard',
            class: 'nav-item',
            target: false,
            icon: houseImg,
            link: '/home'
        },
        {
            key: 'settings.iot',
            label: t('navleft.device_iot'),
            class: 'nav-item',
            target: false,
            icon: iotImg,
            link: '/settings-iot'
        },
        {
            key: 'settings.cmd',
            label: t('navleft.device_cmd'),
            class: 'nav-item',
            target: false,
            icon: commandImg,
            link: '/settings-cmd'
        },
        {
            key: 'settings.payload_type',
            label: t('navleft.payload_type'),
            class: 'nav-item',
            target: false,
            icon: requestImg,
            link: '/settings-payload-type'
        },
    ];
    const [menuitems, setMenuitems] = useState(items);
    const [menutrigger, setMenutrigger] = useState(false);
    const toggleMenutrigger = (key: string): void => {
        const updatedMenu = menuitems.map((item) =>
            item.key === key
                ? { ...item, class: (item.children ? (item.target ? 'nav-item pcoded-hasmenu' : 'nav-item pcoded-hasmenu pcoded-trigger') : 'nav-item'), target: !item.target, }
                : item
        );
        setMenuitems(updatedMenu);

    };
    const toggleMenutriggerinfo = (): void => {
        setMenutrigger(!menutrigger);
    };
    return (
        <>
            <nav className={collapsed ? `pcoded-navbar menu-${mode} navbar-collapsed` : `pcoded-navbar menu-${mode}`}  >
                <div className="navbar-wrapper">
                    <div className="navbar-content scroll-div">
                        <div className="">
                            <div className="main-menu-header">
                                <img className="img-radius" src={user} alt="User-Profile-Image" />
                                <div className="user-details">
                                    <div id="more-details" onClick={() => toggleMenutriggerinfo()}>
                                        {userLocal} <i className="fa fa-caret-down" />
                                    </div>
                                </div>
                            </div>
                            <div className={`collapse ${mode}-mode`} id="nav-user-link" style={menutrigger ? { display: 'block', } : { display: 'none' }}>
                                <ul className="list-unstyled">
                                    <li className="list-group-item">
                                        <AppList mode={mode}></AppList>
                                    </li>
                                    <li className="list-group-item">
                                        <a onClick={() => handleLogout()}>
                                            <span className="pcoded-micon">
                                                <img src={logoutImg} alt="" className="logo-thumb"></img>
                                            </span>
                                            <span className="pcoded-mtext" style={{ marginLeft: '10px' }}>
                                                {t('logout')}
                                            </span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <ul className="nav pcoded-inner-navbar">
                            {menuitems.map((item) => {
                                if (item.children) {
                                    return <li key={item.key} className={item.class}>
                                        <a href="#" className="nav-link" onClick={() => toggleMenutrigger(item.key)}>
                                            <span className="pcoded-micon">
                                                <i className="feather icon-layout" />
                                            </span>
                                            <span className="pcoded-mtext">{t(item.label)}</span>
                                        </a>
                                        <ul className="pcoded-submenu" style={item.target ? { display: 'block', backgroundColor: "transparent" } : { display: 'none' }}>
                                            {item.children.map((itemChild) => {
                                                return <li key={itemChild.key}>
                                                    <Link to={{ pathname: itemChild.link }}> {t(itemChild.label)}</Link>
                                                </li>;
                                            })}
                                        </ul>
                                    </li>;
                                }
                                else {
                                    return <li key={item.key} className={item.class}>
                                        <Link to={{ pathname: item.link }}>
                                            <span className="pcoded-micon">
                                                <img src={item.icon} alt="" className="logo-thumb"></img>
                                            </span>
                                            <span className="pcoded-mtext">
                                                {t(item.label)}
                                            </span>
                                        </Link>
                                    </li>;
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