/**
 * getDefaultEmailAccount.ts
 * 
 * Helper function to fetch the default SMTP email account for a tenant.
 * Used by all services that need to send emails (automations, broadcasts, reports, etc.)
 */

import { prisma } from './prisma';
import { EmailAccount } from '@prisma/client';

/**
 * Fetches the default SMTP email account for a tenant.
 * Priority:
 *   1. Account with isDefault: true and type: 'SMTP'
 *   2. First SMTP account found (fallback)
 *   3. null if no SMTP accounts exist
 */
export async function getDefaultEmailAccount(accountId: string): Promise<EmailAccount | null> {
    // First try to find the explicitly set default
    const defaultAccount = await prisma.emailAccount.findFirst({
        where: {
            accountId,
            type: 'SMTP',
            isDefault: true
        }
    });

    if (defaultAccount) {
        return defaultAccount;
    }

    // Fallback: return first SMTP account
    return prisma.emailAccount.findFirst({
        where: {
            accountId,
            type: 'SMTP'
        }
    });
}
