const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  requiredSkills: [{ type: String, required: true }],
  teamSize: { type: Number, required: true },
  status: { type: String, enum: ['planning', 'active', 'completed'], default: 'planning' },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);