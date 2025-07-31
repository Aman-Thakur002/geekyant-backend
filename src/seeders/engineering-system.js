const mongoose = require('mongoose');
const { Users, Project, Assignment } = require('../models');
const bcrypt = require('bcrypt');
require('dotenv').config();

const seedEngineeringSystem = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/geekyants_task');
    
    // Create Manager
    const manager = new Users({
      name: 'John Manager',
      email: 'manager@company.com',
      password: 'manager123',
      type: 'Manager',
      isVerified: true
    });
    await manager.save();

    // Create Engineers
    const hashedEngineerPassword = await bcrypt.hash('engineer123', 10);
    const engineers = [
      {
        name: 'Alice Johnson',
        email: 'alice@company.com',
        password: hashedEngineerPassword,
        type: 'Engineer',
        skills: ['React', 'Node.js', 'MongoDB'],
        seniority: 'senior',
        maxCapacity: 100,
        department: 'Frontend',
        employmentType: 'full-time',
        isVerified: true
      },
      {
        name: 'Bob Smith',
        email: 'bob@company.com',
        password: hashedEngineerPassword,
        type: 'Engineer',
        skills: ['Python', 'Django', 'PostgreSQL'],
        seniority: 'mid',
        maxCapacity: 100,
        department: 'Backend',
        employmentType: 'full-time',
        isVerified: true
      },
      {
        name: 'Carol Davis',
        email: 'carol@company.com',
        password: hashedEngineerPassword,
        type: 'Engineer',
        skills: ['React', 'TypeScript', 'GraphQL'],
        seniority: 'junior',
        maxCapacity: 50,
        department: 'Frontend',
        employmentType: 'part-time',
        isVerified: true
      },
      {
        name: 'David Wilson',
        email: 'david@company.com',
        password: hashedEngineerPassword,
        type: 'Engineer',
        skills: ['Node.js', 'Express', 'MongoDB', 'AWS'],
        seniority: 'senior',
        maxCapacity: 100,
        department: 'DevOps',
        employmentType: 'full-time',
        isVerified: true
      }
    ];

    const createdEngineers = await Users.insertMany(engineers);

    // Create Projects
    const projects = [
      {
        name: 'E-commerce Platform',
        description: 'Build a modern e-commerce platform with React and Node.js',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        requiredSkills: ['React', 'Node.js', 'MongoDB'],
        teamSize: 3,
        status: 'active',
        managerId: manager._id
      },
      {
        name: 'Mobile App Backend',
        description: 'API development for mobile application',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        requiredSkills: ['Python', 'Django', 'PostgreSQL'],
        teamSize: 2,
        status: 'active',
        managerId: manager._id
      },
      {
        name: 'Analytics Dashboard',
        description: 'Real-time analytics dashboard with GraphQL',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-08-31'),
        requiredSkills: ['React', 'TypeScript', 'GraphQL'],
        teamSize: 2,
        status: 'planning',
        managerId: manager._id
      },
      {
        name: 'Cloud Migration',
        description: 'Migrate existing infrastructure to AWS',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-04-15'),
        requiredSkills: ['AWS', 'Node.js', 'MongoDB'],
        teamSize: 2,
        status: 'active',
        managerId: manager._id
      }
    ];

    const createdProjects = await Project.insertMany(projects);

    // Create Assignments
    const assignments = [
      {
        engineerId: createdEngineers[0]._id, // Alice
        projectId: createdProjects[0]._id, // E-commerce Platform
        allocationPercentage: 60,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        role: 'Tech Lead',
        status: 'active'
      },
      {
        engineerId: createdEngineers[1]._id, // Bob
        projectId: createdProjects[1]._id, // Mobile App Backend
        allocationPercentage: 80,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        role: 'Backend Developer',
        status: 'active'
      },
      {
        engineerId: createdEngineers[2]._id, // Carol
        projectId: createdProjects[0]._id, // E-commerce Platform
        allocationPercentage: 40,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        role: 'Frontend Developer',
        status: 'active'
      },
      {
        engineerId: createdEngineers[3]._id, // David
        projectId: createdProjects[3]._id, // Cloud Migration
        allocationPercentage: 70,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-04-15'),
        role: 'DevOps Engineer',
        status: 'active'
      },
      {
        engineerId: createdEngineers[0]._id, // Alice
        projectId: createdProjects[2]._id, // Analytics Dashboard
        allocationPercentage: 30,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-08-31'),
        role: 'Frontend Lead',
        status: 'active'
      },
      {
        engineerId: createdEngineers[3]._id, // David
        projectId: createdProjects[0]._id, // E-commerce Platform
        allocationPercentage: 20,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        role: 'Infrastructure Support',
        status: 'active'
      }
    ];

    await Assignment.insertMany(assignments);

    console.log('Engineering system seeded successfully');
    console.log('Manager:', manager.email, 'password: manager123');
    console.log('Engineers created:', createdEngineers.length);
    console.log('Projects created:', createdProjects.length);
    console.log('Assignments created:', assignments.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding engineering system:', error);
    process.exit(1);
  }
};

seedEngineeringSystem();