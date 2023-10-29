const logger = require("./logger");
//ActiveConnect collection

const activeConnection = {};

function addConnection(user, device1, device2) {
    //Check if user has a connection:
    if (user in activeConnection) {
        //close tcp?
    }

    const connection = {
        device1,
        device2,
    }

    activeConnection[user] = connection;
    logger.verbose(`Connection created: User: ${user} Devices: ${connection.device1.hostName} - ${connection.device2.hostName}`);
}

function getUserConnection(user) {
    return activeConnection[user];
}

function getOtherHalf(user, device) {
    const connection = activeConnection[user];

    //Check object existence
    if (connection === undefined || connection.device1 === undefined || connection.device2 === undefined) {
        logger.error(`Connection PANIK: Invalid connection. User: ${user} | Reason: Connection endpoints, or connection object is not created.`);
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