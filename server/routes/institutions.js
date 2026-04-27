const express = require('express');
const {
  registerInstitution,
  listInstitutions,
  approveInstitution,
  rejectInstitution,
} = require('../controllers/institutionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', protect, authorize('institution'), registerInstitution);
router.get('/', protect, authorize('admin'), listInstitutions);
router.patch('/:id/approve', protect, authorize('admin'), approveInstitution);
router.patch('/:id/reject', protect, authorize('admin'), rejectInstitution);

module.exports = router;