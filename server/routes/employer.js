const express = require('express');
const { 
  getHistory, saveVerification, removeVerification, 
  issueCredential, getIssuedCredentials, revokeCredential,
  listEmployers, approveEmployer, rejectEmployer
} = require('../controllers/employerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Employer & Verifier Routes
router.get('/history', authorize('employer', 'verifier'), getHistory);
router.post('/verify', authorize('employer', 'verifier'), saveVerification);
router.delete('/verify/:tokenId', authorize('employer', 'verifier'), removeVerification);

// Employer Issuance Routes
router.post('/issue', authorize('employer'), issueCredential);
router.get('/issued', authorize('employer'), getIssuedCredentials);
router.patch('/:id/revoke', authorize('employer'), revokeCredential);

// Admin Routes for Employers
router.get('/admin/list', authorize('admin'), listEmployers);
router.patch('/admin/:id/approve', authorize('admin'), approveEmployer);
router.patch('/admin/:id/reject', authorize('admin'), rejectEmployer);

module.exports = router;
