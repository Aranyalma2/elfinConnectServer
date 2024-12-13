const endpoint = require("./endpoint/device");
const endpointDB = require("./endpoint/db");
const bridge = require("./bridge/connection");
const dataHB = require("./endpoint/dataHBHandler");

const logger = require("./logger");
const { cli } = require("winston/lib/winston/config");

function tunnelRawDataHandler(clientSocket, data) {
	//Parse string by expected
	const dataStr = data.toString("ascii");
	const dataParts = dataStr.split(";");

	if (dataParts.length > 1) {
		if (dataParts[0] === "beat" && dataParts.length == 5) {
			//HEARTHBEAT from elfin devices
			//Example: beat;uuid:undifined;mac:%MAC;host:%HOST
			logger.silly(`Received hearthbeat: ${dataStr}`);

			//Parse incoming data
			const user = dataParts[1];
			const macAddress = dataParts[2];
			const hostName = dataParts[3];
			const deviceType = dataParts[4];
			const deviceObject = endpoint.createActiveDevice(user, hostName, macAddress, clientSocket);
			//Add or update device in the activeDevices list
			endpoint.addOrUpdateDevice(deviceObject);
			//Save new last seen date to DB
			endpointDB.connectToUser(deviceObject);

		} else if (dataParts[0] === "data" && dataParts.length >= 4) {
			//DATA SENT from elfin
			//Example: data;uuid:almafa;mac:%MAC;#PAYLOAD#
			logger.silly(`Received data: ${dataStr}`);

			//Parse incoming data
			const user = dataParts[1];
			const dev1MAC = dataParts[2];
			const hostName = dataParts[3];
			const deviceType = dataParts[4]; //Its optional, if exists and zero, its a elfin device (Physical device)
			
			if (deviceType === "0") {
				const deviceObject = endpoint.createActiveDevice(user, hostName, dev1MAC, clientSocket);
				endpoint.addOrUpdateDevice(deviceObject);
				dataHB.timerHandler(endpoint.getKey(user, dev1MAC));
			}

			//Get the payload from the data
			const headerSize = dataParts[0].length + dataParts[1].length + dataParts[2].length + dataParts[3].length + dataParts[4].length + 5; //+5 is the length of the separators
			const payload = data.subarray(headerSize, data.length);

			//Search for destination device
			const destinationDeviceSocket = bridge.getEndpointSocket(user, clientSocket);
			//Send the payload to the destination device
			destinationDeviceSocket.write(payload);

		} else if (dataParts[0] === "connthem" && dataParts.length == 4) {
			//TO CREATE a connection for user between 2 end-device
			//Exapmle connthem;uuid:almafa;mac1:#MAC1#;mac2:#MAC2#
			logger.info(`Received connection 2 device request: ${dataStr}`);

			//----Its a legacy feature in specifiaction, but not used in the current version----
			/*
			const user = dataParts[1];
			const dev1MAC = dataParts[2];
			const dev2MAC = dataParts[3];

			try {
				const device1 = endpoint.getDevice(endpoint.getKey(user, dev1MAC));
				const device2 = endpoint.getDevice(endpoint.getKey(user, dev2MAC));
				bridge.setupSocketConnection(user, device2.clientSocket, device1.clientSocket);
				clientSocket.write('{"status":"success"}' + "\n");
			} catch (e) {
				logger.warn(e);
				clientSocket.write('{"status":"failed"}' + "\n");
			}
			*/
		} else if (dataParts[0] === "connme" && (dataParts.length == 3 || dataParts.length == 4)) {
			//TO CREATE a connection for user between incomming socket and an endpoint-device
			//Exapmle connme;uuid:almafa;mac:#MAC#
			logger.info(`Received connection socket-endpoint device request: ${dataStr}`);

			//Parse incoming data
			const user = dataParts[1];
			const devMAC = dataParts[2];
			const priority = dataParts[3] || 0; //Priority is optional by default 0 (Highest priority is 0, lowering by 1->) --Backward compatibility

			//Search for destination device, check status and create connection
			try {
				//Get the device from the activeDevices list
				const device = endpoint.getDevice(endpoint.getKey(user, devMAC));
				//Check if the device is online
				if (!endpoint.isOnline(endpoint.getKey(user, devMAC))) {
					throw new Error("Device is offline.");
				}
				//Create a connection between the incommed and device`s socket
				bridge.setupSocketConnection(user, clientSocket, device.clientSocket, priority);
				//Send success message to the client
				clientSocket.write('{"status":"success"}' + "\n");
			} catch (e) {
				logger.warn(e);
				//Send failed message to the client
				clientSocket.write(`{"status":"failed","reason":"${e.message}"}` + "\n");
			}
		} else if (dataParts[0] === "query" && dataParts.length == 2) {
			//Query user`s devices
			//query;userid
			logger.verbose(`User query: ${dataStr}`);

			const user = dataParts[1];
			getDevicesJson(user).then((json) => {
				json += "\n";
				clientSocket.write(Buffer.from(json, "utf8"));
			});
		} else {
			logger.warn(`Invalid payload: ${dataStr}`);
		}
	} else {
		//logger.warn(`Invalid payload: ${Buffer.from(dataStr, 'ascii').toString('hex')}`);
		logger.warn(`Invalid payload: ${dataStr}`);
	}
}

async function getDevicesJson(user) {
	try {
		const devices = await endpointDB.getDevices(user);
		const jsonArray = devices.map((dbDevice) => ({
			hostname: dbDevice.hostName,
			macaddress: dbDevice.macAddress,
			lastseendate: convertESTto24Time(dbDevice.lastSeenDate),
			status: calcOnline(dbDevice.lastSeenDate),
		}));
		return JSON.stringify(jsonArray);
	} catch (error) {
		console.error("Error fetching devices:", error);
		return JSON.stringify([]);
	}
}

function convertESTto24Time(estDateString) {
	// Create a formatter with the desired format and set the time zone to 'America/New_York'
	const formatter = new Intl.DateTimeFormat("hu-HU", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZone: "Europe/Budapest",
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
