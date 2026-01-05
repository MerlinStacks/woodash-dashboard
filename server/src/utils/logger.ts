import winston from 'winston';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // winston.format.colorize({ all: true }), // Colorize for console, but JSON usually preferred for logs
    winston.format.json() // Production grade JSON logs
);

// Add custom format for console dev feeling
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.accountId ? `[Account: ${info.accountId}]` : ''} ${info.jobId ? `[Job: ${info.jobId}]` : ''}`
    )
);

const transports = [
    new winston.transports.Console({
        format: process.env.NODE_ENV === 'development' ? consoleFormat : format,
    }),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.json(),
    }),
    new winston.transports.File({ filename: 'logs/all.log', format: winston.format.json() }),
];

export const Logger = winston.createLogger({
    level: level(),
    levels,
    transports,
});
