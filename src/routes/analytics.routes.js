const express = require("express");
const { getTeamAnalytics, getCapacityPlanning } = require("../controller/analytics.controller");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/team", authenticateToken, getTeamAnalytics);
router.get("/capacity", authenticateToken, getCapacityPlanning);

module.exports = router;