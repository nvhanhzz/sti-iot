import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import AuthService from "./AuthService";
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
}
export async function httpRequest<T>(
    method: HttpMethod,
    url: string,
    options: RequestOptions = {}
): Promise<T> {
    const { headers = {}, params, data } = options;
    try {
        const config: AxiosRequestConfig = {
            method,
            url,
            headers,
            params,
            data,
        };
        const response: AxiosResponse<T> = await axios(config);
        return response as T;
    } catch (error: any) {
        if (error.status == 401) {
            AuthService.logout();
            window.location.reload()
        }
        throw error;
    }
}
