const net = require('net');
const tunnelDataHandler = require("./tunnelDataHandler");
const logger = require("./logger");
const bridge = require("./bridge/connection") 

//Persistance Collections
const database = require("./database/db.js");

const serverPort = 3001;

database.connectToDatabase();

function onError(clientSocket, error){
    logger.warn(`Client socket error: ${error}`);
    logger.warn(`${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
    try{
      bridge.deleteSocketConnectionBySocket(clientSocket);
    } catch(error){
      logger.warn(error);
    }
}

function onEnd(clientSocket){
    logger.verbose('Client socket closed.');
    logger.verbose(`${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
    try{
      bridge.deleteSocketConnectionBySocket(clientSocket);
    } catch(error){
      logger.warn(error);
    }
}

function onData(clientSocket, data){
      try{

        tunnelDataHandler(clientSocket, data.toString());
  
      } catch(error){

        logger.warn(`Message process error: ${error}`);

    }
}

// Create a TCP server that listens for incoming connections
const planeTcpServer = net.createServer((clientSocket) => {

  logger.info(`Device connected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  // Handle errors, remove socket from bridge if it is exists
  clientSocket.on('error', (error) => {
    onError(clientSocket, error);
  });

  // Handle the connection end event, remove socket from bridge if it is exists
  clientSocket.on('end', () => {
    onEnd(clientSocket);
  });

  // When data is received from a client, decrypt and pass to processing
  clientSocket.on('data', (data) => {
    onData(clientSocket, data);
  });
});


planeTcpServer.listen(serverPort, () => {
  logger.info(`ELFIN IoT TCP proxy server is listening on port ${serverPort}`);
});