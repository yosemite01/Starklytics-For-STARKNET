import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, DollarSign, Users, Plus } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { handleSupabaseError, getUserFriendlyMessage } from '@/utils/errorHandler';
import { useToast } from '@/components/ui/use-toast';

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  reward_token: string;
  deadline: string | null;
  status: string;
  current_participants: number;
  max_participants: number | null;
  difficulty: string;
  creator_id: string;
}

interface Stats {
  activeBounties: number;
  totalRewards: number;
  activeParticipants: number;
  completedThisMonth: number;
}

const Bounties = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [stats, setStats] = useState<Stats>({
    activeBounties: 0,
    totalRewards: 0,
    activeParticipants: 0,
    completedThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBounties();
    fetchStats();
  }, []);

  const fetchBounties = async () => {
    try {
      const { data, error } = await supabase
        .from('bounties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBounties(data || []);
    } catch (error: any) {
      console.error('Error fetching bounties:', error);
      toast({
        title: "Error loading bounties",
        description: getUserFriendlyMessage(handleSupabaseError(error)),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get active bounties count
      const { count: activeBountiesCount } = await supabase
        .from('bounties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total rewards
      const { data: rewardsData } = await supabase
        .from('bounties')
        .select('reward_amount')
        .eq('status', 'active');

      const totalRewards = rewardsData?.reduce((sum, bounty) => sum + bounty.reward_amount, 0) || 0;

      // Get active participants count
      const { count: participantsCount } = await supabase
        .from('bounty_participants')
        .select('*', { count: 'exact', head: true });

      // Get completed this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: completedThisMonthCount } = await supabase
        .from('bounties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', startOfMonth.toISOString());

      setStats({
        activeBounties: activeBountiesCount || 0,
        totalRewards: totalRewards,
        activeParticipants: participantsCount || 0,
        completedThisMonth: completedThisMonthCount || 0
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error loading statistics",
        description: getUserFriendlyMessage(handleSupabaseError(error)),
        variant: "destructive",
      });
    }
  };

  const handleJoinBounty = async (bountyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bounty_participants')
        .insert([{
          bounty_id: bountyId,
          participant_id: user.id
        }]);

      if (error) throw error;

      // Refresh bounties to update participant count
      fetchBounties();
    } catch (error: any) {
      console.error('Error joining bounty:', error);
      toast({
        title: "Error joining bounty",
        description: getUserFriendlyMessage(handleSupabaseError(error)),
        variant: "destructive",
      });
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'No deadline';
    return new Date(deadline).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <AuthenticatedSidebar />
        <div className="flex-1">
          <Header 
            title="Analytics Bounties" 
            subtitle="Contribute to Starknet analytics and earn rewards"
          />
          
          <main className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-8 h-8 text-chart-warning" />
                    <div>
                      <p className="text-2xl font-bold">{stats.activeBounties}</p>
                      <p className="text-xs text-muted-foreground">Active Bounties</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-8 h-8 text-chart-success" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalRewards.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Rewards (STRK)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-chart-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.activeParticipants}</p>
                      <p className="text-xs text-muted-foreground">Active Participants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-8 h-8 text-chart-secondary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
                      <p className="text-xs text-muted-foreground">Completed This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Create Bounty CTA */}
            {profile?.role === 'bounty_creator' || profile?.role === 'admin' ? (
              <Card className="glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Ready to post a new challenge?</h3>
                      <p className="text-muted-foreground">
                        Create a bounty and let the community solve your analytics needs.
                      </p>
                    </div>
                    <Button asChild className="glow-primary">
                      <Link to="/create-bounty">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Bounty
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Bounties List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : bounties.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active bounties yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to create a bounty and start the analytics revolution!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bounties.map((bounty) => (
                  <Card key={bounty.id} className="glass hover:shadow-elevated transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">{bounty.title}</CardTitle>
                          <p className="text-muted-foreground">{bounty.description}</p>
                        </div>
                        <Badge 
                          variant={bounty.status === "active" ? "default" : "secondary"}
                          className={bounty.status === "active" ? "glow-primary" : ""}
                        >
                          {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-chart-success" />
                            <span className="font-semibold text-chart-success">
                              {bounty.reward_amount} {bounty.reward_token}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Due {formatDeadline(bounty.deadline)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {bounty.current_participants} participant{bounty.current_participants !== 1 ? 's' : ''}
                              {bounty.max_participants ? ` / ${bounty.max_participants}` : ''}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {bounty.difficulty}
                          </Badge>
                        </div>
                        <Button 
                          onClick={() => handleJoinBounty(bounty.id)}
                          disabled={bounty.status !== "active" || bounty.creator_id === user?.id}
                          className={bounty.status === "active" ? "glow-primary" : ""}
                        >
                          {bounty.creator_id === user?.id ? "Your Bounty" : 
                           bounty.status === "active" ? "Join Bounty" : "View Results"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Bounties;