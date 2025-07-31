const { Users, Project, Assignment } = require("../models");

//----------------------<< Get Team Analytics >>-----------------------------------
const getTeamAnalytics = async (req, res, next) => {
  try {
    const engineers = await Users.find({ type: 'Engineer', deletedAt: null });
    const projects = await Project.find({ deletedAt: null });
    const assignments = await Assignment.find({ status: 'active' });

    // Skill distribution with engineers
    const skillDistribution = {};
    engineers.forEach(engineer => {
      engineer.skills?.forEach(skill => {
        if (!skillDistribution[skill]) {
          skillDistribution[skill] = { count: 0, engineers: [] };
        }
        skillDistribution[skill].count++;
        skillDistribution[skill].engineers.push({
          _id: engineer._id,
          name: engineer.name,
          department: engineer.department
        });
      });
    });

    // Department distribution with engineers
    const departmentDistribution = {};
    engineers.forEach(engineer => {
      const dept = engineer.department || 'Unassigned';
      if (!departmentDistribution[dept]) {
        departmentDistribution[dept] = { count: 0, engineers: [] };
      }
      departmentDistribution[dept].count++;
      departmentDistribution[dept].engineers.push({
        _id: engineer._id,
        name: engineer.name,
        seniority: engineer.seniority
      });
    });

    // Seniority distribution with engineers
    const seniorityDistribution = {};
    engineers.forEach(engineer => {
      const seniority = engineer.seniority || 'unspecified';
      if (!seniorityDistribution[seniority]) {
        seniorityDistribution[seniority] = { count: 0, engineers: [] };
      }
      seniorityDistribution[seniority].count++;
      seniorityDistribution[seniority].engineers.push({
        _id: engineer._id,
        name: engineer.name,
        department: engineer.department
      });
    });

    // Project status distribution with projects
    const projectStatusDistribution = {};
    projects.forEach(project => {
      const status = project.status || 'unknown';
      if (!projectStatusDistribution[status]) {
        projectStatusDistribution[status] = { count: 0, projects: [] };
      }
      projectStatusDistribution[status].count++;
      projectStatusDistribution[status].projects.push({
        _id: project._id,
        name: project.name,
        teamSize: project.teamSize
      });
    });

    // Utilization stats
    const totalCapacity = engineers.reduce((sum, e) => sum + (e.maxCapacity || 100), 0);
    const totalUtilized = assignments.reduce((sum, a) => sum + (a.allocationPercentage || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (totalUtilized / totalCapacity) * 100 : 0;

    res.status(200).send({
      status: "success",
      data: {
        overview: {
          totalEngineers: engineers.length,
          totalProjects: projects.length,
          activeAssignments: assignments.length,
          utilizationRate: Math.round(utilizationRate)
        },
        skillDistribution: Object.entries(skillDistribution).map(([skill, data]) => ({ skill, ...data })),
        departmentDistribution: Object.entries(departmentDistribution).map(([department, data]) => ({ department, ...data })),
        seniorityDistribution: Object.entries(seniorityDistribution).map(([seniority, data]) => ({ seniority, ...data })),
        projectStatusDistribution: Object.entries(projectStatusDistribution).map(([status, data]) => ({ status, ...data }))
      }
    });
  } catch (error) {
    next(error);
  }
}

//----------------------<< Get Capacity Planning >>-----------------------------------
const getCapacityPlanning = async (req, res, next) => {
  try {
    const engineers = await Users.find({ type: 'Engineer', deletedAt: null });
    const assignments = await Assignment.find({ status: 'active' }).populate('projectId', 'name endDate');

    const engineersWithCapacity = engineers.map(engineer => {
      const engineerAssignments = assignments.filter(a => a.engineerId.toString() === engineer._id.toString());
      const currentAllocation = engineerAssignments.reduce((sum, a) => sum + (a.allocationPercentage || 0), 0);
      const availableCapacity = Math.max(0, (engineer.maxCapacity || 100) - currentAllocation);

      return {
        _id: engineer._id,
        name: engineer.name,
        department: engineer.department,
        seniority: engineer.seniority,
        maxCapacity: 100,
        currentAllocation,
        availableCapacity: Math.max(0, 100 - currentAllocation),
        utilizationPercentage: Math.round((currentAllocation / 100) * 100),
        assignments: engineerAssignments.map(a => ({
          projectName: a.projectId?.name || 'Unknown Project',
          allocation: a.allocationPercentage,
          endDate: a.endDate
        }))
      };
    });

    // Sort by utilization (highest first)
    engineersWithCapacity.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    // Capacity insights
    const overUtilized = engineersWithCapacity.filter(e => e.utilizationPercentage > 100);
    const fullyUtilized = engineersWithCapacity.filter(e => e.utilizationPercentage >= 80 && e.utilizationPercentage <= 100);
    const underUtilized = engineersWithCapacity.filter(e => e.utilizationPercentage < 50);

    res.status(200).send({
      status: "success",
      data: {
        engineers: engineersWithCapacity,
        insights: {
          overUtilized: overUtilized.length,
          fullyUtilized: fullyUtilized.length,
          underUtilized: underUtilized.length,
          totalAvailableCapacity: Math.round(engineersWithCapacity.reduce((sum, e) => sum + e.availableCapacity, 0) / engineersWithCapacity.length)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTeamAnalytics,
  getCapacityPlanning
};