import ApiManager from '../api/ApiManager';
import { httpRequest } from '../services/HttpRequestService'
import { HttpResponse } from '../interface/HttpInterface';
import { getAuthToken } from '../cookie/AuthCookie';

class IotService {
    async GetDataIots(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataIots(), {
                headers: {
                    Authorization: `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`,
                },
                params: params,
            });
            return response;
        } catch (error) {
            console.error("Lỗi Phần Mềm:", error);
            throw error;
        }
    }
    async PostDataUpdateIots(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiUpdateDataIots(), {
                headers: {
                    Authorization: `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`,
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi Phần Mềm:", error);
            throw error;
        }
    }

    async GetDataColumnsIot(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataDistinctIot(), {
                headers: {
                    Authorization: `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`,
                },
                params: params,
            });
            return response;
        } catch (error) {
            console.error("Lỗi Phần Mềm:", error);
            throw error;
        }
    }

    async LockIot(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiLockIot(), {
                headers: {
                    Authorization: `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`,
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi Phần Mềm:", error);
            throw error;
        }
    }
    async PostDeviceSendData(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiDeviceSendData(), {
                headers: {
                    Authorization: `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`,
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi Phần Mềm:", error);
            throw error;
        }
    }

}

export default new IotService();
