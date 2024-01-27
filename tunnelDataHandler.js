const endpoint = require("./endpoint/device");
const endpointDB = require("./endpoint/db");
const bridge = require("./bridge/connection");
const crypto = require('./crypto/crypto');

const logger = require("./logger");

//Persistance Collections
const database = require("./database/db.js");
const { getDevice } = require("./endpoint/device");

function tunnelRawDataHandler(clientSocket, dataStr) {
	//Parse string by expected
	//const dataStr = data.toString();
	const dataParts = dataStr.split(";");

	if (dataParts.length > 1) {
		if (dataParts[0] === "beat" && dataParts.length == 5) {
			//HEARTHBEAT from elfin devices
			//Example: beat;uuid:undifined;mac:%MAC;host:%HOST
			logger.verbose(`Received hearthbeat: ${dataStr}`);

			//Parse incoming data
			const user = dataParts[1];
			const macAddress = dataParts[2];
			const hostName = dataParts[3];
			const deviceType = dataParts[4];
			const deviceObject = endpoint.createActiveDevice(user, macAddress, clientSocket);

			endpoint.addOrUpdateDevice(deviceObject);
			endpointDB.connectToUser({ownerUuid:user, hostName:hostName, macAddress:macAddress, lastSeenDate: deviceObject.lastSeenDate, })


		} else if (dataParts[0] === "data" && dataParts.length >= 4) {
			//DATA SENT from elfin
			//Example: data;uuid:almafa;mac:%MAC;#PAYLOAD#
			logger.verbose(`Received data: ${dataStr}`);

			//Parse incoming data
			const user = dataParts[1];
			const dev1MAC = dataParts[2];
			let payload = Buffer.from(dataParts.slice(3).join(';'), "ascii").toString('ascii');
			//Search for destination device

			/*
			const sourceDevice = activeIoTDevices.getDevice(activeIoTDevices.getKey(uuid, macAddress));
			const destinationDevice = activeConnections.getOtherHalf(activeIoTDevices.getKey(uuid, sourceDevice), sourceDevice);
			logger.debug(`Source device: ${sourceDevice.hostName}`);
			logger.debug(`Destination device: ${destinationDevice.hostName}`);
			logger.debug(`Payload ${payload}`);
			//Forward payload to destination device
			destinationDevice.clientSocket.write(payload);
			*/

			const sourceDevice = endpoint.getDevice(endpoint.getKey(user, dev1MAC));
			const destinationDeviceSocket = bridge.getEndpointSocket(user, sourceDevice.clientSocket);
			
			//payload = "beat;965b963fa1b585df;98D863584D0E;EW11;0";
			console.log(payload);
			const encryptedMessage = crypto.encryptAESCBC(payload);
			
			destinationDeviceSocket.write(encryptedMessage);


		} else if (dataParts[0] === "connthem" && dataParts.length == 4) {
			//TO CREATE a connection for user between 2 end-device
			//Exapmle connthem;uuid:almafa;mac1:#MAC1#;mac2:#MAC2#
			logger.info(`Received connection 2 device request: ${dataStr}`);

			const user = dataParts[1];
			const dev1MAC = dataParts[2];
			const dev2MAC = dataParts[3];

			//activeConnections.addConnection(activeIoTDevices.getKey(user, dev1MAC), activeIoTDevices.getDevice(activeIoTDevices.getKey(user, dev1MAC)), activeIoTDevices.getDevice(activeIoTDevices.getKey(user, dev2MAC)));
			const device1 = endpoint.getDevice(endpoint.getKey(user, dev1MAC));
			const device2 = endpoint.getDevice(endpoint.getKey(user, dev2MAC));
			bridge.setupSocketConnection(user, device2.clientSocket, device1.clientSocket);

		} else if (dataParts[0] === "connme" && dataParts.length == 3){
			//TO CREATE a connection for user between incomming socket and an endpoint-device
			//Exapmle connme;uuid:almafa;mac:#MAC#
			logger.info(`Received connection socket-endpoint device request: ${dataStr}`);

			const user = dataParts[1];
			const devMAC = dataParts[2];	
			
			const device = endpoint.getDevice(endpoint.getKey(user, devMAC));
			bridge.setupSocketConnection(user, clientSocket, device.clientSocket);

		} else {
			logger.warn(`Invalid payload: ${dataStr}`);
		}
	} else {
		logger.warn(`Invalid payload: ${dataStr}`);
	}
}

module.exports = tunnelRawDataHandler;
