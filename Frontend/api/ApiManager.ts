const API_PORT = import.meta.env.VITE_API_PORT;
const API_PORT_MASTERDATA = import.meta.env.VITE_API_PORT_MASTERDATA;
const API_IP = import.meta.env.VITE_API_IP;
const API_URL = `${window.location.protocol}//${API_IP ? API_IP : window.location.hostname}:${API_PORT}`;
const API_URLMASTERDATA = `${window.location.protocol}//${API_IP ? API_IP : window.location.hostname}:${API_PORT_MASTERDATA}`;

const LOGIN_PORT = import.meta.env.VITE_PORT_LOGIN;
const LOGIN_URL = `${window.location.protocol}//${window.location.hostname}:${LOGIN_PORT}`;

class ApiManager {

    //API Đăng nhập
    loginUrl() {
        return `${LOGIN_URL}/login`;
    }
    ApiLogin() {
        return `${API_URL}/login`;
    }
    ApiGetRole() {
        return `${API_URL}/user/get-data-role`;
    }

    //API Tải File
    ApiDownloadFile() {
        return `${API_URLMASTERDATA}/download-file`;
    }

    //API Trang Chủ
    ApiGetDataHome() {
        return `${API_URLMASTERDATA}/home`;
    }
    ApiGetDataStock() {
        return `${API_URLMASTERDATA}/warehouse-system/report/data-stock-ten-product`;
    }
    ApiGetDataAll() {
        return `${API_URLMASTERDATA}/get-data-dash-board`;
    }

    //API Cài đặt khách hàng
    ApiGetDataPacket() {
        return `${API_URLMASTERDATA}/settings/packet/get-data-packets`;
    }
    ApiGetDataDistinctPacket() {
        return `${API_URLMASTERDATA}/settings/packet/get-distinct-packets`;
    }
    ApiPostDataSettingsPacket() {
        return `${API_URLMASTERDATA}/settings/packet/setting-packets`;
    }
    ApiLookPacket() {
        return `${API_URLMASTERDATA}/settings/packet/lock-packets`;
    }
    ApiImportDataPacket() {
        return `${API_URLMASTERDATA}/settings/packet/import-file`;
    }
    ApiExportDataPacket() {
        return `${API_URLMASTERDATA}/settings/packet/export-file`;
    }

    // API Cài đặt iot
    ApiGetDataIots() {
        return `${API_URLMASTERDATA}/api/iots/get-data-iots`;
    }
    ApiGetDataIotsV2() {
        return `${API_URLMASTERDATA}/api/v2/iots/get-data-iots`;
    }
    ApiUpdateDataIots() {
        return `${API_URLMASTERDATA}/api/iots/active-data-iots`;
    }
    ApiGetDataDistinctIot() {
        return `${API_URLMASTERDATA}/api/iots/get-distinct-iots`;
    }
    ApiLockIot() {
        return `${API_URLMASTERDATA}/api/iots/lock-iots`;
    }
    ApiDeviceSendData() {
        return `${API_URLMASTERDATA}/api/iots/device-send-data`;
    }

    ApiUpdateIotBasicInfo(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/basic-info`;
    }
    ApiUpdateIotWifiSettings(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/wifi-settings`;
    }
    ApiUpdateIotEthernetSettings(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/ethernet-settings`;
    }
    ApiUpdateIotMqttSettings(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/mqtt-settings`;
    }
    ApiUpdateIotRs485Settings(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/rs485-settings`;
    }
    ApiUpdateIotRs232Settings(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/rs232-settings`;
    }
    ApiUpdateIotCanSettings(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/can-settings`;
    }
    ApiUpdateIotTcpSettings(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/tcp-settings`;
    }
    ApiUpdateIotFirmwareVersion(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/firmware-version`;
    }
    ApiUpdateIotInputSettings(id: string) {
        return `${API_URLMASTERDATA}/api/iots/${id}/input-settings`;
    }

    // Api Cài đặt payload
    // ApiGetDataPayloadType() {
    //     return `${API_URLMASTERDATA}/api/iots/payload-type/get-data-payload-type`;
    // }
    // ApiUpdateDataPayloadType() {
    //     return `${API_URLMASTERDATA}/api/iots/payload-type/update-data-payload-type`;
    // }

    ApiGetDataPayloadType() {
        return `${API_URLMASTERDATA}/api/payload-type/get-data-payload-type`;
    }
    ApiUpdateDataPayloadType() {
        return `${API_URLMASTERDATA}/api/payload-type/setting-payload-type`;
    }
    ApiGetDataDistinctPayloadType() {
        return `${API_URLMASTERDATA}/api/payload-type/get-distinct-payload-type`;
    }
    ApiLockPayloadType() {
        return `${API_URLMASTERDATA}/api/payload-type/lock-payload-type`;
    }


    // Api Cài đặt Iot CMD
    ApiGetDataCMD() {
        return `${API_URLMASTERDATA}/api/iots/get-data-iot-command`;
    }
    ApiUpdateDataCMD() {
        return `${API_URLMASTERDATA}/api/iots/setting-iot-command`;
    }
    ApiGetDataDistinctIotCMD() {
        return `${API_URLMASTERDATA}/api/iots/get-distinct-iot-command`;
    }
    ApiLockIotCMD() {
        return `${API_URLMASTERDATA}/api/iots/lock-iot-command`;
    }
    ApiGetDataIotCMDField() {
        return `${API_URLMASTERDATA}/api/iots/get-data-iot-command-field`;
    }
    ApiPostDataSettingsIotCMDField() {
        return `${API_URLMASTERDATA}/api/iots/setting-iot-command-field`;
    }

}

export default new ApiManager();