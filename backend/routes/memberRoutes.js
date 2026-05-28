const express = require('express');
const memberController = require('../controllers/memberController');

const router = express.Router();

// Get all members
router.get('/', memberController.getMembers);

// Get pending members only
router.get('/pending', memberController.getPendingMembers);

// Clear all pending members (before parameterized route)
router.delete('/clear-pending', memberController.clearPendingMembers);

// Delete all members (workers)
router.delete('/delete-all', memberController.deleteAllMembers);

// Approve a member
router.post('/:id/approve', memberController.approveMember);

// Reject a member
router.post('/:id/reject', memberController.rejectMember);

module.exports = router;
