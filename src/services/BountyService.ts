import { SupabaseClient } from '@supabase/supabase-js';
import { AutoSwapprService } from './AutoSwapprService';
import { NotificationService } from './NotificationService';
import { rateLimiters } from '@/middleware/rateLimiter';

export interface Bounty {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward_amount: number;
  reward_token: string;
  deadline: string;
  status: 'pending_deposit' | 'active' | 'completed' | 'cancelled';
  creator_id: string;
  winner_id?: string;
  created_at: string;
  updated_at: string;
}

export class BountyService {
  private supabase: SupabaseClient;
  private autoSwappr: AutoSwapprService;
  private notifications: NotificationService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.autoSwappr = new AutoSwapprService();
    this.notifications = new NotificationService();
  }

  async createBounty(bounty: Omit<Bounty, 'id' | 'created_at' | 'updated_at' | 'status'>, userEmail: string) {
    // Rate limiting
    const rateCheck = rateLimiters.bounty.isAllowed(bounty.creator_id);
    if (!rateCheck.allowed) throw new Error('Rate limit exceeded');

    const { data, error } = await this.supabase
      .from('bounties')
      .insert({ ...bounty, status: 'pending_deposit' })
      .select()
      .single();

    if (error) throw error;

    // Trigger deposit process
    await this.depositBountyFunds(data.id, bounty.reward_amount.toString(), bounty.reward_token, bounty.creator_id);
    
    // Send notification
    await this.notifications.notifyBountyCreated(data.id, userEmail, bounty.title, bounty.reward_amount.toString());
    
    return data;
  }

  async getBounties(status?: string) {
    let query = this.supabase
      .from('bounties')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getBountyById(id: string) {
    const { data, error } = await this.supabase
      .from('bounties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async selectWinner(bountyId: string, winnerId: string, winnerEmail: string) {
    const bounty = await this.getBountyById(bountyId);
    
    // Process payout
    const payoutResult = await this.autoSwappr.payoutBountyReward({
      bountyId,
      winnerAddress: winnerId,
      amount: bounty.reward_amount.toString(),
      token: bounty.reward_token
    });

    if (!payoutResult.success) throw new Error('Payout failed');

    const { data, error } = await this.supabase
      .from('bounties')
      .update({ status: 'completed', winner_id: winnerId, payout_tx_hash: payoutResult.txHash })
      .eq('id', bountyId)
      .select()
      .single();

    if (error) throw error;

    // Send notification
    await this.notifications.notifyBountyCompleted(winnerEmail, bounty.title, bounty.reward_amount.toString());
    
    return data;
  }

  private async depositBountyFunds(bountyId: string, amount: string, token: string, creatorId: string) {
    const depositResult = await this.autoSwappr.depositBountyFunds({
      bountyId,
      amount,
      token,
      creatorAddress: creatorId
    });

    if (depositResult.success) {
      await this.supabase
        .from('bounties')
        .update({ status: 'active', deposit_tx_hash: depositResult.txHash })
        .eq('id', bountyId);
    }

    return depositResult;
  }

  async joinBounty(bountyId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('bounty_participants')
      .insert({
        bounty_id: bountyId,
        user_id: userId,
        status: 'joined'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async submitSolution(bountyId: string, userId: string, solutionText: string, solutionUrl?: string) {
    const { data, error } = await this.supabase
      .from('bounty_submissions')
      .insert({
        bounty_id: bountyId,
        user_id: userId,
        solution_text: solutionText,
        solution_url: solutionUrl,
        status: 'submitted'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getBountySubmissions(bountyId: string) {
    const { data, error } = await this.supabase
      .from('bounty_submissions')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('bounty_id', bountyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}