const net = require('net');
const { mongoose, Device, Terminal, Connection, User } = require("./database/db");
const db_example_fill = require("./db-example");
const tunnelDataHandler = require("./tunnelDataHandler");
const logger = require("./logger");

//db_example_fill();
/*
const user = new User({
      uuid: 'almafaa',
      name: 'TestName',
      password: 'password123',
      allDevices: [],
      allRemoteTerminal: [],
    });

    user.save();
*/

// Create an array to store connected clients
const clients = [];

// Create a TCP server that listens for incoming connections
const server = net.createServer((clientSocket) => {

  logger.verbose(`Device connected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);


  // Store the client socket in the clients array
  clients.push(clientSocket);

  // Handle errors
  clientSocket.on('error', (err) => {
    logger.verbose('Client socket error:', err);
  });

  // Handle the connection end event
  clientSocket.on('end', () => {
    // Remove the client socket from the clients array
    const index = clients.indexOf(clientSocket);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });

  // When data is received from a client, forward it to all other connected clients
  clientSocket.on('data', (data) => {
    tunnelDataHandler(clientSocket, data);
  });
});

const proxyPort = 8080; // Port on which the proxy server listens

server.listen(proxyPort, () => {
  logger.info(`TCP proxy server is listening on port ${proxyPort}`);
});