export interface MQTTClient {
    clientid: string;
    username: string;
    ip_address: string;
    mac_Address: string;
    firm_ware: string;
    status: Number;
    input: Number;
    output: Number;
    active: boolean;
}
const mqttClients: MQTTClient[] = [];

export const addClient = (clientObj: MQTTClient) => {
    removeClient((clientObj.clientid));
    mqttClients.push(clientObj);
    console.log(mqttClients);
};
export const removeClient = (clientid: string) => {
    const index = mqttClients.findIndex(client => client.clientid === clientid);
    if (index !== -1) {
        mqttClients.splice(index, 1);
    }
};
export const getClients = (): MQTTClient[] => mqttClients;
