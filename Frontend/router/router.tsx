import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Không cần import BrowserRouter ở đây nữa
import { AuthProvider } from '../context/AuthContext';
import Login from '../resources/views/auth/Login';
import PrivateRoute from '../resources/views/components/PrivateRoute';
import Main from '../resources/views/layouts/Main';
import AppControls from '../resources/views/apps/AppControls';
import AccountControls from '../resources/views/account/AccountControls';
import Infor from '../resources/views/account/Infor';
import SettingsPacket from '../resources/views/settings/SettingsPacket';
import Home from '../resources/views/home/Home';
import SettingsIot from '../resources/views/settings/SettingsIot';
import SettingsCMD from '../resources/views/settings/SettingsCMD';
import SettingsPayloadType from '../resources/views/settings/SettingsPayloadType';
import FirmwareList from "../resources/views/firmwareVersion";

const AppRouter: React.FC = () => {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<PrivateRoute />}>
                    <Route element={<Main />}>
                        <Route path="/home" element={<Home />} />
                        <Route path="/firmware-versions" element={<FirmwareList />} />
                        <Route path="/infor" element={<Infor />} />
                        <Route path="/apps" element={<AppControls />} />
                        <Route path="/accounts" element={<AccountControls />} />
                        <Route path="/settings-iot" element={<SettingsIot />} />
                        <Route path="/settings-cmd" element={<SettingsCMD />} />
                        <Route path="/settings-payload-type" element={<SettingsPayloadType />} />
                        <Route path="/settings-packet" element={<SettingsPacket />} />
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
        </AuthProvider>
    );
};

export default AppRouter;
