const Bounty = require('../models/Bounty');
const User = require('../models/User');

// Get bounty statistics
const getBountyStats = async (req, res) => {
  try {
    // Get total bounties
    const totalBounties = await Bounty.countDocuments();
    
    // Get active bounties
    const activeBounties = await Bounty.countDocuments({ status: 'active' });
    
    // Get completed bounties
    const completedBounties = await Bounty.countDocuments({ status: 'completed' });
    
    // Get total rewards (sum of all active bounty rewards)
    const rewardAggregation = await Bounty.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, totalRewards: { $sum: '$reward.amount' } } }
    ]);
    const totalRewards = rewardAggregation.length > 0 ? rewardAggregation[0].totalRewards : 0;
    
    // Get active participants (users who have submitted to active bounties)
    const activeParticipants = await Bounty.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$submissions' },
      { $group: { _id: '$submissions.user' } },
      { $count: 'activeParticipants' }
    ]);
    const activeParticipantsCount = activeParticipants.length > 0 ? activeParticipants[0].activeParticipants : 0;
    
    // Get completed bounties this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const completedThisMonth = await Bounty.countDocuments({
      status: 'completed',
      updatedAt: { $gte: startOfMonth }
    });

    res.json({
      success: true,
      data: {
        totalBounties,
        activeBounties,
        completedBounties,
        totalRewards,
        activeParticipants: activeParticipantsCount,
        completedThisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching bounty stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bounty statistics',
      error: error.message
    });
  }
};

module.exports = {
  getBountyStats
};