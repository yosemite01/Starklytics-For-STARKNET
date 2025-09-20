const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not Google user
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  googleId: {
    type: String,
    sparse: true, // Allow null values but ensure uniqueness when present
    unique: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'creator', 'analyst'],
      message: 'Role must be admin, creator, or analyst'
    },
    default: 'analyst'
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  profilePicture: {
    type: String, // URL to profile picture
    validate: {
      validator: function(url) {
        return !url || /^https?:\/\/.+/.test(url);
      },
      message: 'Profile picture must be a valid URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: function() {
      return this.authProvider === 'google'; // Google users are pre-verified
    }
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.googleId;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
//
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
// userSchema.index({ googleId: 1 }); 
userSchema.index({ authProvider: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.email;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error('User has no password set (Google OAuth user)');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email, isActive: true }).select('+password +refreshToken');
};

// Static method to find user by Google ID
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId, isActive: true });
};

// Static method to find or create Google user
userSchema.statics.findOrCreateGoogleUser = async function(googleProfile, role = 'analyst') {
  try {
    let user = await this.findByGoogleId(googleProfile.googleId);

    if (user) {
      user.firstName = googleProfile.firstName || user.firstName;
      user.lastName = googleProfile.lastName || user.lastName;
      user.profilePicture = googleProfile.profilePicture || user.profilePicture;
      user.isEmailVerified = googleProfile.isEmailVerified || user.isEmailVerified;
      await user.save();
      return user;
    }

    user = await this.findOne({ email: googleProfile.email, isActive: true });
    if (user) {
      user.googleId = googleProfile.googleId;
      user.authProvider = 'google';
      user.firstName = googleProfile.firstName || user.firstName;
      user.lastName = googleProfile.lastName || user.lastName;
      user.profilePicture = googleProfile.profilePicture || user.profilePicture;
      user.isEmailVerified = true;
      await user.save();
      return user;
    }

    user = new this({
      email: googleProfile.email,
      googleId: googleProfile.googleId,
      authProvider: 'google',
      firstName: googleProfile.firstName,
      lastName: googleProfile.lastName,
      profilePicture: googleProfile.profilePicture,
      role: role,
      isEmailVerified: googleProfile.isEmailVerified
    });

    await user.save();
    return user;
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw new Error(`User with this ${field} already exists`);
    }
    throw error;
  }
};

// Static method to get user statistics by role
userSchema.statics.getUserStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get authentication provider statistics
userSchema.statics.getAuthProviderStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$authProvider', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('User', userSchema);
