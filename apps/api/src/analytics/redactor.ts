
export const redact = (data: any): any => {
    if (!data) return data;

    if (typeof data === 'string') {
        // Email Regex
        if (data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
            return '[REDACTED_EMAIL]';
        }
        // Phone Regex (Simple)
        if (data.match(/^\+?[0-9\s-]{10,}$/)) {
            return '[REDACTED_PHONE]';
        }
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => redact(item));
    }

    if (typeof data === 'object') {
        const newData: any = {};
        for (const key of Object.keys(data)) {
            // Key-based redaction
            if (['email', 'password', 'token', 'credit_card', 'cc_number', 'phone'].includes(key.toLowerCase())) {
                newData[key] = '[REDACTED]';
            } else {
                newData[key] = redact(data[key]);
            }
        }
        return newData;
    }

    return data;
};
