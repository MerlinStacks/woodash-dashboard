import { Request, Response, NextFunction } from 'express';
import { Logger as logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

        if (res.statusCode >= 400) {
            logger.warn(message, {
                ip: req.ip,
                userAgent: req.get('user-agent'),
                // body: req.body // Be careful logging body with PII
            });
        } else {
            logger.info(message);
        }
    });

    next();
};
