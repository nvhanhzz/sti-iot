import ApiManager from '../api/ApiManager';
import { httpRequest } from '../services/HttpRequestService'
import { HttpResponse } from '../interface/HttpInterface';
import { getAuthToken } from '../cookie/AuthCookie';

class PayloadTypeService {

    async GetDataPayloadType(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataPayloadType(), {
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

    async PostDataUpdatePayloadType(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiUpdateDataPayloadType(), {
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

    async GetDataColumnsPayloadType(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataDistinctPayloadType(), {
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

    async LockPayloadType(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiLockPayloadType(), {
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

export default new PayloadTypeService();
