/**
 * String Utilities
 * 
 * Common string manipulation functions used across the application.
 * @module utils/stringUtils
 */

/**
 * Escapes special regex characters in a string for safe use in RegExp constructor.
 * 
 * @param str - The string to escape
 * @returns The escaped string safe for use in regex patterns
 * @example
 * escapeRegex('Hello (world)') // Returns 'Hello \\(world\\)'
 */
export function escapeRegex(str: string): string {
    if (!str) return '';
    try {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    } catch {
        // Return original string if escape fails (shouldn't happen with valid input)
        return str;
    }
}

/**
 * Truncates a string to a maximum length, adding ellipsis if truncated.
 * 
 * @param str - The string to truncate
 * @param maxLength - Maximum length including ellipsis
 * @returns Truncated string with ellipsis if needed
 */
export function truncate(str: string, maxLength: number): string {
    if (!str || str.length <= maxLength) return str || '';
    return str.slice(0, maxLength - 3) + '...';
}
