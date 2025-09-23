import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, DollarSign, Users, Plus } from "lucide-react";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/use-toast';
import { bountyService, type Bounty, type BountyStats } from '@/services/BountyService';



const Bounties = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [stats, setStats] = useState<BountyStats>({
    totalBounties: 0,
    activeBounties: 0,
    completedBounties: 0,
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
      const data = await bountyService.getBounties({ status: 'active' });
      setBounties(data);
    } catch (error: any) {
      console.error('Error fetching bounties:', error);
      toast({
        title: "Error loading bounties",
        description: error.message || 'Failed to load bounties',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await bountyService.getStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error loading statistics",
        description: error.message || 'Failed to load statistics',
        variant: "destructive",
      });
    }
  };

  const handleJoinBounty = async (bountyId: string) => {
    if (!user) return;

    const bounty = bounties.find(b => b._id === bountyId);
    if (!bounty) return;

    try {
      await bountyService.joinBounty(bountyId);
      
      toast({
        title: "Successfully Joined Bounty!",
        description: `You've joined "${bounty.title}" - Reward: ${bounty.reward.amount} ${bounty.reward.currency}`,
      });
      
      // Show detailed bounty info
      setSelectedBounty(bounty);
      
      // Refresh bounties to update participant count
      fetchBounties();
    } catch (error: any) {
      console.error('Error joining bounty:', error);
      toast({
        title: "Error joining bounty",
        description: error.message || 'Failed to join bounty',
        variant: "destructive",
      });
    }
  };

  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);

  const formatDeadline = (deadline: Date | undefined) => {
    if (!deadline) return 'No deadline';
    return new Date(deadline).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthenticatedSidebar />
      <div className="lg:ml-64">
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
            {profile?.role === 'creator' || profile?.role === 'admin' ? (
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
                  <Card key={bounty._id} className="glass hover:shadow-elevated transition-all">
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
                              {bounty.reward.amount} {bounty.reward.currency}
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
                              {bounty.submissions.length} submission{bounty.submissions.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {bounty.priority}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline"
                            onClick={() => setSelectedBounty(bounty)}
                            size="sm"
                          >
                            View Details
                          </Button>
                          <Button 
                            onClick={() => handleJoinBounty(bounty._id)}
                            disabled={bounty.status !== "active" || bounty.createdBy === user?._id}
                            className={bounty.status === "active" ? "glow-primary" : ""}
                            size="sm"
                          >
                            {bounty.createdBy === user?._id ? "Your Bounty" : 
                             bounty.status === "active" ? "Join Bounty" : "View Results"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Bounty Details Modal */}
            {selectedBounty && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="glass max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{selectedBounty.title}</CardTitle>
                        <Badge 
                          variant={selectedBounty.status === "active" ? "default" : "secondary"}
                          className={selectedBounty.status === "active" ? "glow-primary mt-2" : "mt-2"}
                        >
                          {selectedBounty.status.charAt(0).toUpperCase() + selectedBounty.status.slice(1)}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedBounty(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">{selectedBounty.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-1">Reward</h4>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-chart-success" />
                          <span className="font-semibold text-chart-success">
                            {selectedBounty.reward.amount} {selectedBounty.reward.currency}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Deadline</h4>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{formatDeadline(selectedBounty.deadline)}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Priority</h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {selectedBounty.priority}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Submissions</h4>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {selectedBounty.submissions.length} submission{selectedBounty.submissions.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedBounty.requirements && selectedBounty.requirements.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Requirements</h3>
                        <ul className="space-y-1">
                          {selectedBounty.requirements.map((req, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedBounty(null)}
                      >
                        Close
                      </Button>
                      <Button 
                        onClick={() => {
                          handleJoinBounty(selectedBounty._id);
                          setSelectedBounty(null);
                        }}
                        disabled={selectedBounty.status !== "active" || selectedBounty.createdBy === user?._id}
                        className={selectedBounty.status === "active" ? "glow-primary" : ""}
                      >
                        {selectedBounty.createdBy === user?._id ? "Your Bounty" : 
                         selectedBounty.status === "active" ? "Join This Bounty" : "View Results"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
      </div>
    </div>
  );
};

export default Bounties;