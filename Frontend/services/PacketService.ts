import ApiManager from '../api/ApiManager';
import { httpRequest } from '../services/HttpRequestService'
import { HttpResponse } from '../interface/HttpInterface';
import { getAuthToken } from '../cookie/AuthCookie';

class PacketService {
    async GetDataPacket(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataPacket(), {
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
    async GetDataColumnsPacket(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataDistinctPacket(), {
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
    async PostDataSettingsPacket(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiPostDataSettingsPacket(), {
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
    async LookPacket(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiLookPacket(), {
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

export default new PacketService();
