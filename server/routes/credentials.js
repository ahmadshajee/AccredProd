const express = require('express');
const {
  issueCredential,
  getMyCredentials,
  getIssuedCredentials,
  revokeCredential,
} = require('../controllers/credentialController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/issue', protect, authorize('institution'), issueCredential);
router.get('/my', protect, authorize('student'), getMyCredentials);
router.get('/issued', protect, authorize('institution'), getIssuedCredentials);
router.patch('/:id/revoke', protect, authorize('institution'), revokeCredential);

module.exports = router;