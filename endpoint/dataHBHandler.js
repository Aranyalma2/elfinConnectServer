const logger = require("../logger");
const endpoint = require("./device");
const endpointDB = require("./db");

class Timer {
  constructor(duration, deviceKey) {
    this.duration = duration;
    this.deviceKey = deviceKey;
    this.timerId = null;
  }

  start() {
    this.timerId = setTimeout(() => {
      this.task();
    }, this.duration);
  }

  reset() {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  task() {

    logger.debug(`Data HB a Timer over: ${this.deviceKey.split("-")[1]}`);


    endpointDB.connectToUser(endpoint.getDevice(this.deviceKey));

    if (objectTimers[this.deviceKey].second) {
      objectTimers[this.deviceKey].first = objectTimers[this.deviceKey].second;
      objectTimers[this.deviceKey].second = null;
      logger.debug(`Data HB timer; Timer2 => TImer1: ${this.deviceKey.split("-")[1]}`);
    }
    else {
      delete objectTimers[this.deviceKey];
      logger.debug(`Data HB timer; Timer1 over no further Timer2: ${this.deviceKey.split("-")[1]}`);
    }
  }
}

const objectTimers = {};

async function timerHandler(deviceKey) {
  if (!objectTimers[deviceKey]) {
    objectTimers[deviceKey] = { first: null, second: null };
    objectTimers[deviceKey].first = new Timer(30000, deviceKey);
    objectTimers[deviceKey].first.start();
  }
  else if (!objectTimers[deviceKey].second) {
    objectTimers[deviceKey].second = new Timer(30000, deviceKey);
    objectTimers[deviceKey].second.start();
  }
  else {
    objectTimers[deviceKey].second.reset();
    objectTimers[deviceKey].second = new Timer(30000, deviceKey);
    objectTimers[deviceKey].second.start();
  }
}

module.exports = { timerHandler };