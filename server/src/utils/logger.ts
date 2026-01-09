import pino from 'pino';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom levels matching Winston's original config
const customLevels = {
    error: 50,
    warn: 40,
    info: 30,
    http: 25,
    debug: 20,
};

const level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn';

// Multi-stream destination for file logging
const streams: pino.StreamEntry[] = [
    // Console (stdout) - always
    { stream: process.stdout },
];

// Add file streams
if (process.env.NODE_ENV !== 'development') {
    streams.push(
        // Error log
        { level: 'error', stream: fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' }) },
        // All logs
        { stream: fs.createWriteStream(path.join(logsDir, 'all.log'), { flags: 'a' }) }
    );
}

// Create the raw pino logger
const createPinoLogger = () => {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        // Development: Use pino-pretty for colored console output
        return pino({
            level,
            customLevels,
            useOnlyCustomLevels: false,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss:l',
                    ignore: 'pid,hostname',
                },
            },
        });
    }

    // Production: JSON output to multiple streams
    return pino(
        {
            level,
            customLevels,
            useOnlyCustomLevels: false,
            timestamp: pino.stdTimeFunctions.isoTime,
        },
        pino.multistream(streams)
    );
};

const pinoInstance = createPinoLogger();

// Export for Fastify native integration
export const pinoLogger = pinoInstance;

/**
 * Winston-compatible Logger wrapper.
 * 
 * Winston API: Logger.info('message', { meta })
 * Pino API:    Logger.info({ meta }, 'message')
 * 
 * This wrapper adapts Winston-style calls to Pino's API.
 */
export const Logger = {
    error: (message: string, meta?: Record<string, any>) => {
        if (meta) {
            pinoInstance.error(meta, message);
        } else {
            pinoInstance.error(message);
        }
    },
    warn: (message: string, meta?: Record<string, any>) => {
        if (meta) {
            pinoInstance.warn(meta, message);
        } else {
            pinoInstance.warn(message);
        }
    },
    info: (message: string, meta?: Record<string, any>) => {
        if (meta) {
            pinoInstance.info(meta, message);
        } else {
            pinoInstance.info(message);
        }
    },
    http: (message: string, meta?: Record<string, any>) => {
        if (meta) {
            (pinoInstance as any).http(meta, message);
        } else {
            (pinoInstance as any).http(message);
        }
    },
    debug: (message: string, meta?: Record<string, any>) => {
        if (meta) {
            pinoInstance.debug(meta, message);
        } else {
            pinoInstance.debug(message);
        }
    },
    // Child logger support for contextual logging
    child: (bindings: Record<string, any>) => {
        const childPino = pinoInstance.child(bindings);
        return {
            error: (message: string, meta?: Record<string, any>) => meta ? childPino.error(meta, message) : childPino.error(message),
            warn: (message: string, meta?: Record<string, any>) => meta ? childPino.warn(meta, message) : childPino.warn(message),
            info: (message: string, meta?: Record<string, any>) => meta ? childPino.info(meta, message) : childPino.info(message),
            http: (message: string, meta?: Record<string, any>) => meta ? (childPino as any).http(meta, message) : (childPino as any).http(message),
            debug: (message: string, meta?: Record<string, any>) => meta ? childPino.debug(meta, message) : childPino.debug(message),
        };
    },
};
