const winston = require('winston');
const environment = require('../config/environment');

const logger = winston.createLogger({
  level: environment.isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    environment.isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack }) => {
            return stack
              ? `${timestamp} ${level}: ${message}\n${stack}`
              : `${timestamp} ${level}: ${message}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
