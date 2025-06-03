import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AuthService from '../services/AuthService';
import { message } from 'antd';
import { clearAuthToken, clearAuthCookie } from '../cookie/AuthCookie';
// Định nghĩa kiểu cho context
interface AuthContextProps {
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}
// Tạo AuthContext
const AuthContext = createContext<AuthContextProps | null>(null);
// Provider để bao bọc toàn bộ ứng dụng
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Quản lý trạng thái người dùng (đã đăng nhập hay chưa)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!AuthService.getCurrentUser());
    const checkToken = () => {
        const token = AuthService.getToken();
        if (!token) {
            setIsAuthenticated(true);
            return;
        }
        try {
            const decoded: any = AuthService.decodeToken(token);
            const currentTime = Date.now() / 1000; // Thời gian hiện tại
            if (decoded.exp < currentTime) {
                // Token đã hết hạn
                setIsAuthenticated(true);
                clearAuthToken()
                clearAuthCookie('user');
                return;
            }
            setIsAuthenticated(true); // Token còn hiệu lực
        } catch (error) {
            console.error('Invalid token', error);
            setIsAuthenticated(true);
        }
    };
    // Hàm đăng nhập: Gọi AuthService để đăng nhập và cập nhật trạng thái xác thực
    const login = async (username: string, password: string) => {
        try {
            const response = await AuthService.login(username, password);
            if (response.status === 200) {
                setIsAuthenticated(true);
                message.success('Đăng nhập thành công!'); // Thông báo thành công
            }
            else {
                setIsAuthenticated(false);
                message.error(response.message || 'Đăng nhập thất bại.'); // Thông báo lỗi
            }
        } catch (error) {
            console.error('Login failed', error);
            message.error('Đăng nhập thất bại.'); // Thông báo lỗi chung
        }

        checkToken(); // Kiểm tra token khi component mount
    };
    // Hàm đăng xuất: Gọi AuthService để đăng xuất và cập nhật trạng thái xác thực
    const logout = () => {
        AuthService.logout();
        setIsAuthenticated(false);
        message.success('Đăng xuất thành công!'); // Thông báo đăng xuất thành công
    };

    useEffect(() => {
        console.log(isAuthenticated);
        checkToken();
    }, []);
    // Cung cấp các giá trị trạng thái và hành động cho các component con
    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
