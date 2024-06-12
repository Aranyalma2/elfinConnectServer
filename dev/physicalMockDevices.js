const {Socket} = require('net');

const serverHost = 'localhost'; // Change this to your server's hostname or IP address
const serverPort = 3001; // Change this to your server's port
const userID = 'b5ac6dd5ed250818'; // Change this to your user ID

const numberOfDevices = 2; // Change this to the number of devices you want to simulate
const heartbeatInterval = 30000; // Change this to the heartbeat interval in milliseconds, use 0 or less for random intervals (5-60sec)

for (let i = 1; i <= numberOfDevices; i++) {
  const mac = `mac${i}`;
  const host = `host${i}`;
  let socket = new Socket();

  // Initial heartbeat
  sendHeartbeat(mac, host, socket);

  // Schedule subsequent heartbeats
  scheduleHeartbeat(mac, host, socket);
}

function sendHeartbeat(mac, host, client) {
  let heartbeatMessage = `beat;${userID};${mac};${host};0`;

  // Connect to the server
  if (!client._host) {
    // If the connection is not writable (closed), create a new socket and connect
    client.connect(serverPort, serverHost, () => {
      console.log(`Connected to server: ${serverHost}:${serverPort} - Device: ${mac}`);
      console.log(`Sending heartbeat message: ${heartbeatMessage.toString('hex')}`);
      client.write(heartbeatMessage);
    });

    // Handle incoming data from the server
    client.on('data', (data) => {
      console.log(`Received response from server for ${mac}: ${data}`);
    });

    // Handle connection errors
    client.on('close', () => {
      console.log(`Connection closed for ${mac}`);
    });
    client.on('error', () => {
      console.log(`Connection force closed for ${mac}`);
    });

  } else {
    // If the connection is still writable, send the heartbeat message
    console.log(`Sending heartbeat message: ${heartbeatMessage}`);
    client.write(heartbeatMessage);
  }
}

function scheduleHeartbeat(mac, host, socket) {
  const interval = heartbeatInterval > 0 ? heartbeatInterval : Math.floor(Math.random() * (60 - 5) + 5); // Random interval between 10 and 40 seconds
  console.log(`Next heartbeat for ${mac} in ${interval / 1000} seconds.`);

  setTimeout(() => {
    sendHeartbeat(mac, host, socket);

    scheduleHeartbeat(mac, host, socket); // Schedule the next heartbeat
  }, interval);
}