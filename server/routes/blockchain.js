const express = require('express');
const { listTransactions, getTransaction } = require('../controllers/blockchainController');

const router = express.Router();

router.get('/transactions', listTransactions);
router.get('/transactions/:txHash', getTransaction);

module.exports = router;