const { Users, Project, Assignment } = require('../models');

// Manager Dashboard
export async function getManagerDashboard(req, res, next) {
  try {
    // Team overview with capacity
    const engineers = await Users.find({ 
      type: 'Engineer', 
      deletedAt: null 
    }).select('name email maxCapacity skills seniority');

    const engineersWithCapacity = await Promise.all(
      engineers.map(async (engineer) => {
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
          totalAllocated,
          availableCapacity: engineer.maxCapacity - totalAllocated,
          utilizationPercentage: Math.round((totalAllocated / engineer.maxCapacity) * 100)
        };
      })
    );

    // Project statistics
    const projectStats = await Project.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Active assignments count
    const activeAssignments = await Assignment.countDocuments({
      status: 'active',
      deletedAt: null
    });

    res.status(200).send({
      status: 'success',
      data: {
        teamOverview: engineersWithCapacity,
        projectStats,
        activeAssignments
      }
    });
  } catch (error) {
    next(error);
  }
}

// Engineer Dashboard
export async function getEngineerDashboard(req, res, next) {
  try {
    const engineerId = req.user.id;

    // Current assignments
    const currentAssignments = await Assignment.find({
      engineerId,
      status: 'active',
      deletedAt: null
    }).populate('projectId', 'name description status startDate endDate');

    // Upcoming assignments
    const upcomingAssignments = await Assignment.find({
      engineerId,
      startDate: { $gt: new Date() },
      deletedAt: null
    }).populate('projectId', 'name description status startDate endDate');

    // Engineer capacity
    const engineer = await Users.findById(engineerId);
    const totalAllocated = currentAssignments.reduce((sum, assignment) => 
      sum + assignment.allocationPercentage, 0
    );

    res.status(200).send({
      status: 'success',
      data: {
        currentAssignments,
        upcomingAssignments,
        capacity: {
          maxCapacity: engineer.maxCapacity,
          totalAllocated,
          availableCapacity: engineer.maxCapacity - totalAllocated
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// Team utilization analytics
export async function getTeamAnalytics(req, res, next) {
  try {
    const engineers = await Users.find({ 
      type: 'Engineer', 
      deletedAt: null 
    });

    const analytics = await Promise.all(
      engineers.map(async (engineer) => {
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

        const utilizationPercentage = Math.round((totalAllocated / engineer.maxCapacity) * 100);

        return {
          engineerId: engineer._id,
          name: engineer.name,
          maxCapacity: engineer.maxCapacity,
          totalAllocated,
          utilizationPercentage,
          status: utilizationPercentage > 90 ? 'overloaded' : 
                  utilizationPercentage < 50 ? 'underutilized' : 'optimal'
        };
      })
    );

    // Summary statistics
    const overloaded = analytics.filter(a => a.status === 'overloaded').length;
    const underutilized = analytics.filter(a => a.status === 'underutilized').length;
    const optimal = analytics.filter(a => a.status === 'optimal').length;

    res.status(200).send({
      status: 'success',
      data: {
        analytics,
        summary: {
          total: engineers.length,
          overloaded,
          underutilized,
          optimal
        }
      }
    });
  } catch (error) {
    next(error);
  }
}