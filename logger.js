const winston = require('winston');

// Define a custom log format with colors
const logFormat = winston.format.combine(
  //winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.simple()
);

// Create a logger with the console transport
const logger = winston.createLogger({
  level: 'verbose', // Set your desired log level
  format: logFormat,
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;