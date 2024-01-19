const logger = require("../logger");

let activeConnections = new Map();

// Function to add a socket pair for a user ID to the map
function setupSocketConnection(userID, socket1, socket2){
    const socketPair = {socket1, socket2}

    const existingPairs = getSocketPairs(userID);
    // Check if either socket1 or socket2 is already in the list
    if (existingPairs.some(pair => pair.socket1 === socketPair.socket1 || pair.socket2 === socketPair.socket2)) {
        throw new Error("One or both sockets already exist in the list for the given user ID.");
    }

    // Check if the user ID is already in the map
    if(activeConnections.has(userID)){
        activeConnections.get(userID).push(socketPair);
    }
    else{
        activeConnections.set(userID, [socketPair]);
    }
    //logger.verbose(`Connection established: User: ${userID}`)
}

// Function to get all socket pairs for a user ID from the map
function getSocketPairs(userId) {
  return activeConnections.get(userId) || [];
}

// Function to get the other half of socket pairs for a given user ID
function getEndpointSocket(userID, socket){
    const allPairs = getSocketPairs(userID);

  // Filter out the pair with the specified socket
  //const otherHalfPairs = allPairs.filter(pair => pair.socket1 !== socket && pair.socket2 !== socket);

    const pairWithSocket = allPairs.find(pair => pair.socket1 === socket || pair.socket2 === socket);

    // If a pair with the specified socket is found, return the other half
    if (pairWithSocket) {
        return [pairWithSocket.socket1 === socket ? pairWithSocket.socket2 : pairWithSocket.socket1];
    }

    return [];

  return otherHalfPairs;
}

// Function to delete a socket pair for a given user ID and socket
function deleteSocketConnection(userID, socket) {
    const pairs = getSocketPairs(userID);

    // Find the index of the pair that contains the specified socket
    const index = pairs.findIndex(pair => pair.socket1 === socket || pair.socket2 === socket);

    // If the pair with the specified socket is found, remove it from the array
    if (index !== -1) {
        pairs.splice(index, 1);
        // If there are no more pairs for the user, remove the user from the map
        if (pairs.length === 0) {
            activeConnections.delete(userID);
        }
    }
}

// Function to delete a socket pair for a given socket
function deleteSocketConnectionBySocket(socket){
    for (const [userID, pairs] of activeConnections) {
        deleteSocketConnection(userID, socket);
    }
}

module.exports = {setupSocketConnection, getSocketPairs, getEndpointSocket, deleteSocketConnection, deleteSocketConnectionBySocket};