import axios from 'axios';
import { getAuthToken } from '../cookie/AuthCookie';
import { AppItemsType } from '../interface/AppInterface';
import { message } from 'antd';
const API_URL = import.meta.env.VITE_API_URL;
class AppService {
    getDataApps() {
        const apiClient = axios.create({
            headers: {
                "Content-type": "application/json",
                "authorization": `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`
            },
        });
        return apiClient.get(API_URL + 'get-data-apps')
            .then(function (response) {
                return response;
            })
            .catch(function (error) {
                return error;
            });
    }
    updateDataApps(dataApps: AppItemsType) {
        message.loading('Đang Lưu Thông Tin');
        const apiClient = axios.create({
            headers: {
                "Content-type": "application/json",
                "authorization": `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`
            },
        });
        return apiClient.post(API_URL + 'update-data-apps', dataApps)
            .then(function (response) {
                message.success('Hoàn Thành Lưu Thông Tin');
                return response;
            })
            .catch(function (error) {
                message.error(`Lưu Thất Bại : Lỗi Số ${error.status} (${error.message}) `);
                return error;
            });
    }
}

export default new AppService();
