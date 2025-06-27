const BASE_URL_FOR_APIS: string = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}`;

class ApiManager {
    public loginUrl(): string {
        return `${BASE_URL_FOR_APIS}/auth/login`;
    }
    public ApiLogin(): string {
        return `${BASE_URL_FOR_APIS}/api/login`;
    }
    public ApiGetRole(): string {
        return `${BASE_URL_FOR_APIS}/api/user/get-data-role`;
    }

    public ApiDownloadFile(): string {
        return `${BASE_URL_FOR_APIS}/download-file`;
    }

    public ApiGetDataHome(): string {
        return `${BASE_URL_FOR_APIS}/home`;
    }
    public ApiGetDataStock(): string {
        return `${BASE_URL_FOR_APIS}/warehouse-system/report/data-stock-ten-product`;
    }
    public ApiGetDataAll(): string {
        return `${BASE_URL_FOR_APIS}/get-data-dash-board`;
    }

    public ApiGetDataPacket(): string {
        return `${BASE_URL_FOR_APIS}/settings/packet/get-data-packets`;
    }
    public ApiGetDataDistinctPacket(): string {
        return `${BASE_URL_FOR_APIS}/settings/packet/get-distinct-packets`;
    }
    public ApiPostDataSettingsPacket(): string {
        return `${BASE_URL_FOR_APIS}/settings/packet/setting-packets`;
    }
    public ApiLookPacket(): string {
        return `${BASE_URL_FOR_APIS}/settings/packet/lock-packets`;
    }
    public ApiImportDataPacket(): string {
        return `${BASE_URL_FOR_APIS}/settings/packet/import-file`;
    }
    public ApiExportDataPacket(): string {
        return `${BASE_URL_FOR_APIS}/settings/packet/export-file`;
    }

    public ApiGetDataIots(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/get-data-iots`;
    }
    public ApiGetDataIotsV2(): string {
        return `${BASE_URL_FOR_APIS}/api/v2/iots/get-data-iots`;
    }
    public ApiUpdateDataIots(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/active-data-iots`;
    }
    public ApiGetDataDistinctIot(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/get-distinct-iots`;
    }
    public ApiLockIot(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/lock-iots`;
    }
    public ApiDeviceSendData(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/device-send-data`;
    }

    public ApiUpdateIotBasicInfo(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/basic-info`;
    }
    public ApiUpdateIotWifiSettings(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/wifi-settings`;
    }
    public ApiUpdateIotEthernetSettings(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/ethernet-settings`;
    }
    public ApiUpdateIotMqttSettings(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/mqtt-settings`;
    }
    public ApiUpdateIotRs485Settings(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/rs485-settings`;
    }
    public ApiUpdateIotRs232Settings(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/rs232-settings`;
    }
    public ApiUpdateIotCanSettings(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/can-settings`;
    }
    public ApiUpdateIotTcpSettings(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/tcp-settings`;
    }
    public ApiUpdateIotFirmwareVersion(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/firmware-version`;
    }
    public ApiUpdateIotInputSettings(id: string): string {
        return `${BASE_URL_FOR_APIS}/api/iots/${id}/input-settings`;
    }

    public ApiGetDataPayloadType(): string {
        return `${BASE_URL_FOR_APIS}/api/payload-type/get-data-payload-type`;
    }
    public ApiUpdateDataPayloadType(): string {
        return `${BASE_URL_FOR_APIS}/api/payload-type/setting-payload-type`;
    }
    public ApiGetDataDistinctPayloadType(): string {
        return `${BASE_URL_FOR_APIS}/api/payload-type/get-distinct-payload-type`;
    }
    public ApiLockPayloadType(): string {
        return `${BASE_URL_FOR_APIS}/api/payload-type/lock-payload-type`;
    }

    public ApiGetDataCMD(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/get-data-iot-command`;
    }
    public ApiUpdateDataCMD(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/setting-iot-command`;
    }
    public ApiGetDataDistinctIotCMD(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/get-distinct-iot-command`;
    }
    public ApiLockIotCMD(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/lock-iot-command`;
    }
    public ApiGetDataIotCMDField(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/get-data-iot-command-field`;
    }
    public ApiPostDataSettingsIotCMDField(): string {
        return `${BASE_URL_FOR_APIS}/api/iots/setting-iot-command-field`;
    }
}

export default new ApiManager();