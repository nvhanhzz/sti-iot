import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';
const API_URL_LOGIN = import.meta.env.VITE_URL_LOGIN;
const PrivateRoute: React.FC = () => {
    const authContext = useContext(AuthContext);
    // if (!authContext || !authContext.isAuthenticated) {
    //     window.location.href = API_URL_LOGIN;
    //     return null;
    // }
    return <Outlet />;
};

export default PrivateRoute;
