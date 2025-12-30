const express = require('express');
const syncManager = require('../sync'); // This is the sync Logic file
const { pool } = require('../db');
const redisClient = require('../redis');

const router = express.Router();

router.post('/start', (req, res) => {
    const { storeUrl, consumerKey, consumerSecret, authMethod, accountId, options } = req.body;

    if (!storeUrl || !consumerKey || !consumerSecret || !accountId) {
        return res.status(400).json({ error: "Missing required parameters (storeUrl, keys, accountId)" });
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
