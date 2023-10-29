const { mongoose, Device, Terminal, Connection, User } = require("./db");

async function insertExampleData() {
  try {
    // Insert example devices
    const device1 = new Device({
      hostName: 'Device 1',
      macAddress: '00:11:22:33:44:55',
      lastSeenDate: new Date(),
    });
    const device2 = new Device({
      hostName: 'Device 2',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      lastSeenDate: new Date(),
    });

    await device1.save();
    await device2.save();

    // Insert example terminals
    const terminal1 = new Terminal({
      name: 'Terminal 1',
      lastSeenDate: new Date(),
      online: true,
    });
    const terminal2 = new Terminal({
      name: 'Terminal 2',
      lastSeenDate: new Date(),
      online: false,
    });

    await terminal1.save();
    await terminal2.save();

    
    // Insert example user
    const user = new User({
      uuid: 'user123',
      name: 'John Doe',
      password: 'password123',
      allDevices: [device1._id, device2._id],
      allRemoteTerminal: [terminal1._id, terminal2._id],
    });

    await user.save();

    console.log('Example data inserted successfully.');
  } catch (error) {
    console.error('Error inserting example data:', error);
  } finally {
  }
}

module.exports = insertExampleData;