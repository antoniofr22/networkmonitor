const snmp = require('snmp-native');
const ping = require('ping');
const axios = require('axios');
const async = require('async');
const fs = require('fs');
const path = require('path');

const concurrencyLimit = 50;
const timeout = 3000;
const maxRetries = 3;

const filePath = path.join(__dirname, 'devices.json');
const apiUrl = 'http://localhost/network/devices.json';
const updateInterval = 10 * 60 * 1000;

async function loadDevicesFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(`Erro ao carregar o arquivo JSON: ${err}`);
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (parseError) {
                    reject(`Erro ao parsear o arquivo JSON: ${parseError}`);
                }
            }
        });
    });
}

async function loadDevicesFromAPI() {
    try {
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        throw new Error(`Erro ao carregar dados da API: ${error.message}`);
    }
}

async function saveDevicesToFile(devices) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(devices, null, 2), 'utf8', (err) => {
            if (err) {
                reject(`Erro ao salvar os dados no arquivo: ${err}`);
            } else {
                resolve('Dados salvos com sucesso');
            }
        });
    });
}

async function getSNMPData(host, community, oids) {
    const session = new snmp.Session({host, community, timeout});
    return new Promise((resolve, reject) => {
        session.get(oids.map(oid => ({oid})), (error, varbinds) => {
            if (error) {
                reject(`Erro SNMP de ${host}: ${error}`);
            } else {
                const result = varbinds.reduce((acc, varbind) => {
                    acc[varbind.oid] = varbind.value;
                    return acc;
                }, {});
                resolve(result);
            }
            session.close();
        });
    });
}

async function getICMPData(host) {
    try {
        const res = await ping.promise.probe(host, {timeout});
        return res.alive ? {latency: res.time} : {latency: 'N/A'};
    } catch (error) {
        console.error(`Erro ao pingar ${host}: ${error}`);
        return {latency: 'N/A'};
    }
}

async function getSNMPDataWithRetries(host, community, oids, retries = maxRetries) {
    try {
        const snmpData = await getSNMPData(host, community, oids);
        return {host, snmpData};
    } catch (error) {
        if (retries > 0) {
            console.log(`Tentativa falhou para SNMP em ${host}. Tentando novamente... (Restantes: ${retries})`);
            return await getSNMPDataWithRetries(host, community, oids, retries - 1);
        }
        throw new Error(`Falha ao obter dados SNMP para ${host}: ${error.message}`);
}
}



async function sendDataToWebserviceBatch(batchData) {
    try {
        await axios.post('http://localhost/network/server.php', {data: batchData});
        console.log(`Dados enviados com sucesso`);
    } catch (error) {
        console.error(`Erro ao enviar dados:`, error);
    }
}

// Função para monitorar um dispositivo
async function monitorDevice(device) {
    try {
        const [snmpData, icmpData] = await Promise.all([
            device.snmpOids ? getSNMPDataWithRetries(device.ip, device.snmpCommunity, device.snmpOids) : Promise.resolve({host: device.ip, snmpData: {}}),
            getICMPData(device.ip)
        ]);

        const data = {
            host: device.ip,
            snmpData: snmpData.snmpData || {},
            icmpData: icmpData || {latency: 'N/A'},
            timestamp: new Date().toISOString(),
        };

        return data;
    } catch (error) {
        console.error(`Erro no monitoramento de ${device.ip}: ${error.message}`);
        return null;
    }
}

async function monitorDevices(devices) {
    const queue = async.queue(async (device) => await monitorDevice(device), concurrencyLimit);
    let allData = [];

    for (let device of devices) {
        const result = await queue.push(device);
        if (result)
            allData.push(result);
    }

    if (allData.length > 0) {
        await sendDataToWebserviceBatch(allData);
    }

    console.log('Monitoramento completo para todos os dispositivos.');
}

async function updateDevices() {
    try {
        console.log('Tentando atualizar os dados a partir da API...');
        const devicesFromAPI = await loadDevicesFromAPI();
        await saveDevicesToFile(devicesFromAPI);
        console.log('Dados atualizados com sucesso.');
    } catch (error) {
        console.error(`Falha ao atualizar dados da API: ${error.message}`);
    }
}

async function loadDevices() {
    try {
        const devicesFromAPI = await loadDevicesFromAPI();
        await saveDevicesToFile(devicesFromAPI); 
        console.log('Dados carregados e salvos pela primeira vez.');
        return devicesFromAPI;
    } catch (error) {
        console.error(`Falha ao carregar dados da API, utilizando dados locais: ${error.message}`);
        try {
            const devicesFromFile = await loadDevicesFromFile();
            console.log('Dados carregados do arquivo local.');
            return devicesFromFile;
        } catch (fileError) {
            console.error(`Falha ao carregar arquivo local: ${fileError.message}`);
            return [];
        }
    }
}

function scheduleUpdates() {
    setInterval(updateDevices, updateInterval); 
}

async function start() {
    const devices = await loadDevices();  
    console.log('Dispositivos inicializados:', devices);

    scheduleUpdates();

    setInterval(() => {
        console.log('Iniciando monitoramento...');
        monitorDevices(devices);
    }, 3000);
}

start();
