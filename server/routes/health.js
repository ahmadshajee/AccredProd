const express = require('express');
const { getDatabaseHealth } = require('../models/db');

const router = express.Router();

router.get('/', (_req, res) => {
  const database = getDatabaseHealth();
  const healthy = database.state === 'connected';

  res.status(healthy ? 200 : 503).json({
    service: 'accredchain-api',
    status: healthy ? 'ok' : 'degraded',
    database,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
