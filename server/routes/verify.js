const express = require('express');
const { verifyCredentialByToken } = require('../controllers/verifyController');

const router = express.Router();

router.get('/:tokenId', verifyCredentialByToken);

module.exports = router;