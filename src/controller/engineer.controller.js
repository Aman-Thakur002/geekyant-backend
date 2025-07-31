const { Users, Project, Assignment } = require("../models");

//----------------------<< Get Engineers by Project Skills >>-----------------------------------
const getEngineersByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId).select('requiredSkills');
    if (!project) {
      return res.status(404).send({
        status: "error",
        message: "Project not found",
      });
    }

    const engineers = await Users.find({
      type: 'Engineer',
      deletedAt: null
    }).select('_id name email skills department seniority maxCapacity');

    // Get current allocations for all engineers
    const assignments = await Assignment.find({
      status: 'active',
      engineerId: { $in: engineers.map(e => e._id) }
    }).select('engineerId allocationPercentage');

    const engineersWithMatch = await Promise.all(engineers.map(async engineer => {
      const matchingSkills = engineer.skills?.filter(skill => 
        project.requiredSkills.includes(skill)
      ) || [];
      
      const matchPercentage = project.requiredSkills.length > 0 
        ? Math.round((matchingSkills.length / project.requiredSkills.length) * 100)
        : 0;

      // Calculate current allocation
      const engineerAssignments = assignments.filter(a => a.engineerId.toString() === engineer._id.toString());
      const currentAllocation = engineerAssignments.reduce((sum, a) => sum + (a.allocationPercentage || 0), 0);
      const availableCapacity = Math.max(0, (engineer.maxCapacity || 100) - currentAllocation);

      return {
        ...engineer.toObject(),
        matchingSkills,
        matchPercentage,
        totalRequiredSkills: project.requiredSkills.length,
        currentAllocation,
        availableCapacity
      };
    }));

    // Sort by match percentage (highest first)
    engineersWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).send({
      status: "success",
      data: engineersWithMatch,
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Get All Engineers >>-----------------------------------
const getAllEngineers = async (req, res, next) => {
  try {
    const { skill } = req.query;
    let filter = {
      type: 'Engineer',
      deletedAt: null
    };
    
    if (skill) {
      filter.skills = { $regex: skill, $options: 'i' };
    }
    
    const engineers = await Users.find(filter).select('_id name email skills department seniority maxCapacity employmentType');

    // Get current allocations for all engineers
    const assignments = await Assignment.find({
      status: 'active',
      engineerId: { $in: engineers.map(e => e._id) }
    }).select('engineerId allocationPercentage');

    const engineersWithCapacity = engineers.map(engineer => {
      const engineerAssignments = assignments.filter(a => a.engineerId.toString() === engineer._id.toString());
      const currentAllocation = engineerAssignments.reduce((sum, a) => sum + (a.allocationPercentage || 0), 0);
      const availableCapacity = Math.max(0, (engineer.maxCapacity || 100) - currentAllocation);

      return {
        ...engineer.toObject(),
        currentAllocation,
        availableCapacity
      };
    });

    res.status(200).send({
      status: "success",
      data: engineersWithCapacity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEngineers,
  getEngineersByProject
};