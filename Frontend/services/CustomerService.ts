import ApiManager from '../api/ApiManager';
import { httpRequest } from '../services/HttpRequestService'
import { HttpResponse } from '../interface/HttpInterface';
import { getAuthToken } from '../cookie/AuthCookie';
class CustomerService {
    async GetDataCustomer(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataCustomers(), {
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
    async GetDataColumnsCustomer(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataDistinctCustomers(), {
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
    async PostDataSettingsCustomer(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiPostDataSettingsCustomers(), {
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
    async LookCustomers(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiLookCustomers(), {
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

export default new CustomerService();
