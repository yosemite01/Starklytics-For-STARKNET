// Demo bounties data
const DEMO_BOUNTIES: Bounty[] = [
  {
    _id: '1',
    title: 'Analyze Starknet Transaction Patterns',
    description: 'Create a comprehensive analysis of transaction patterns on Starknet over the last 30 days.',
    reward: { amount: 500, currency: 'STRK' },
    status: 'active',
    priority: 'high',
    category: 'research',
    tags: ['analytics', 'transactions', 'starknet'],
    requirements: [
      { description: 'Analyze transaction volume trends', isCompleted: false },
      { description: 'Identify peak usage times', isCompleted: false },
      { description: 'Create visualization dashboard', isCompleted: false }
    ],
    createdBy: 'creator_123',
    submissions: [],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isPublic: true,
    views: 45,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    _id: '2',
    title: 'DeFi Protocol Usage Analysis',
    description: 'Study the adoption and usage patterns of DeFi protocols on Starknet.',
    reward: { amount: 750, currency: 'STRK' },
    status: 'active',
    priority: 'medium',
    category: 'research',
    tags: ['defi', 'protocols', 'adoption'],
    requirements: [
      { description: 'Compare protocol TVL over time', isCompleted: false },
      { description: 'Analyze user behavior patterns', isCompleted: false }
    ],
    createdBy: 'creator_456',
    submissions: [{ user: 'analyst_789', content: 'Initial analysis draft', attachments: [], submittedAt: new Date(), status: 'pending' }],
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    isPublic: true,
    views: 32,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

export interface Bounty {
  _id: string;
  title: string;
  description: string;
  reward: {
    amount: number;
    currency: string;
  };
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'feature' | 'security' | 'documentation' | 'design' | 'research' | 'other';
  tags: string[];
  requirements: Array<{
    description: string;
    isCompleted: boolean;
  }>;
  createdBy: string;
  assignedTo?: string;
  submissions: Array<{
    user: string;
    content: string;
    attachments: string[];
    submittedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    feedback?: string;
  }>;
  deadline?: Date;
  isPublic: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BountyStats {
  totalBounties: number;
  activeBounties: number;
  completedBounties: number;
  totalRewards: number;
  activeParticipants: number;
  completedThisMonth: number;
}

export class BountyService {
  async getBounties(filters: any = {}): Promise<Bounty[]> {
    try {
      // Get bounties from localStorage or use demo data
      const stored = localStorage.getItem('demo_bounties');
      const bounties = stored ? JSON.parse(stored) : DEMO_BOUNTIES;
      
      // Apply filters
      let filtered = bounties;
      if (filters.status) {
        filtered = filtered.filter((b: Bounty) => b.status === filters.status);
      }
      
      return filtered;
    } catch (error) {
      console.error('Error fetching bounties:', error);
      return DEMO_BOUNTIES;
    }
  }

  async getBounty(id: string): Promise<Bounty | null> {
    try {
      const stored = localStorage.getItem('demo_bounties');
      const bounties = stored ? JSON.parse(stored) : DEMO_BOUNTIES;
      return bounties.find((b: Bounty) => b._id === id) || null;
    } catch (error) {
      console.error('Error fetching bounty:', error);
      return null;
    }
  }

  async createBounty(bountyData: Partial<Bounty>): Promise<Bounty | null> {
    try {
      const stored = localStorage.getItem('demo_bounties');
      const bounties = stored ? JSON.parse(stored) : DEMO_BOUNTIES;
      
      const newBounty: Bounty = {
        _id: Date.now().toString(),
        title: bountyData.title || 'New Bounty',
        description: bountyData.description || '',
        reward: bountyData.reward || { amount: 100, currency: 'STRK' },
        status: 'active',
        priority: bountyData.priority || 'medium',
        category: bountyData.category || 'other',
        tags: bountyData.tags || [],
        requirements: bountyData.requirements || [],
        createdBy: 'demo_user_123',
        submissions: [],
        deadline: bountyData.deadline,
        isPublic: bountyData.isPublic ?? true,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      bounties.push(newBounty);
      localStorage.setItem('demo_bounties', JSON.stringify(bounties));
      
      return newBounty;
    } catch (error) {
      console.error('Error creating bounty:', error);
      throw error;
    }
  }

  async updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | null> {
    try {
      const stored = localStorage.getItem('demo_bounties');
      const bounties = stored ? JSON.parse(stored) : DEMO_BOUNTIES;
      
      const index = bounties.findIndex((b: Bounty) => b._id === id);
      if (index !== -1) {
        bounties[index] = { ...bounties[index], ...updates, updatedAt: new Date() };
        localStorage.setItem('demo_bounties', JSON.stringify(bounties));
        return bounties[index];
      }
      
      return null;
    } catch (error) {
      console.error('Error updating bounty:', error);
      throw error;
    }
  }

  async joinBounty(id: string): Promise<boolean> {
    try {
      // Simulate joining bounty
      console.log(`Joined bounty ${id}`);
      return true;
    } catch (error) {
      console.error('Error joining bounty:', error);
      throw error;
    }
  }

  async submitSolution(id: string, solution: any): Promise<boolean> {
    try {
      // Simulate solution submission
      console.log(`Submitted solution for bounty ${String(id).replace(/[\r\n]/g, '')}`);
      return true;
    } catch (error) {
      console.error('Error submitting solution:', error);
      throw error;
    }
  }

  async selectWinner(id: string, winnerId: string): Promise<boolean> {
    try {
      // Simulate winner selection
      console.log(`Selected winner ${winnerId} for bounty ${id}`);
      return true;
    } catch (error) {
      console.error('Error selecting winner:', error);
      throw error;
    }
  }

  async getStats(): Promise<BountyStats> {
    try {
      const stored = localStorage.getItem('demo_bounties');
      const bounties = stored ? JSON.parse(stored) : DEMO_BOUNTIES;
      
      const activeBounties = bounties.filter((b: Bounty) => b.status === 'active').length;
      const completedBounties = bounties.filter((b: Bounty) => b.status === 'completed').length;
      const totalRewards = bounties.reduce((sum: number, b: Bounty) => sum + b.reward.amount, 0);
      
      return {
        totalBounties: bounties.length,
        activeBounties,
        completedBounties,
        totalRewards,
        activeParticipants: 15, // Demo value
        completedThisMonth: 3, // Demo value
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalBounties: 2,
        activeBounties: 2,
        completedBounties: 0,
        totalRewards: 1250,
        activeParticipants: 15,
        completedThisMonth: 3,
      };
    }
  }
}

export const bountyService = new BountyService();