  // Get completed bounties for user
  async getCompletedBounties(req, res) {
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    try {
      const completedBounties = await Bounty.aggregate([
        // Match completed bounties for the user in the specified month
        {
          $match: {
            status: 'completed',
            'submissions.user': mongoose.Types.ObjectId(req.user.userId),
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        // Unwind submissions to get user-specific submissions
        { $unwind: '$submissions' },
        // Match user's submissions
        {
          $match: {
            'submissions.user': mongoose.Types.ObjectId(req.user.userId),
            'submissions.status': 'approved'
          }
        },
        // Lookup reward information
        {
          $lookup: {
            from: 'rewards',
            let: { bountyId: '$_id', userId: '$submissions.user' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$bountyId', '$$bountyId'] },
                      { $eq: ['$userId', '$$userId'] }
                    ]
                  }
                }
              }
            ],
            as: 'reward'
          }
        },
        // Project required fields
        {
          $project: {
            _id: 1,
            title: 1,
            projectName: 1,
            completedAt: 1,
            submissionUrl: '$submissions.url',
            earnedAmountSTRK: { $first: '$reward.amountSTRK' },
            status: { $first: '$reward.status' }
          }
        },
        // Sort by completion date
        { $sort: { completedAt: -1 } }
      ]);

      // Calculate total earned for the month
      const totalEarned = completedBounties.reduce(
        (sum, bounty) => sum + (bounty.earnedAmountSTRK || 0), 
        0
      );

      res.json({
        success: true,
        data: {
          bounties: completedBounties,
          totalEarned
        }
      });
    } catch (error) {
      logger.error('Error getting completed bounties:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving completed bounties'
      });
    }
  },