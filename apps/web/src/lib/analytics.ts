import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Singleton Beacon
class AnalyticsBeacon {
    private queue: any[] = [];
    private processing = false;

    track(event: string, properties: any = {}) {
        const payload = {
            event,
            properties,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        console.log("Analytics Track:", event, properties);
        this.queue.push(payload);
        this.process();
    }

    private async process() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        const event = this.queue.shift();
        try {
            await axios.post('/api/analytics/event', event);
        } catch (e) {
            console.error("Failed to send analytics event", e);
            // Retry logic could go here, or drop.
        } finally {
            this.processing = false;
            if (this.queue.length > 0) this.process();
        }
    }
}

export const analytics = new AnalyticsBeacon();

// Hook for automatic page view tracking
export const useAnalytics = () => {
    const location = useLocation();

    useEffect(() => {
        analytics.track('page_view', {
            path: location.pathname,
            search: location.search
        });
    }, [location]);
};
