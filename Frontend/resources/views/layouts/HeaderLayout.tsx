import React from 'react';
import logo from "../../assets/img/sti.png";
import { useTranslation } from 'react-i18next';
interface ChildProps {
    collapsed: boolean;
    toggleCollapsed: () => void;
}
const HeaderLayout: React.FC<ChildProps> = () => {
    const { t } = useTranslation();
    return (
        <>
            <header className="navbar pcoded-header navbar-expand-lg navbar-dark header-blue">
                <div className="m-header">
                    <a href="#" className="b-brand">
                        <img src={logo} className="logo" style={{ width: '50px' }} />
                    </a>
                </div>
                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav mr-auto">
                        <li className="nav-item">
                        </li>
                    </ul>
                    <ul className="navbar-nav ml-auto">
                        <li>
                            <div className="">
                                <a href="https://stivietnam.com/" target="_blank">
                                    <p style={{ fontSize: '20px' }}>{t('company')}</p>
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>
            </header>
        </>
    );
};

export default HeaderLayout;