import ApiManager from '../api/ApiManager';
import { httpRequest } from '../services/HttpRequestService'
import { HttpResponse } from '../interface/HttpInterface';
import { getAuthToken } from '../cookie/AuthCookie';

class CMDService {
    async GetDataCMD(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataCMD(), {
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

    async PostDataUpdateCMD(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiUpdateDataCMD(), {
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

    async GetDataColumnsIotCMD(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataDistinctIotCMD(), {
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

    async LockIotCMD(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiLockIotCMD(), {
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

    async GetDataIotCMDField(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataIotCMDField(), {
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

    async PostDataSettingsIotCMDField(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiPostDataSettingsIotCMDField(), {
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

export default new CMDService();
