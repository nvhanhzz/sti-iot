import React from 'react';
import logo from "../../assets/img/sti.png";
interface ChildProps {
    collapsed: boolean;
    toggleCollapsed: () => void;
}
const HeaderLayout: React.FC<ChildProps> = () => {
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
                                <a href="https://dientusti.com/" target="_blank">
                                    <p style={{ fontSize: '20px' }}>CÔNG TY ĐIỆN TỬ STI</p>
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