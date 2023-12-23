const logger = require("./logger");
//ActiveConnect collection

const activeConnection = {};

function addConnection(connectionID, device1, device2) {

    if(device1 == undefined){
        logger.warn(`Unable to create connection: Device1 is missing.`);
        return;
    }
    if(device2 == undefined){
        logger.warn(`Unable to create connection: Device2 is missing.`);
        return;
    }

    const connection = {
        device1,
        device2,
    }

    activeConnection[connectionID] = connection;
    logger.verbose(`Connection created: User: ${connectionID} Devices: ${connection.device1.hostName} - ${connection.device2.hostName}`);
}

function getUserConnection(connectionID) {
    return activeConnection[connectionID];
}

function getOtherHalf(connectionID, device) {
    const connection = activeConnection[connectionID];

    //Check object existence
    if (connection === undefined || connection.device1 === undefined || connection.device2 === undefined) {
        logger.error(`Connection PANIK: Invalid connection. User: ${connectionID} | Reason: Connection endpoints, or connection object is not created.`);
        return device;
    }

    if (device.equals(connection.device1)) {
        return connection.device2;
    }
    else if (device.equals(connection.device2)) {
        return connection.device1;
    }
    else {
        logger.error("Connection PANIK: Invalid connection. User: ${user} | ${connection.device1.hostName} + ${connection.device2.hostName} | Reason: Connection has no valid endpoints");
        return device; //Connection has no valid endpoints
    }
}

module.exports = { addConnection, getUserConnection, getOtherHalf };