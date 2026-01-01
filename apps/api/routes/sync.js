const express = require('express');
const syncManager = require('../sync'); // This is the sync Logic file
const { pool } = require('../db');
const redisClient = require('../redis');

const router = express.Router();

router.post('/start', (req, res) => {
    const { storeUrl, consumerKey, consumerSecret, authMethod, accountId, options } = req.body;

    const missingParams = [];
    if (!storeUrl) missingParams.push('storeUrl');
    if (!consumerKey) missingParams.push('consumerKey');
    if (!consumerSecret) missingParams.push('consumerSecret');
    if (!accountId) missingParams.push('accountId');

    if (missingParams.length > 0) {
        console.error('[Sync API] Missing parameters:', missingParams, 'Received:', { ...req.body, consumerKey: '***', consumerSecret: '***' });
        return res.status(400).json({ error: `Missing required parameters: ${missingParams.join(', ')}` });
    }

    syncManager.startSync(
        { storeUrl, consumerKey, consumerSecret, authMethod, accountId, options },
        { pool, redisClient } // Dependencies injection
    );

    res.json({ message: "Sync process started.", status: syncManager.getStatus() });
});

router.get('/status', (req, res) => {
    res.json(syncManager.getStatus());
});

module.exports = router;
