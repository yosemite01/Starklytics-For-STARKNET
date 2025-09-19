const mongoose = require('mongoose');

const bountySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Bounty title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Bounty description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  reward: {
    amount: {
      type: Number,
      required: [true, 'Reward amount is required'],
      min: [0, 'Reward amount must be positive']
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      enum: {
        values: ['USD', 'EUR', 'GBP', 'ETH', 'BTC'],
        message: 'Currency must be USD, EUR, GBP, ETH, or BTC'
      },
      default: 'USD'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'completed', 'cancelled', 'expired'],
      message: 'Status must be draft, active, completed, cancelled, or expired'
    },
    default: 'draft'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Priority must be low, medium, high, or critical'
    },
    default: 'medium'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['bug', 'feature', 'security', 'documentation', 'design', 'research', 'other'],
      message: 'Invalid category'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  requirements: [{
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Requirement description cannot exceed 500 characters']
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submissions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    attachments: [String], // URLs to files
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    feedback: String
  }],
  deadline: {
    type: Date,
    validate: {
      validator: function(deadline) {
        return !deadline || deadline > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
bountySchema.index({ status: 1, isPublic: 1 });
bountySchema.index({ createdBy: 1, status: 1 });
bountySchema.index({ assignedTo: 1 });
bountySchema.index({ category: 1, status: 1 });
bountySchema.index({ tags: 1 });
bountySchema.index({ deadline: 1 });
bountySchema.index({ 'reward.amount': -1 }); // For sorting by reward
bountySchema.index({ createdAt: -1 }); // For sorting by newest

// Text search index
bountySchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
});

// Compound index for filtering and sorting
bountySchema.index({ 
  status: 1, 
  isPublic: 1, 
  createdAt: -1 
});

// Virtual for submission count
bountySchema.virtual('submissionCount').get(function() {
  return this.submissions ? this.submissions.length : 0;
});

// Virtual for completion percentage
bountySchema.virtual('completionPercentage').get(function() {
  if (!this.requirements || this.requirements.length === 0) return 0;
  
  const completed = this.requirements.filter(req => req.isCompleted).length;
  return Math.round((completed / this.requirements.length) * 100);
});

// Virtual for time remaining
bountySchema.virtual('timeRemaining').get(function() {
  if (!this.deadline) return null;
  
  const now = new Date();
  const timeLeft = this.deadline - now;
  
  if (timeLeft <= 0) return 'Expired';
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
});

// Pre-save middleware to auto-update status based on deadline
bountySchema.pre('save', function(next) {
  if (this.deadline && this.deadline <= new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Instance method to increment views
bountySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to add submission
bountySchema.methods.addSubmission = function(submission) {
  this.submissions.push(submission);
  return this.save();
};

// Static method for search with filters
bountySchema.statics.search = function(searchTerm, filters = {}) {
  const query = { isPublic: true, ...filters };
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  return this.find(query)
    .populate('createdBy', 'email firstName lastName')
    .populate('assignedTo', 'email firstName lastName')
    .select('-submissions.content -submissions.feedback')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
};

// Static method to get bounty statistics
bountySchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalReward: { $sum: '$reward.amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('Bounty', bountySchema);