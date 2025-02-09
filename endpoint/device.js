const logger = require("../logger");

let activeDevices = {};

function createActiveDevice(ownerUuid, hostName, macAddress, clientSocket) {
	const lastSeenDate = new Date();
	const device = {
		ownerUuid,
		hostName,
		macAddress,
		clientSocket,
		lastSeenDate,
		// Define the method to compare the device with another one
		equals: function (otherDevice) {
			return this.ownerUuid === otherDevice.ownerUuid && this.macAddress === otherDevice.macAddress;
		},
	};
	return device;
}

//Create key for collection
function getKey(ownerUuid, macAddress) {
	return `${ownerUuid}-${macAddress}`;
}

//Check device is in the list
function deviceExists(key) {
	return activeDevices[key] !== undefined;
}

// Function to add or update an active device
function addOrUpdateDevice(device) {
	const key = getKey(device.ownerUuid, device.macAddress);
	if (device.hostName === null && deviceExists(key)) {
		device.hostName = getDevice(key).hostName;
	} else if (device.hostName === null) {
		logger.debug(`Device hostname is null, (data before first heartbeat), fill it temporarly.| User: ${device.ownerUuid} | Device: ${device.macAddress}`);
		device.hostName = "Unknown";
	}
	activeDevices[key] = device;
}

// Function to get an device in active list by key
function getDevice(key) {
	const device = activeDevices[key];
	if (device === undefined) {
		throw new Error(`Device is not exists: User: ${key.split("-")[0]} | Device: ${key.split("-")[1]}`);
	}
	return device;
}

// Function to check if a device is online based on the lastSeenDate
function isOnline(key) {
	const device = getDevice(key);
	//Return true if lastSeenDate updated less then a minutes ago
	return device.lastSeenDate > new Date(Date.now() - 60000);
}

//Remove from active device by socket
function removeDeviceBySocket(socket) {
	const key = Object.keys(activeDevices).find((key) => activeDevices[key].clientSocket === socket);
	if (key) {
		delete activeDevices[key];
	}
}

//Active device mannger object
const activeDeviceMannger = {
	getKey,
	deviceExists,
	createActiveDevice,
	addOrUpdateDevice,
	getDevice,
	isOnline,
	removeDeviceBySocket,
};

module.exports = activeDeviceMannger;
