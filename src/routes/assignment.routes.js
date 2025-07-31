const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getEngineerAssignments
} = require('../controller/assignment.controller');

router.get('/', auth.ensureAuth("Manager","Engineer"), getAssignments);
router.get('/:id', auth.ensureAuth("Manager","Engineer"), getAssignmentById);
router.post('/', auth.ensureAuth("Manager","Engineer"), createAssignment);
router.put('/:id', auth.ensureAuth("Manager","Engineer"), updateAssignment);
router.delete('/:id', auth.ensureAuth("Manager","Engineer"), deleteAssignment);
router.get('/engineer/:engineerId', auth.ensureAuth("Manager","Engineer"), getEngineerAssignments);

module.exports = router;