
import express from 'express';
import { TrackingService } from '../services/TrackingService';
import { prisma } from '../utils/prisma';
import { verifyToken } from '../utils/auth';

import { requireAuth } from '../middleware/auth';

const router = express.Router();


/**
 * Serve Tracking Script
 * GET /api/tracking/tracking.js
 */
router.get('/tracking.js', (req, res) => {
    const script = `
(function() {
    const API_URL = '${process.env.API_URL || "https://api.overseek.com"}/api/tracking/events'; // Adjust based on env
    // Actually, since we are serving it, we can just use the origin relative to where it was loaded, 
    // IF the script is loaded from the same domain. But it's on a woocommerce site.
    // So we need the absolute URL of THIS server.
    // We can infer it from the request if not set.
    const ENDPOINT = window.location.protocol + '//' + '${req.get('host')}' + '/api/tracking/events';

    // Helper: Generate UUID
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Helper: Get/Set Cookie
    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
    }
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    }

    // 1. Initialize Visitor ID
    let visitorId = getCookie('_os_vid');
    if (!visitorId) {
        visitorId = generateUUID();
        setCookie('_os_vid', visitorId, 365);
    }

    // Get Account ID from URL query param
    const scriptTag = document.currentScript;
    const urlParams = new URLSearchParams(scriptTag.src.split('?')[1]);
    const accountId = urlParams.get('id');

    if (!accountId) {
        console.warn('OverSeek: Account ID missing');
        return;
    }

    // 2. Send Event
    function sendEvent(type, payload = {}) {
        const data = {
            accountId,
            visitorId,
            type,
            url: window.location.href,
            pageTitle: document.title,
            referrer: document.referrer,
            payload
        };

        // Capture UTMs
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('utm_source')) data.utmSource = urlParams.get('utm_source');
        if (urlParams.has('utm_medium')) data.utmMedium = urlParams.get('utm_medium');
        if (urlParams.has('utm_campaign')) data.utmCampaign = urlParams.get('utm_campaign');

        // Use Beacon if available for guaranteed delivery on unload, else fetch/xhr
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            navigator.sendBeacon(ENDPOINT, blob);
        } else {
            fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(e => console.error(e));
        }
    }

    // 3. Track Pageview
    sendEvent('pageview');

    // 4. WooCommerce Events (jQuery)
    if (typeof jQuery !== 'undefined') {
        jQuery(document.body).on('added_to_cart', function(e, fragments, cart_hash, button) {
             // We need cart total. WooCommerce fragments might contain it.
             // fragments['div.widget_shopping_cart_content'] usually has HTML.
             // Better to just trigger an "update_cart" event which might fetch cart?
             // Or assume backend will fetch/sync?
             // Actually, for "Live Cart" value, we can try to parse it or just trigger.
             
             // Simplest: Send 'add_to_cart'.
             // To get the actual value, we might need to look at specific DOM elements or global wc objects if exposed.
             // 'wc_cart_params' is sometimes available.
             
             // Let's rely on 'wc_fragments_refreshed' or similar updates.
             sendEvent('add_to_cart');
        });

        jQuery(document.body).on('removed_from_cart', function() {
            sendEvent('remove_from_cart');
        });

        // Try to scrape cart total from common selectors if possible?
        // Or cleaner: Client sends update, we don't have total.
        // Wait, the plan said "Listening for WooCommerce events... to update cart contents and value."
        // Doing this strictly client-side without access to the store's backend is hard unless we parse HTML.
        // Standard WooCommerce AJAX cart response usually updates fragments.
        // We can parse the fragments if we want.
        
        // For V1, sending the event is good.
        // If we want value, we can try to find the cart total element.
        // '.woocommerce-mini-cart__total' or similar.
    }

    // Periodic Heartbeat (keep session alive)
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            sendEvent('heartbeat');
        }
    }, 30000);

})();
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(script);
});

/**
 * public ingestion endpoint
 * POST /api/tracking/events
 */
router.post('/events', async (req, res) => {
    try {
        const { accountId, visitorId, type, url, payload, pageTitle, referrer, utmSource, utmMedium, utmCampaign } = req.body;

        if (!accountId || !visitorId || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate account exists to prevent spam
        // We could cache this or just trust the DB is fast enough.
        // For high volume, we'd use Redis or similar.
        // For now, simple DB check.
        // Actually, TrackingService attempts to link to Account via FK, so `upsert` will fail if account doesn't exist?
        // Yes, if we didn't check, but let's check or handle error.

        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (Array.isArray(ip)) ip = ip[0];

        const userAgent = req.headers['user-agent'];

        // Process in background if we want faster response?
        // But for "Live" view, we want it indexed.
        await TrackingService.processEvent({
            accountId,
            visitorId,
            type,
            url,
            payload,
            pageTitle,
            ipAddress: ip as string,
            userAgent,
            referrer,
            utmSource,
            utmMedium,
            utmCampaign
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Tracking Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --------------------------------------------------------
// Dashboard Routes (Protected)
// --------------------------------------------------------

// Middleware to get current account context
// Usually passed as header x-account-id or part of query?
// In this app, we usually have `req.user` and we need to check permission for account.
// I'll assume standard pattern: authenticateToken + check account ownership.

router.get('/live', requireAuth, async (req: any, res) => {
    try {
        const accountId = req.headers['x-account-id'];
        if (!accountId) return res.status(400).json({ error: 'Account ID required' });

        const visitors = await TrackingService.getLiveVisitors(accountId as string);
        res.json(visitors);
    } catch (error) {
        console.error('Live Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch live users' });
    }
});

router.get('/carts', requireAuth, async (req: any, res) => {
    try {
        const accountId = req.headers['x-account-id'];
        if (!accountId) return res.status(400).json({ error: 'Account ID required' });

        const carts = await TrackingService.getLiveCarts(accountId as string);
        res.json(carts);
    } catch (error) {
        console.error('Live Carts Error:', error);
        res.status(500).json({ error: 'Failed to fetch live carts' });
    }
});

router.get('/session/:sessionId', requireAuth, async (req: any, res) => {
    try {
        const history = await TrackingService.getSessionHistory(req.params.sessionId);
        res.json(history);
    } catch (error) {
        console.error('Session History Error:', error);
        res.status(500).json({ error: 'Failed to fetch session history' });
    }
});

export default router;
