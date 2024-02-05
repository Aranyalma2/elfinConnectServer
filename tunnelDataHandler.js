const endpoint = require("./endpoint/device");
const endpointDB = require("./endpoint/db");
const bridge = require("./bridge/connection");
const crypto = require('./crypto/crypto');

const logger = require("./logger");

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
			endpointDB.connectToUser({ownerUuid:user, hostName:hostName, macAddress:macAddress, lastSeenDate: deviceObject.lastSeenDate});


		} else if (dataParts[0] === "data" && dataParts.length >= 4) {
			//DATA SENT from elfin
			//Example: data;uuid:almafa;mac:%MAC;#PAYLOAD#
			logger.verbose(`Received data: ${dataStr}`);

			//Parse incoming data
			const user = dataParts[1];
			const dev1MAC = dataParts[2];
			let payload = Buffer.from(dataParts.slice(3).join(';'), "ascii").toString('ascii');
			
			//Search for destination device
			const destinationDeviceSocket = bridge.getEndpointSocket(user, clientSocket);
			
			//payload = "beat;965b963fa1b585df;98D863584D0E;EW11;0";
			const encryptedMessage = crypto.encryptAESCBC(payload);
			//console.log(destinationDeviceSocket);
			
			destinationDeviceSocket.write(encryptedMessage);


		} else if (dataParts[0] === "connthem" && dataParts.length == 4) {
			//TO CREATE a connection for user between 2 end-device
			//Exapmle connthem;uuid:almafa;mac1:#MAC1#;mac2:#MAC2#
			logger.info(`Received connection 2 device request: ${dataStr}`);

			const user = dataParts[1];
			const dev1MAC = dataParts[2];
			const dev2MAC = dataParts[3];

	
			try{
				const device1 = endpoint.getDevice(endpoint.getKey(user, dev1MAC));
				const device2 = endpoint.getDevice(endpoint.getKey(user, dev2MAC));
				bridge.setupSocketConnection(user, device2.clientSocket, device1.clientSocket);
				clientSocket.write('{"status:success"}'+'\n');
			}catch(e){
				logger.warn(e);
				clientSocket.write('{"status:failed"}'+'\n');
				
			}

		} else if (dataParts[0] === "connme" && dataParts.length == 3){
			//TO CREATE a connection for user between incomming socket and an endpoint-device
			//Exapmle connme;uuid:almafa;mac:#MAC#
			logger.info(`Received connection socket-endpoint device request: ${dataStr}`);

			const user = dataParts[1];
			const devMAC = dataParts[2];	
			
			try{
				const device = endpoint.getDevice(endpoint.getKey(user, devMAC));
				bridge.setupSocketConnection(user, clientSocket, device.clientSocket);
				clientSocket.write('{"status:success"}'+'\n');
			}catch(e){
				logger.warn(e);
				clientSocket.write('{"status:failed"}'+'\n');

			}
		} else if (dataParts[0] === "query" && dataParts.length == 2){
			//Query user`s devices
			//query;userid
			logger.info(`User query: ${dataStr}`);

			const user = dataParts[1];
			getDevicesJson(user).then(json =>{
				//json = "[{\"hostname\":\"host1\",\"macaddress\":\"mac1\",\"lastseendate\":\"2024-01-24T17:47:40.316Z\",\"status\":\"online\"},{\"hostname\":\"EW11\",\"macaddress\":\"98D863584D0E\",\"lastseendate\":\"2024-01-30T18:56:51.357Z\",\"status\":\"online\"},{\"hostname\":\"Eport-EE11\",\"macaddress\":\"E8FDF88BD87E\",\"lastseendate\":\"2024-02-02T00:48:43.512Z\",\"status\":\"online\"}]"
				json += '\n';
				clientSocket.write(Buffer.from(json, 'utf8'));
			});

		} else {
			logger.warn(`Invalid payload: ${dataStr}`);
		}
	} else {
		logger.warn(`Invalid payload: ${dataStr}`);
	}
}

async function getDevicesJson(user) {
  try {
    const devices = await endpointDB.getDevices(user);
    const jsonArray = devices.map(dbDevice => ({
      hostname: dbDevice.hostName,
      macaddress: dbDevice.macAddress,
      lastseendate: convertESTto24Time(dbDevice.lastSeenDate),
      status: calcOnline(dbDevice.lastSeenDate)
    }));
    return JSON.stringify(jsonArray);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return JSON.stringify([]);
  }
}

function convertESTto24Time(estDateString) {
  // Create a formatter with the desired format and set the time zone to 'America/New_York'
  const formatter = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Budapest'
  });

  // Parse the EST date string
  const estDate = new Date(estDateString);

  // Format the date in the 24-hour format
  const formattedESTString = formatter.format(estDate);

  return formattedESTString;
}

function calcOnline(date) {
	return date > new Date(Date.now() - 60000) ? "online" : "offline";
}

module.exports = tunnelRawDataHandler;
