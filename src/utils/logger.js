import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Create the logger format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, requestId, ...metadata }) => {
    let msg = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (requestId) {
      msg = `[${timestamp}] [${requestId}] ${level.toUpperCase()}: ${message}`;
    }
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  transports: [
    // Console transport disabled - all logs go to files only
    // Write all error logs to error.log
    new winston.transports.DailyRotateFile({
      filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '10m',
    }),
    // Write all logs to combined.log
    new winston.transports.DailyRotateFile({
      filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '10m',
    }),
  ],
});

// Create a middleware to add request ID to logs
export const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  // Log the incoming request
  logger.http(`${req.method} ${req.url}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    logger.http(`${req.method} ${req.url} ${res.statusCode}`, {
      requestId,
      statusCode: res.statusCode,
      responseTime: Date.now() - req._startTime,
    });
  });

  next();
};

// Helper function to add request ID to log context
export const getLoggerWithRequestId = (requestId) => {
  return {
    error: (message, meta = {}) => logger.error(message, { ...meta, requestId }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, requestId }),
    info: (message, meta = {}) => logger.info(message, { ...meta, requestId }),
    http: (message, meta = {}) => logger.http(message, { ...meta, requestId }),
    debug: (message, meta = {}) => logger.debug(message, { ...meta, requestId }),
  };
};

export default logger;