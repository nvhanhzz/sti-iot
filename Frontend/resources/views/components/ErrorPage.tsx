import React, { useContext } from 'react';
import { Button, Result } from 'antd';
import AuthContext from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
interface ServerType {
    status: number,
    message: string;
}
interface ChildProps {
    ServerRes: ServerType;
}

const ErrorPage: React.FC<ChildProps> = ({ ServerRes }) => {
    const { t } = useTranslation();
    const authContext = useContext(AuthContext);
    if (!authContext) {
        throw new Error('AuthContext not found');
    }
    const handleLogout = () => {
        authContext.logout();
    };
    return (
        <Result
            status="403"
            title={ServerRes?.status}
            subTitle={ServerRes?.message}
            extra={<Button type="primary" onClick={() => handleLogout()}>{t('logout')}</Button>}
        />
    )
}



export default ErrorPage;