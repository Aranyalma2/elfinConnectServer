const logger = require("../logger");

const database = require("../database/db.js");

function connectToUser(deviceObject) {

	//Check user is exists in DB
	database.User.findOne({ uuid: deviceObject.ownerUuid })
		.then((foundUser) => {
			if (!foundUser) {
				//User is not in the DB, message is dropped
				logger.warn(`User is not in the DB, message is dropped. | User: ${deviceObject.ownerUuid}`);
				return false;
			}
			//Check if device already in the database and the device is not in the user's device list but it is in other user's device list
			//in this case remove the device from the other user's device list and add it to the current user's device list
			database.Device.findOne({ macAddress: deviceObject.macAddress }).then(async (foundDevice) => {
				let dbObject;
				if (foundDevice) {
					dbObject = foundDevice;
					if (!foundUser.allDevices.includes(foundDevice._id)) {
						const otherUser = await database.User.findOne({ allDevices: foundDevice._id });

						if (otherUser) {
							otherUser.allDevices = otherUser.allDevices.filter((device) => device._id.toString() !== foundDevice._id.toString());
							await otherUser.save();
							logger.debug(`Device removed from user: ${otherUser.username}`);
						}
					}
					//Update the existing device in db with deviceObject's data
					foundDevice.hostName = deviceObject.hostName;
					foundDevice.macAddress = deviceObject.macAddress;
					foundDevice.lastSeenDate = deviceObject.lastSeenDate;
					await foundDevice.save();
					logger.debug(`Device updated: ${foundDevice.macAddress}`);
				}

				//Create it in db if it is not exist with deviceObject's data
				else {
					const newDevice = new database.Device({
						hostName: deviceObject.hostName,
						macAddress: deviceObject.macAddress,
						lastSeenDate: deviceObject.lastSeenDate,
					});
					await newDevice.save();
					dbObject = newDevice;
					logger.debug(`Device created: ${newDevice.macAddress}`);
				}

				//Push the device _id value inside the foundUser.allDevices array if not in
				if (!foundUser.allDevices.includes(dbObject._id)) {
					foundUser.allDevices.push(dbObject._id);
					await foundUser.save();
				}

			});
		})
		.catch ((err) => {
			logger.error(err);
		});
}

async function getDevices(user) {
	try {
		const userObject = await database.User.findOne({ uuid: user });
		const devices = await database.Device.find({ _id: userObject.allDevices });
		return devices;
	} catch (err) {
		return [];
	}
}

async function checkUser(user) {
	try {
		const userObject = await database.User.findOne({ uuid: user });
		return typeof userObject !== undifined ? true : false;
	} catch (err) {
		return false;
	}
}

const func = { connectToUser, getDevices, checkUser };

module.exports = func;