import ApiManager from '../api/ApiManager';
import { httpRequest } from '../services/HttpRequestService'
import { HttpResponse } from '../interface/HttpInterface';
import { getAuthToken } from '../cookie/AuthCookie';

// Định nghĩa Interface cho cấu trúc JSON của MQTT (lấy từ component)
interface MqttConfig {
    SERVER?: string;
    PORT?: number;
    USER?: string;
    PW?: string;
    SUBTOPIC?: string;
    PUBTOPIC?: string;
    QoS?: number;
    keepAlive?: number;
}

// Định nghĩa Interface cho cấu trúc JSON của RS485 (lấy từ component)
interface Rs485IdAddress {
    ID: string;
    Address: string;
}

interface Rs485Config {
    baudrate?: number;
    serialConfig?: string;
    idAddresses?: Rs485IdAddress[]; // Mảng các cặp ID/Address
}

// Định nghĩa Interface cho cấu trúc JSON của TCP (lấy từ component)
interface TcpConnection {
    ip: string;
    address: string;
}

interface TcpConfig {
    ips?: TcpConnection[]; // Mảng các đối tượng TcpConnection
}

class IotService {
    // Helper để lấy token
    private getAuthHeader() {
        const token = getAuthToken();
        // Loại bỏ dấu nháy kép ở đầu và cuối nếu có (do cách lưu cookie)
        return token ? `Bearer ${token.replace(/^"|"$/g, '')}` : '';
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
            console.error("Lỗi Phần Mềm khi lấy dữ liệu IoT:", error); // Rõ ràng hơn
            throw error;
        }
    }

    async GetDataIotsV2(params: any) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("GET", ApiManager.ApiGetDataIotsV2(), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                params: params,
            });
            return response;
        } catch (error) {
            console.error("Lỗi Phần Mềm khi lấy dữ liệu IoT:", error); // Rõ ràng hơn
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
            console.error("Lỗi Phần Mềm khi cập nhật dữ liệu IoT tổng quát:", error); // Rõ ràng hơn
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
            console.error("Lỗi Phần Mềm khi lấy cột IoT:", error); // Rõ ràng hơn
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
            console.error("Lỗi Phần Mềm khi khóa IoT:", error); // Rõ ràng hơn
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
            console.error("Lỗi Phần Mềm khi gửi dữ liệu thiết bị:", error); // Rõ ràng hơn
            throw error;
        }
    }

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
            // debugger; // Dòng debugger này có thể xóa sau khi debug xong
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

    // Đã cập nhật kiểu dữ liệu cho 'data' để khớp với MqttConfig
    async updateIotMqttSettings(id: string, data: MqttConfig) {
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

    // Đã cập nhật kiểu dữ liệu cho 'data' để khớp với Rs485Config
    async updateIotRs485Settings(id: string, data: Rs485Config) {
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

    async updateIotCanSettings(id: string, data: { can_baudrate?: number; }) { // Đổi tên 'baudrate' thành 'can_baudrate' cho rõ ràng hơn nếu API nhận như vậy
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

    // NEW: Phương thức cập nhật cài đặt TCP
    async updateIotTcpSettings(id: string, data: TcpConfig) {
        try {
            const response = await httpRequest<{ response: HttpResponse }>("PUT", ApiManager.ApiUpdateIotTcpSettings(id), {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
                data: data,
            });
            return response;
        } catch (error) {
            console.error("Lỗi cập nhật Cài đặt TCP:", error);
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