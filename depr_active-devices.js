const logger = require("./logger");
/*ActiveIoTDevice collection
This Collection store all device, which is came online at least ones in this server runtime.
*/
const activeIoTDevices = {};

// Create a device object with t he provided attributes
function createActiveDevice(
    ownerUuid,
    hostName,
    macAddress,
    deviceType,
    clientSocket
) {
    const lastSeenDate = new Date("YYYY-MM-DDTHH:mm:ss");
    const device = {
        ownerUuid,
        hostName,
        macAddress,
        deviceType,
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

function checkDevice(key) {
    const device = activeIoTDevices[key];
    return device !== undefined;
}

// Function to add or update an active IoT device
function addOrUpdateDevice(device) {
    activeIoTDevices[getKey(device.ownerUuid, device.macAddress)] = device;
}

// Function to get an active IoT device by ownerUuid and macAddress
function getDevice(key) {
    const device = activeIoTDevices[key];
    if (device === undefined) {
        logger.warn(`Device is not exists in active client list | Key: ${key}`);
    }
    return device;
}

// Function to check if a device is online based on the lastSeenDate
function isOnline(key) {
    const device = activeIoTDevices[key];
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

function debug() {
    console.log(activeIoTDevices);
}

//Active device mannger object
const activeDeviceMannger = {
    getKey,
    checkDevice,
    createActiveDevice,
    addOrUpdateDevice,
    getDevice,
    isOnline,
    debug,
};

module.exports = activeDeviceMannger;
