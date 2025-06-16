import ApiManager from '../api/ApiManager';
import { httpRequest } from '../services/HttpRequestService'
import { HttpResponse } from '../interface/HttpInterface';
import { getAuthToken } from '../cookie/AuthCookie';

class IotService {
    // Helper để lấy token
    private getAuthHeader() {
        const token = getAuthToken();
        return token ? `Bearer ${token.slice(1, -1)}` : ''; // Remove leading/trailing quotes
    }

    async GetDataIots(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataIots(), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                params: params,
            });
            return response;
        } catch (error) {
            console.error("Lỗi Phần Mềm:", error);
            throw error;
        }
    }

    // Giữ lại PostDataUpdateIots nếu nó vẫn được sử dụng cho các mục đích khác
    // Hoặc xem xét loại bỏ nếu các API section-specific thay thế hoàn toàn nó
    async PostDataUpdateIots(data: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("POST", ApiManager.ApiUpdateDataIots(), {
                headers: {
                    Authorization: this.getAuthHeader(),
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
                    Authorization: this.getAuthHeader(),
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
                    Authorization: this.getAuthHeader(),
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
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi Phần Mềm:", error);
            throw error;
        }
    }

    // --- NEW API CALLS FOR SECTION-SPECIFIC UPDATES ---

    async updateIotBasicInfo(id: string, data: { name?: string; mac?: string }) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("PUT", ApiManager.ApiUpdateIotBasicInfo(id), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi cập nhật Thông tin cơ bản:", error);
            throw error;
        }
    }

    async updateIotWifiSettings(id: string, data: { SSID?: string; PW?: string; IP?: string; GATEWAY?: string; SUBNET?: string; DNS?: string; }) {
        try {
            debugger;
            const response = await httpRequest<{ response: HttpResponse }>("PUT", ApiManager.ApiUpdateIotWifiSettings(id), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi cập nhật Cài đặt WiFi:", error);
            throw error;
        }
    }

    async updateIotEthernetSettings(id: string, data: { IP?: string; GATEWAY?: string; SUBNET?: string; MAC?: string; DNS?: string; }) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("PUT", ApiManager.ApiUpdateIotEthernetSettings(id), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi cập nhật Cài đặt Ethernet:", error);
            throw error;
        }
    }

    async updateIotMqttSettings(id: string, data: { MAC?: string; IP?: string; GATEWAY?: string; SUBNET?: string; DNS?: string; }) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("PUT", ApiManager.ApiUpdateIotMqttSettings(id), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi cập nhật Cài đặt MQTT:", error);
            throw error;
        }
    }

    async updateIotRs485Settings(id: string, data: { rs485Addresses?: { ID?: number; Address?: string; }; rs485Config?: { baudrate?: number; serialConfig?: string; }; }) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("PUT", ApiManager.ApiUpdateIotRs485Settings(id), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi cập nhật Cài đặt RS485:", error);
            throw error;
        }
    }

    async updateIotRs232Settings(id: string, data: { baudrate?: number; serialConfig?: string; }) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("PUT", ApiManager.ApiUpdateIotRs232Settings(id), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi cập nhật Cài đặt RS232:", error);
            throw error;
        }
    }

    async updateIotCanSettings(id: string, data: { baudrate?: number; }) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("PUT", ApiManager.ApiUpdateIotCanSettings(id), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi cập nhật Cài đặt CAN:", error);
            throw error;
        }
    }

    async updateIotFirmwareVersion(id: string, data: { version?: string; }) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("PUT", ApiManager.ApiUpdateIotFirmwareVersion(id), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi cập nhật Phiên bản Firmware:", error);
            throw error;
        }
    }
}

export default new IotService();