const net = require('net');
const tunnelDataHandler = require("./tunnelDataHandler");
const logger = require("./logger");
const bridge = require("./bridge/connection") 
const crypto = require('./crypto/crypto');
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
  let decryptedText;

    try{
      //console.log(data);
      decryptedText = crypto.decryptAESCBC(data.toString('base64'));
      //console.log(data.toString('ascii'));
      //console.log(Buffer.from(decryptedText, 'hex').toString('hex'));
      //console.log(Buffer.from(crypto.encryptAESCBC(decryptedText), 'hex'));
    } catch(error){
        logger.warn(`Message decryption error: ${error}`);
        logger.warn(`Message content: ${data.toString('hex')}`);
    }

    try{
      tunnelDataHandler(clientSocket, data.toString());
      console.log(Buffer.from(decryptedText, 'hex').toString());
      //tunnelDataHandler(clientSocket, Buffer.from(decryptedText, 'hex').toString());
    } catch(error){
        logger.warn(`Message process error: ${error}`);
        logger.warn(`Message content: ${decryptedText}`);
    }
}

// Create a TCP server that listens for incoming connections
const planeTcpServer = net.createServer((clientSocket) => {

  logger.info(`Device connected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  // Handle errors, remove socket from bridge if it is exists
  clientSocket.on('error', (error) => {
    onError(clientSocket);
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