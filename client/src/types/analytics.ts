
export interface LiveSession {
    id: string; // session ID
    visitorId: string;
    country: string | null;
    city: string | null;
    deviceType: string | null;
    os: string | null;
    browser: string | null;
    currentPath: string | null;
    lastActiveAt: string;
    cartValue: number;
    cartItems: any; // JSON
    referrer: string | null;
    utmSource: string | null;
    utmCampaign: string | null;
}
