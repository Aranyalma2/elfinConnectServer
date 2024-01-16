//IN-RAM Collections
const activeIoTDevices = require("./active-devices");
const activeConnections = require("./active-connection");
const logger = require("./logger");

//Persistance Collections
const database = require("./db.js");

function tunnelRawDataHandler(clientSocket, data) {
	//Parse string by expected
	const dataStr = data.toString();
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
			const deviceObject = activeIoTDevices.createActiveDevice(user, hostName, macAddress, deviceType, clientSocket);

			//Check user is exists in DB
			database.User.findOne({ uuid: user })
				.then((foundUser) => {
					if (!foundUser) {
						//User is not in the DB, message is dropped
						logger.warn(`User is not in the DB, message is dropped. | User: ${user}`);
						return;
					}
					//User is exists in DB
					//Add device to ram list and DB
					activeIoTDevices.addOrUpdateDevice(deviceObject);
					//SAVE DB ONLY IoT type devices
					if (deviceType == 0) {
						saveHearthbeatDB(deviceObject).then((savedDevice) => {
							//Try to connect device to user in DB
							if (savedDevice) {
								if (!foundUser.allDevices.includes(savedDevice._id)) {
									foundUser.allDevices.push(savedDevice._id);
									return foundUser.save().then(() => {
										logger.verbose(`User updated: ${foundUser.username}`);
									});
								}
							}
						});
					}
				})
				.catch((err) => {
					logger.error(err);
				});
		} else if (dataParts[0] === "data" && dataParts.length == 4) {
			activeIoTDevices.debug();
			//DATA SENT from elfin
			//Example: data;uuid:almafa;mac:%MAC;#PAYLOAD#
			logger.verbose(`Received data: ${dataStr}`);

			//Parse incoming data
			const uuid = dataParts[1];
			const macAddress = dataParts[2];
			const payload = Buffer.from(dataParts[3], "ascii");
			//Search for destination device
			const sourceDevice = activeIoTDevices.getDevice(activeIoTDevices.getKey(uuid, macAddress));
			const destinationDevice = activeConnections.getOtherHalf(activeIoTDevices.getKey(uuid, sourceDevice), sourceDevice);
			logger.debug(`Source device: ${sourceDevice.hostName}`);
			logger.debug(`Destination device: ${destinationDevice.hostName}`);
			logger.debug(`Payload ${payload}`);
			//Forward payload to destination device
			destinationDevice.clientSocket.write(payload);

		} else if (dataParts[0] === "conn" && dataParts.length == 4) {
			//TO CREATE a connection for user between 2 end-device
			//Exapmle conn;uuid:almafa;mac1:#MAC1#;mac2:#MAC2#
			logger.verbose(`Received connection request: ${dataStr}`);

			const user = dataParts[1];
			//HIBA
			const dev1MAC = dataParts[2];
			const dev2MAC = dataParts[3];
			activeConnections.addConnection(activeIoTDevices.getKey(user, dev1MAC), activeIoTDevices.getDevice(activeIoTDevices.getKey(user, dev1MAC)), activeIoTDevices.getDevice(activeIoTDevices.getKey(user, dev2MAC)));
		} else {
			logger.warn(`Invalid payload: ${dataStr}`);
		}
	} else {
		//TEST MODBUS READER
		//console.log(activeIoTDevices.getDevice("almafaa", "98D863CC68B1").clientSocket.write("ipsz"));//.clientSocket.write("upsz");
		logger.warn(`Invalid payload: ${dataStr}`);
	}
}

function saveHearthbeatDB(deviceObject) {
	return new Promise((resolve, reject) => {
		//Update device
		const deviceDB = {
			hostName: deviceObject.hostName,
			macAddress: deviceObject.macAddress,
			lastSeenDate: deviceObject.lastSeenDate,
		};
		database.Device.findOneAndUpdate({ macAddress: deviceObject.macAddress }, deviceDB, { upsert: true, new: true })
			.then((device) => {
				logger.debug(`Device updated or created: ${deviceObject.macAddress}`);
				return resolve(device);
			})
			.catch((err) => {
				logger.error(`Error updating or creating device in DB: ${err}`);
				return reject(err);
			});
	});
}

module.exports = tunnelRawDataHandler;
