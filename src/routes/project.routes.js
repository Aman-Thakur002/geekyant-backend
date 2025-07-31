const express = require('express');
const router = express.Router();
const auth  = require('../middleware/auth');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  findSuitableEngineers,
  deleteProject
} = require('../controller/project.controller');

router.get('/',auth.ensureAuth("Manager","Engineer"), getProjects);
router.get('/:id',auth.ensureAuth("Manager","Engineer"), getProjectById);
router.post('/',auth.ensureAuth("Manager","Engineer"), createProject);
router.put('/:id',auth.ensureAuth("Manager","Engineer"), updateProject);
router.get('/:id/suitable-engineers',auth.ensureAuth("Manager","Engineer"), findSuitableEngineers);
router.delete('/:id',auth.ensureAuth("Manager","Engineer"), deleteProject);

module.exports = router;