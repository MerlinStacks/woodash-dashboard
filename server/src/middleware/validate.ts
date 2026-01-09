import { Request, Response, NextFunction } from 'express';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodObject, ZodError, ZodSchema } from 'zod';

/**
 * Express validation middleware (legacy - via bridge)
 */
export const validate = (schema: ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            });
        }
        return res.status(500).json({ error: 'Internal server error during validation' });
    }
};

/**
 * Fastify validation preHandler factory (native)
 * 
 * Usage:
 * fastify.post('/endpoint', { preHandler: [validateFastify(mySchema)] }, handler)
 */
export const validateFastify = (schema: ZodSchema<any>) => async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        schema.parse({
            body: request.body,
            query: request.query,
            params: request.params,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return reply.code(400).send({
                error: 'Validation failed',
                details: error.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            });
        }
        return reply.code(500).send({ error: 'Internal server error during validation' });
    }
};
