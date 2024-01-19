const logger = require("../logger");

const database = require("../database/db.js");

function saveHearthbeat(deviceObjectDB) {
	return new Promise((resolve, reject) => {
		//Update device
		const deviceDB = {
			hostName: deviceObjectDB.hostName,
			macAddress: deviceObjectDB.macAddress,
			lastSeenDate: deviceObjectDB.lastSeenDate,
		};
		database.Device.findOneAndUpdate({ macAddress: deviceObjectDB.macAddress }, deviceDB, { upsert: true, new: true })
			.then((device) => {
				logger.debug(`Device updated or created: ${deviceObjectDB.macAddress}`);
				return resolve(device);
			})
			.catch((err) => {
				logger.error(`Error updating or creating device in DB: ${err}`);
				return reject(err);
			});
	});
}

function connectToUser(deviceObjectDB){

	//Check user is exists in DB
	database.User.findOne({ uuid: deviceObjectDB.ownerUuid })
		.then((foundUser) => {
			if (!foundUser) {
				//User is not in the DB, message is dropped
				logger.warn(`User is not in the DB, message is dropped. | User: ${deviceObjectDB.ownerUuid}`);
				return false;
			}
			//User is exists in DB
			//Add device to user DB
			saveHearthbeat(deviceObjectDB).then((savedDevice) => {
				//Try to connect device to user in DB
				if (savedDevice) {
					if (!foundUser.allDevices.includes(savedDevice._id)) {
							foundUser.allDevices.push(savedDevice._id);
							return foundUser.save().then(() => {
								logger.verbose(`User updated: ${foundUser.username}`);
							});
						}
					}
				});
			})
		.catch((err) => {
			logger.error(err);
		});
}

const func = {connectToUser};

module.exports = func;