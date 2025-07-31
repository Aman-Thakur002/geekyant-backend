const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getManagerDashboard,
  getEngineerDashboard,
  getTeamAnalytics
} = require('../controller/dashboard.controller');

router.get('/manager', auth.ensureAuth("Manager","Engineer"), getManagerDashboard);
router.get('/engineer', auth.ensureAuth("Manager","Engineer"), getEngineerDashboard);
router.get('/analytics', auth.ensureAuth("Manager","Engineer"), getTeamAnalytics);

module.exports = router;