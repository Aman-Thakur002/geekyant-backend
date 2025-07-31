const { Assignment, Users, Project } = require('../models');

// Get all assignments
export async function getAssignments(req, res, next) {
  try {
    let limit = req?.query?.limit ? Number(req.query.limit) : 10;
    let page = req?.query?.page ? Number(req.query.page) : 1;
    let skip = (page - 1) * limit;
    
    let filter = { deletedAt: null };
    
    if (req.query?.engineerId) {
      filter.engineerId = req.query.engineerId;
    }
    
    if (req.query?.projectId) {
      filter.projectId = req.query.projectId;
    }
    
    if (req.query?.status) {
      filter.status = req.query.status;
    }

    let assignments = await Assignment.find(filter)
      .populate('engineerId', 'name email skills')
      .populate('projectId', 'name status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    let count = await Assignment.countDocuments(filter);

    res.status(200).send({
      status: 'success',
      count,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
}

// Get assignment by ID
export async function getAssignmentById(req, res, next) {
  try {
    const assignment = await Assignment.findOne({ 
      _id: req.params.id, 
      deletedAt: null 
    })
    .populate('engineerId', 'name email skills seniority')
    .populate('projectId', 'name description status');
    
    if (!assignment) {
      return res.status(404).send({
        status: 'error',
        message: 'Assignment not found',
      });
    }

    res.status(200).send({
      status: 'success',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

// Create assignment
export async function createAssignment(req, res, next) {
  try {
    const { engineerId, projectId, allocationPercentage, startDate, endDate, role } = req.body;
    
    // Validate engineer exists and is an engineer
    const engineer = await Users.findOne({ 
      _id: engineerId, 
      type: 'Engineer', 
      deletedAt: null 
    });
    if (!engineer) {
      return res.status(404).send({
        status: 'error',
        message: 'Engineer not found',
      });
    }

    // Validate project exists
    const project = await Project.findOne({ 
      _id: projectId, 
      deletedAt: null 
    });
    if (!project) {
      return res.status(404).send({
        status: 'error',
        message: 'Project not found',
      });
    }

    // Check engineer capacity
    const activeAssignments = await Assignment.find({
      engineerId,
      status: 'active',
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
      deletedAt: null
    });

    const totalAllocated = activeAssignments.reduce((sum, assignment) => 
      sum + assignment.allocationPercentage, 0
    );

    if (totalAllocated + allocationPercentage > engineer.maxCapacity) {
      return res.status(400).send({
        status: 'error',
        message: `Engineer capacity exceeded. Available: ${engineer.maxCapacity - totalAllocated}%`,
      });
    }
    
    const assignment = new Assignment({
      engineerId,
      projectId,
      allocationPercentage,
      startDate,
      endDate,
      role
    });
    
    await assignment.save();
    await assignment.populate([
      { path: 'engineerId', select: 'name email' },
      { path: 'projectId', select: 'name' }
    ]);

    res.status(201).send({
      status: 'success',
      message: 'Assignment created successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

// Update assignment
export async function updateAssignment(req, res, next) {
  try {
    const { allocationPercentage, startDate, endDate, role, status } = req.body;
    
    const assignment = await Assignment.findOne({ 
      _id: req.params.id, 
      deletedAt: null 
    });
    
    if (!assignment) {
      return res.status(404).send({
        status: 'error',
        message: 'Assignment not found',
      });
    }

    // If updating allocation, check capacity
    if (allocationPercentage && allocationPercentage !== assignment.allocationPercentage) {
      const engineer = await Users.findById(assignment.engineerId);
      const activeAssignments = await Assignment.find({
        engineerId: assignment.engineerId,
        _id: { $ne: assignment._id },
        status: 'active',
        startDate: { $lte: new Date(endDate || assignment.endDate) },
        endDate: { $gte: new Date(startDate || assignment.startDate) },
        deletedAt: null
      });

      const totalAllocated = activeAssignments.reduce((sum, a) => 
        sum + a.allocationPercentage, 0
      );

      if (totalAllocated + allocationPercentage > engineer.maxCapacity) {
        return res.status(400).send({
          status: 'error',
          message: `Engineer capacity exceeded. Available: ${engineer.maxCapacity - totalAllocated}%`,
        });
      }
    }

    const updateData = {};
    if (allocationPercentage) updateData.allocationPercentage = allocationPercentage;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'engineerId', select: 'name email' },
      { path: 'projectId', select: 'name' }
    ]);

    res.status(200).send({
      status: 'success',
      message: 'Assignment updated successfully',
      data: updatedAssignment,
    });
  } catch (error) {
    next(error);
  }
}

// Delete assignment
export async function deleteAssignment(req, res, next) {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).send({
        status: 'error',
        message: 'Assignment not found',
      });
    }

    res.status(200).send({
      status: 'success',
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

// Get engineer's assignments
export async function getEngineerAssignments(req, res, next) {
  try {
    const assignments = await Assignment.find({
      engineerId: req.params.engineerId,
      deletedAt: null
    })
    .populate('projectId', 'name description status startDate endDate')
    .sort({ startDate: -1 });

    res.status(200).send({
      status: 'success',
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
}