/**
 * GeoIP Service - Modern geolocation using MaxMind GeoLite2 database.
 * 
 * Provides IP-to-location lookups with lazy initialization and graceful fallback.
 * Replaces the deprecated geoip-lite package with the official maxmind library.
 */

import path from 'path';
import maxmind, { CityResponse, Reader } from 'maxmind';

/**
 * Result structure for GeoIP lookups (matches previous geoip-lite structure for compatibility)
 */
export interface GeoIPResult {
    country: string | null;
    city: string | null;
    region: string | null;
    timezone: string | null;
    latitude: number | null;
    longitude: number | null;
}

// Database path - relative to server root
const DB_PATH = path.join(__dirname, '../../../../data/GeoLite2-City.mmdb');

// Singleton reader instance
let reader: Reader<CityResponse> | null = null;
let initPromise: Promise<void> | null = null;
let initWarningShown = false;

/**
 * Initialize the MaxMind reader lazily.
 * This is called automatically on first lookup.
 */
async function initReader(): Promise<void> {
    if (reader) return;

    try {
        reader = await maxmind.open<CityResponse>(DB_PATH);
        console.log('[GeoIP] MaxMind GeoLite2-City database loaded successfully');
    } catch (error: any) {
        if (!initWarningShown) {
            console.warn('[GeoIP] Could not load GeoLite2-City database:', error.message);
            console.warn('[GeoIP] GeoIP lookups will return null. Download the database from MaxMind.');
            console.warn('[GeoIP] Expected path:', DB_PATH);
            initWarningShown = true;
        }
        reader = null;
    }
}

/**
 * Perform a GeoIP lookup for the given IP address.
 * 
 * @param ipAddress - IPv4 or IPv6 address to lookup
 * @returns GeoIP result with country, city, region, timezone, and coordinates
 */
export async function geoipLookup(ipAddress: string): Promise<GeoIPResult | null> {
    // Lazy initialization
    if (!initPromise) {
        initPromise = initReader();
    }
    await initPromise;

    // No reader = no database loaded
    if (!reader) {
        return null;
    }

    try {
        const result = reader.get(ipAddress);

        if (!result) {
            return null;
        }

        return {
            country: result.country?.iso_code || null,
            city: result.city?.names?.en || null,
            region: result.subdivisions?.[0]?.iso_code || null,
            timezone: result.location?.time_zone || null,
            latitude: result.location?.latitude || null,
            longitude: result.location?.longitude || null
        };
    } catch (error) {
        // Invalid IP format or other lookup error
        return null;
    }
}

/**
 * Synchronous lookup wrapper for compatibility with existing code.
 * Note: First call may return null if database isn't loaded yet.
 * For best results, call initGeoIP() at server startup.
 */
export function geoipLookupSync(ipAddress: string): GeoIPResult | null {
    if (!reader) {
        // Trigger async init for next call, return null for this one
        if (!initPromise) {
            initPromise = initReader();
        }
        return null;
    }

    try {
        const result = reader.get(ipAddress);

        if (!result) {
            return null;
        }

        return {
            country: result.country?.iso_code || null,
            city: result.city?.names?.en || null,
            region: result.subdivisions?.[0]?.iso_code || null,
            timezone: result.location?.time_zone || null,
            latitude: result.location?.latitude || null,
            longitude: result.location?.longitude || null
        };
    } catch (error) {
        return null;
    }
}

/**
 * Pre-initialize the GeoIP reader at server startup.
 * Call this from your main server initialization to ensure the database
 * is loaded before any tracking requests come in.
 * 
 * @param forceReload - If true, reload even if already initialized
 */
export async function initGeoIP(forceReload: boolean = false): Promise<void> {
    if (forceReload) {
        // Reset state for reload
        reader = null;
        initPromise = null;
        initWarningShown = false;
    }

    if (!initPromise) {
        initPromise = initReader();
    }
    await initPromise;
}
