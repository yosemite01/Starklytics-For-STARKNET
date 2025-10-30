const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  rewardId: {
    type: String,
    unique: true,
    required: true,
    default: () => `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bountyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bounty',
    required: true
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  },
  amountSTRK: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'STRK'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'failed'],
    default: 'pending'
  },
  transactionHash: String,
  paidAt: Date,
  earnedAt: {
    type: Date,
    default: Date.now
  },
  projectName: String,
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
rewardSchema.index({ userId: 1, earnedAt: -1 });
rewardSchema.index({ bountyId: 1 });
rewardSchema.index({ status: 1 });
rewardSchema.index({ earnedAt: -1 });
rewardSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Reward', rewardSchema);
