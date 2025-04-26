import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath
import fs from 'fs';
        
// --- Determine the directory name in ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log directory and file using the ESM-compatible __dirname
const LOG_DIR = path.join(__dirname, '../logs'); // Place logs in a root 'logs' folder
const LOG_FILE = path.join(LOG_DIR, 'server.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true }); // Ensure recursive creation
}

const logger = winston.createLogger({
  level: 'info', // Log only info and above by default
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Log stack traces for errors
    winston.format.splat(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
  ),
  transports: [
    // Write all logs with level `error` and below to `error.log` 
    // (could add this later if needed)
    // new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
    
    // Write all logs with level `info` and below to `server.log`
    new winston.transports.File({ filename: LOG_FILE })
  ],
});

// If we're not in production, also log to the `console`
// with a simple format.
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
  }));
}

export default logger; 