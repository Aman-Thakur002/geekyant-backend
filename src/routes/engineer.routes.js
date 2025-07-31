const express = require("express");
const { getAllEngineers, getEngineersByProject } = require("../controller/engineer.controller");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, getAllEngineers);
router.get("/by-project/:projectId", authenticateToken, getEngineersByProject);

module.exports = router;