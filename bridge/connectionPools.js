const logger = require("../logger");

let activePools = new Map();

function createPool(userID, device){
    const mac = device.macAddress;
    const socket = device.clientSocket;
    const pool = {
      id:mac,
      master_socket:socket,
      slave_sockets:[]
    };
    // Check if the user ID is already in the map
    if(activePools.has(userID)){
      activePools.get(userID).push(pool);
    }
    else{
      activePools.set(userID, [pool]);
    }
}

function addSlaveSockets(userID, poolID, socket){
  
}