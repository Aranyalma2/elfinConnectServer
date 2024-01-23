const net = require('net');
const tunnelDataHandler = require("./tunnelDataHandler");
const logger = require("./logger");
const bridge = require("./bridge/connection") 
const crypto = require('./crypto/crypto');

const serverPort = 8080;

// Create a TCP server that listens for incoming connections
const server = net.createServer((clientSocket) => {

  logger.verbose(`Device connected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  // Handle errors, remove socket from bridge if it is exists
  clientSocket.on('error', (err) => {
    logger.info(`Client socket error: ${error}`);
    logger.verbose('A bridge connection is demolished');
    try{
      bridge.deleteSocketConnectionBySocket(clientSocket);
    } catch(error){
      logger.info(error);
    }
  });

  // Handle the connection end event, remove socket from bridge if it is exists
  clientSocket.on('end', () => {

    logger.info('Client socket closed:');
    try{
      bridge.deleteSocketConnectionBySocket(clientSocket);
    } catch(error){
      logger.info(error);
    }
    

  });

  // When data is received from a client, decrypt and pass to processing
  clientSocket.on('data', (data) => {

    let decryptedText;

    try{
      decryptedText = crypto.decryptAESCBC(data.toString('base64'));
    } catch(error){
        logger.warn(`Message decryption error: ${error}`);
        logger.warn(`Message content: ${data.toString()}`);
    }

    try{
      tunnelDataHandler(clientSocket, decryptedText);
    } catch(error){
        logger.warn(`Message process error: ${error}`);
        logger.warn(`Message content: ${decryptedText}`);
    }

  });
});


server.listen(serverPort, () => {
  logger.info(`ELFIN IoT TCP proxy server is listening on port ${serverPort}`);
});