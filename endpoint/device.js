const logger = require("../logger");

let activeDevices = {};

function createActiveDevice(ownerUuid, macAddress, clientSocket){
    const lastSeenDate = new Date();
    const device = {
        ownerUuid,
        macAddress,
        clientSocket,
        lastSeenDate,
        // Define the method to compare the device with another one
        equals: function (otherDevice) {
            return (
                this.ownerUuid === otherDevice.ownerUuid &&
                this.macAddress === otherDevice.macAddress
            );
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
    activeDevices[getKey(device.ownerUuid, device.macAddress)] = device;
}

// Function to get an device in active list by key
function getDevice(key) {
    const device = activeDevices[key];
    if (device === undefined) {
        logger.warn(`Device is not exists in active client list | Key: ${key}`);
    }
    return device;
}

// Function to check if a device is online based on the lastSeenDate
function isOnline(key) {
    const device = activeDevices[key];
    //Check device is exists in activity list
    if (device === undefined) {
        logger.warn(
            `Device is not exists in active client list, inpossibly to be online | User: ${ownerUuid} | Device: ${macAddress}`
        );
        return false;
    }
    //Return true if lastSeenDate updated less then a minutes ago
    return device.lastSeenDate > new Date(Date.now() - 60000);
}

//Active device mannger object
const activeDeviceMannger = {
    getKey,
    deviceExists,
    createActiveDevice,
    addOrUpdateDevice,
    getDevice,
    isOnline
};

module.exports = activeDeviceMannger;