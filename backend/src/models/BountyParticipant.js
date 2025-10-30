const mongoose = require('mongoose');

const bountyParticipantSchema = new mongoose.Schema({
  bountyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bounty',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['joined', 'submitted', 'approved', 'rejected', 'completed'],
    default: 'joined'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  submissionCount: {
    type: Number,
    default: 0
  },
  lastSubmissionAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique participant per bounty
bountyParticipantSchema.index({ bountyId: 1, userId: 1 }, { unique: true });
bountyParticipantSchema.index({ bountyId: 1 });
bountyParticipantSchema.index({ userId: 1 });
bountyParticipantSchema.index({ status: 1 });

module.exports = mongoose.model('BountyParticipant', bountyParticipantSchema);
