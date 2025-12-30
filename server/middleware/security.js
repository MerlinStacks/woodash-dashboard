const restrictToLocalhost = (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    // Allow localhost (IPv4 127.0.0.1 or IPv6 ::1 or ::ffff:127.0.0.1)
    if (clientIp.includes('127.0.0.1') || clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
        next();
    } else {
        console.warn(`[Security] Blocked external access to admin route from: ${clientIp}`);
        res.status(403).json({ error: 'Access Denied: Localhost only' });
    }
};

module.exports = { restrictToLocalhost };
