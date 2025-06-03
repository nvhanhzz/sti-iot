import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken, clearAuthToken, getAuthToken, setAuthCookie, getAuthCookie, clearAuthCookie } from '../cookie/AuthCookie';
import { message } from 'antd';
import { UserItemsType } from '../interface/UserInterface'
const API_URL = import.meta.env.VITE_API_URL;
class AuthService {
    login(username: string, password: string) {
        console.log(username, password);
        if (username == 'admin' && password == "sti@1234") {
            localStorage.setItem('token', '%22eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc0MTE0MjE3NCwiZXhwIjoxNzQxMTc4MTc0fQ.jw2QH27HLGkimQT4EKgsHLSLQani3qHwyF6za8Rdcdw%22');
            localStorage.setItem('user', JSON.stringify({ 'userName': 'admin', 'password': 'sti@1234' }));
            localStorage.setItem('userName', 'admin');
            setAuthToken('%22eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc0MTE0MjE3NCwiZXhwIjoxNzQxMTc4MTc0fQ.jw2QH27HLGkimQT4EKgsHLSLQani3qHwyF6za8Rdcdw%22');
            setAuthCookie('user', JSON.stringify({ 'userName': 'admin', 'password': 'sti@1234' }));
            setAuthCookie('userName', 'admin');
            return {
                'status': 200
            };
        }
        else {
            return {
                'status': 500,
                'message': 'Đămg Nhập Thất Bại'
            };
        }
    }
    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        clearAuthToken();
        clearAuthCookie('user');
    }
    getUserLocal() {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    }
    getCurrentUser() {
        const userStr = getAuthCookie('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    }
    // Lấy token
    getToken() {
        return getAuthToken();
    }
    // Kiểm tra nếu người dùng đã đăng nhập
    isLoggedIn() {
        const token = this.getToken();
        return token !== null;
    }
    decodeToken(token: string) {
        return jwtDecode(token); // Sử dụng jwtDecode ở đây
    }
    updateDataInfo(value: UserItemsType) {
        message.loading('Đang Lưu Thông Tin');
        const apiClient = axios.create({
            headers: {
                "authorization": `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`
            },
        });
        localStorage.setItem('user', JSON.stringify(value));
        setAuthCookie('userName', value.name ? value.name : '');
        // console.log(value);
        return apiClient.post(API_URL + 'user/update-info', value)
            .then(function (response) {
                message.success('Hoàn Thành Lưu Thông Tin');
                return response;
            })
            .catch(function (error) {
                message.error(`Lưu Thất Bại : Lỗi Số ${error.status} (${error.message}) `);
                return error;
            });
    }
    getDataImg() {
        const apiClient = axios.create({
            headers: {
                "Content-type": "application/json",
                "authorization": `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`
            },
        });
        return apiClient.get(API_URL + 'user/get-data-img')
            .then(function (response) {
                return response;
            })
            .catch(function (error) {
                return error;
            });
    }
}

export default new AuthService();
