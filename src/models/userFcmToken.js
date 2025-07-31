const mongoose = require('mongoose');

const userFcmTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  fcmToken: { type: String },
  deviceType: { type: String, enum: ['Android', 'iOS', 'Web'] },
  status: { type: String, default: 'Active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserFcmTokens', userFcmTokenSchema);
