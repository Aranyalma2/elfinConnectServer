const mongoose = require("mongoose");
const logger = require("../logger");

const dbAddress = "database:27017";
const dbCollectionName = "elfinconnect";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(`mongodb://${dbAddress}/${dbCollectionName}`);
    logger.info("DB Connected!");
  } catch (error) {
    logger.error("DB Connection Error:", error);
  }
};

// Define the Device schema and model
const deviceSchema = new mongoose.Schema({
  hostName: String,
  macAddress: String,
  lastSeenDate: Date,
});

const Device = mongoose.model("Device", deviceSchema);

// Define the User schema and model
const userSchema = new mongoose.Schema({
  uuid: String,
  name: String,
  password: String,
  allDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Device" }],
});

const User = mongoose.model("User", userSchema);

module.exports = {
  connectToDatabase,
  Device,
  User,
};
