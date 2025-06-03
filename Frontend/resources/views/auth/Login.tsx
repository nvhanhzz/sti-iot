import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import '../../assets/css/login.css';
import logo from "../../assets/img/logo-new.png";
import DropdownLanguage from '../components/DropdownLanguage';
const Login: React.FC = () => {
    const { t } = useTranslation();
    const [UserName, setUserName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [ErrorMsg] = useState<string>('');
    const authContext = useContext(AuthContext);
    if (!authContext) {
        throw new Error('AuthContext not found');
    }
    const { isAuthenticated } = authContext;
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (authContext) {
            try {
                await authContext.login(UserName, password);

            } catch (error) {
                console.log('Login failed:');
                console.log(error);
            }
        }
    };
    useEffect(() => {
        console.log(isAuthenticated);
        if (isAuthenticated) {
            navigate('/infor');
        }
    }, [isAuthenticated, navigate]);
    return (
        <div className="flex-center position-ref full-height container-login100">
            <div className="container">
                <div className="card-login">
                    <div className="card-body-login">
                        <div className="row content_body" style={{ backgroundColor: "white" }}>
                            <div className="col-7" style={{ backgroundImage: 'url(' + logo + ')', backgroundRepeat: 'no-repeat', backgroundSize: '80%', backgroundPosition: 'center' }}></div>
                            <div className="col-5">
                                <div className="top-right links row">
                                    <div className="col-11 row">
                                    </div>
                                    <div className="col-1 row">
                                        <DropdownLanguage></DropdownLanguage>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "white" }}>
                                    <div className="title_form">
                                        <p className="control title2">{t('login.login')}</p>
                                        <p>STI-IOT-GATEWAY</p>
                                        <p>{t('login.Welcome_back_Log_in_to_start_work')}</p>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "white" }}>
                                    <div>
                                        {ErrorMsg}
                                    </div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-input">
                                            <div className="col-12 form-group">
                                                <label>{t('login.username')}</label>
                                                <input
                                                    type="text"
                                                    className="form-control main-form"
                                                    value={UserName}
                                                    onChange={(e) => setUserName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-12 form-group pass">
                                                <label>{t('login.password')}</label>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    className="form-control main-form"
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-12 btn-div">
                                                <button type="submit" className="btn btn-primary">
                                                    {t('login.login')}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div style={{ backgroundColor: "white" }}>
                                    <div className="title_form" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
