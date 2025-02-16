# Monitoramento de Dispositivos com SNMP e ICMP

Este projeto realiza o monitoramento de dispositivos de rede utilizando SNMP (Simple Network Management Protocol) e ICMP (ping). O código é capaz de coletar dados SNMP de dispositivos, verificar a conectividade via ICMP (ping) e enviar esses dados para um serviço web.

## Funcionalidades

- **Leitura de dispositivos**: Carrega dispositivos a partir de um arquivo JSON local ou de uma API.
- **Monitoramento de SNMP**: Coleta dados SNMP de dispositivos com base nos OIDs fornecidos.
- **Monitoramento de ICMP**: Verifica a latência de dispositivos via ping.
- **Envio de dados**: Envia os dados coletados para um serviço web.
- **Atualização automática de dispositivos**: Atualiza periodicamente a lista de dispositivos a partir da API.

## Requisitos

- Node.js (versão 12 ou superior)
- Dependências do npm (veja abaixo)

## Funções Principais
- **loadDevicesFromFile: Carrega dispositivos a partir de um arquivo JSON local.
- **loadDevicesFromAPI: Carrega dispositivos a partir de uma API.
- **saveDevicesToFile: Salva a lista de dispositivos no arquivo local.
- **getSNMPData: Coleta dados SNMP de um dispositivo.
- **getICMPData: Realiza um ping (ICMP) para verificar a conectividade e latência de um dispositivo.
- **monitorDevice: Monitora um único dispositivo, coletando dados SNMP e ICMP.
- **monitorDevices: Monitora todos os dispositivos em uma lista, com controle de concorrência.
- **updateDevices: Atualiza os dispositivos a partir da API.
- **scheduleUpdates: Agenda a atualização periódica dos dispositivos.

Licença
Este projeto está licenciado sob a MIT License.
