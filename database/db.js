const mongoose = require("mongoose");
const logger = require("../logger");

mongoose
    .connect("mongodb://10.101.2.4:27017/test")
    .then(() => logger.info("DB Connected!"));


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
    mongoose,
    Device,
    User,
};
