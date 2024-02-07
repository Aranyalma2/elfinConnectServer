const net = require('net');
const tunnelDataHandler = require("./tunnelDataHandler");
const logger = require("./logger");
const bridge = require("./bridge/connection") 
const crypto = require('./crypto/crypto');
//Persistance Collections
const database = require("./database/db.js");

const serverPort = 8080;

database.connectToDatabase().then(a => {
  //tunnelDataHandler("query;965b963fa1b585df","query;965b963fa1b585df")
});

// Create a TCP server that listens for incoming connections
const server = net.createServer((clientSocket) => {

  logger.verbose(`Device connected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  // Handle errors, remove socket from bridge if it is exists
  clientSocket.on('error', (error) => {
    logger.info(`Client socket error: ${error}`);
    logger.verbose(`${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
    try{
      bridge.deleteSocketConnectionBySocket(clientSocket);
    } catch(error){
      logger.info(error);
    }
  });

  // Handle the connection end event, remove socket from bridge if it is exists
  clientSocket.on('end', () => {

    logger.info('Client socket closed.');
    logger.verbose(`${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
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
      tunnelDataHandler(clientSocket, Buffer.from(decryptedText, 'hex').toString());
    } catch(error){
        logger.warn(`Message process error: ${error}`);
        logger.warn(`Message content: ${decryptedText}`);
    }

  });
});


server.listen(serverPort, () => {
  logger.info(`ELFIN IoT TCP proxy server is listening on port ${serverPort}`);
});