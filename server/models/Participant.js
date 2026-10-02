const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  collegeName: { type: String, required: true },
  department: { type: String, required: true },
  participantId: { type: String, required: true, unique: true },
  participantPin: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Participant', participantSchema);
