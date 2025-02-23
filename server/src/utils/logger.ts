import winston from 'winston';

// Custom log format
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  // Only include stack traces for errors
  if (level === 'error' && meta.stack) {
    return `${timestamp} [${level}] ${message}\n${meta.stack}`;
  }
  
  // For other levels, only show additional data if it's relevant
  const metaData = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}] ${message}${metaData}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error',
      format: logFormat
    })
  ]
});

// Reduce logging in production
if (process.env.NODE_ENV === 'production') {
  logger.level = 'error';
} 