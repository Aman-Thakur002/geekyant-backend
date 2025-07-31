const { Project, Users, Assignment } = require('../models');

// Get all projects
export async function getProjects(req, res, next) {
  try {
    let limit = req?.query?.limit ? Number(req.query.limit) : 10;
    let page = req?.query?.page ? Number(req.query.page) : 1;
    let skip = (page - 1) * limit;
    
    let filter = { deletedAt: null };
    
    if (req.query?.status) {
      filter.status = req.query.status;
    }
    
    if (req.query?.managerId) {
      filter.managerId = req.query.managerId;
    }

    let projects = await Project.find(filter)
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    let count = await Project.countDocuments(filter);

    res.status(200).send({
      status: 'success',
      count,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
}

// Get project by ID
export async function getProjectById(req, res, next) {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      deletedAt: null 
    }).populate('managerId', 'name email');
    
    if (!project) {
      return res.status(404).send({
        status: 'error',
        message: 'Project not found',
      });
    }

    // Get project assignments
    const assignments = await Assignment.find({
      projectId: req.params.id,
      deletedAt: null
    }).populate('engineerId', 'name email skills seniority');

    res.status(200).send({
      status: 'success',
      data: {
        ...project.toObject(),
        assignments
      },
    });
  } catch (error) {
    next(error);
  }
}

// Create project
export async function createProject(req, res, next) {
  try {
    const { name, description, startDate, endDate, requiredSkills, teamSize } = req.body;
    
    const project = new Project({
      name,
      description,
      startDate,
      endDate,
      requiredSkills,
      teamSize,
      managerId: req.user.id
    });
    
    await project.save();
    await project.populate('managerId', 'name email');

    res.status(201).send({
      status: 'success',
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// Update project
export async function updateProject(req, res, next) {
  try {
    const { name, description, startDate, endDate, requiredSkills, teamSize, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (requiredSkills) updateData.requiredSkills = requiredSkills;
    if (teamSize) updateData.teamSize = teamSize;
    if (status) updateData.status = status;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      updateData,
      { new: true }
    ).populate('managerId', 'name email');

    if (!project) {
      return res.status(404).send({
        status: 'error',
        message: 'Project not found',
      });
    }

    res.status(200).send({
      status: 'success',
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// Find suitable engineers for project
export async function findSuitableEngineers(req, res, next) {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      deletedAt: null 
    });
    
    if (!project) {
      return res.status(404).send({
        status: 'error',
        message: 'Project not found',
      });
    }

    const suitableEngineers = await Users.find({
      skills: { $in: project.requiredSkills },
      type: 'Engineer',
      deletedAt: null
    }).select('name email skills seniority maxCapacity department');

    // Calculate available capacity for each engineer
    const engineersWithCapacity = await Promise.all(
      suitableEngineers.map(async (engineer) => {
        const activeAssignments = await Assignment.find({
          engineerId: engineer._id,
          status: 'active',
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
          deletedAt: null
        });

        const totalAllocated = activeAssignments.reduce((sum, assignment) => 
          sum + assignment.allocationPercentage, 0
        );

        return {
          ...engineer.toObject(),
          availableCapacity: engineer.maxCapacity - totalAllocated
        };
      })
    );

    res.status(200).send({
      status: 'success',
      data: engineersWithCapacity,
    });
  } catch (error) {
    next(error);
  }
}

// Delete project
export async function deleteProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).send({
        status: 'error',
        message: 'Project not found',
      });
    }

    // Delete all assignments for this project
    await Assignment.deleteMany({ projectId: req.params.id });
    
    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).send({
      status: 'success',
      message: 'Project and associated assignments deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}