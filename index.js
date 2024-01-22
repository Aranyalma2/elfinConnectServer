const net = require('net');
const tunnelDataHandler = require("./tunnelDataHandler");
const logger = require("./logger");
const bridge = require("./bridge/connection") 
const crypto = require('crypto');

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

    const decryptedText = decryptAESCBCHEX(data.toString('hex'), aesKEY);
    logger.verbose('Incomming Decrypted Text:', decryptedText);
    tunnelDataHandler(clientSocket, decryptedText);
  });
});

//Decrypt the AES-128-cbc (IV == KEY)
//First try with PKCS#7 padding, if fail, try without it.
function decryptAESCBCHEX(ciphertextHex, key, padding = true) {
  try {
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, key);
    decipher.setAutoPadding(padding);
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  } catch (error) {
    logger.debug('Decryption error, try without padding:', error.message);
    //try without padding
    if(padding){
      return decryptAESCBCHEX(ciphertextHex, key, padding = false);
    }
    return null;
  } 
}

server.listen(serverPort, () => {
  logger.info(`TCP proxy server is listening on port ${serverPort}`);
});