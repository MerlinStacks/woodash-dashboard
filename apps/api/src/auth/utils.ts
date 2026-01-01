import argon2 from 'argon2';
import { randomBytes } from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
    return await argon2.hash(password);
};

export const verifyPassword = async (hash: string, plain: string): Promise<boolean> => {
    try {
        return await argon2.verify(hash, plain);
    } catch (e) {
        return false;
    }
};

export const generateSessionId = (): string => {
    return randomBytes(32).toString('hex');
};
