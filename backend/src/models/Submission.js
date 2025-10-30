const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    unique: true,
    required: true,
    default: () => `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
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
  queryUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  dashboardUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  comment: {
    type: String,
    maxlength: [250, 'Comment cannot exceed 250 words'],
    trim: true
  },
  wordCount: {
    type: Number,
    default: 0
  },
  attachments: [{
    fileName: String,
    fileSize: Number,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feedback: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
submissionSchema.index({ bountyId: 1, userId: 1 });
submissionSchema.index({ bountyId: 1, status: 1 });
submissionSchema.index({ userId: 1, status: 1 });
submissionSchema.index({ createdAt: -1 });
submissionSchema.index({ status: 1 });

// Pre-save middleware to calculate word count
submissionSchema.pre('save', function(next) {
  if (this.comment) {
    const words = this.comment.trim().split(/\s+/).filter(w => w.length > 0).length;
    this.wordCount = words;
  }
  next();
});

module.exports = mongoose.model('Submission', submissionSchema);
