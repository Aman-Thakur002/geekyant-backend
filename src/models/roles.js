const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  accessId: { type: Array, default: [] },
  status: { type: String, default: 'Active' },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Roles', roleSchema);
