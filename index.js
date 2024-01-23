const net = require('net');
const tunnelDataHandler = require("./tunnelDataHandler");
const logger = require("./logger");
const bridge = require("./bridge/connection") 
const crypto = require('./crypto/crypto');

const serverPort = 8080;
const aesKEY = "0123456789abcdef";

// Create a TCP server that listens for incoming connections
const server = net.createServer((clientSocket) => {

  logger.verbose(`Device connected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  // Handle errors, remove socket from bridge if it is exists
  clientSocket.on('error', (err) => {
    logger.debug('Client socket error:', err);
    logger.verbose('A bridge connection is demolished');
    bridge.deleteSocketConnectionBySocket(clientSocket);
  });

  // Handle the connection end event, remove socket from bridge if it is exists
  clientSocket.on('end', () => {

    logger.verbose('Client socket closed:');
    bridge.deleteSocketConnectionBySocket(clientSocket);

  });

  // When data is received from a client, decrypt and pass to processing
  clientSocket.on('data', (data) => {

    //console.log(data.toString('hex'));

    const decryptedText = crypto.decryptAESCBC(data.toString('base64'));
    tunnelDataHandler(clientSocket, decryptedText);

  });
});


server.listen(serverPort, () => {
  logger.info(`TCP proxy server is listening on port ${serverPort}`);
});