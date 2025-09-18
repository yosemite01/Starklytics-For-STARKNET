import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  Users, 
  Tag, 
  X, 
  AlertCircle,
  Trophy,
  FileText,
  Clock,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
// NOTE: All actual token deposit logic should be handled by a backend API for security.

export default function CreateBounty() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    submission_guidelines: '',
    reward_amount: '',
    reward_token: 'STRK',
    deadline: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'expert',
    max_participants: '',
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState('');

  // Calculate platform fee
  const platformFeePercentage = 5.0; // Default 5%
  const rewardAmount = parseFloat(formData.reward_amount) || 0;
  const platformFee = (rewardAmount * platformFeePercentage) / 100;
  const totalCost = rewardAmount + platformFee;

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setError('You must be logged in to create a bounty.');
      return;
    }
    if (profile.role !== 'bounty_creator' && profile.role !== 'admin') {
      setError('Only bounty creators can create bounties. Please update your profile role.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // 1. Create bounty in DB (status: pending_deposit)
      const { data: bounty, error: bountyError } = await supabase
        .from('bounties')
        .insert([{
          creator_id: user.id,
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          submission_guidelines: formData.submission_guidelines,
          reward_amount: parseFloat(formData.reward_amount),
          reward_token: formData.reward_token,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
          difficulty: formData.difficulty,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          tags: formData.tags,
          platform_fee_percentage: platformFeePercentage,
          status: 'pending_deposit'
        }])
        .select()
        .single();
      if (bountyError) throw bountyError;

      // 2. Call backend API to perform deposit with AutoSwappr
      const depositRes = await fetch('/api/deposit-bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bountyId: bounty.id,
          amount: parseFloat(formData.reward_amount),
          token: formData.reward_token,
          creatorWallet: profile.wallet_address,
        })
      });
      if (!depositRes.ok) {
        throw new Error('Failed to deposit bounty funds. Please try again or contact support.');
      }

      // 3. Create bounty on smart contract (if wallet connected)
      if (profile.wallet_address && window.starknet) {
        try {
          const { BountyContractService } = await import('@/integrations/bounty-contract');
          const contractService = new BountyContractService();
          
          // Convert strings to felt252 format (first 31 characters)
          const titleFelt = formData.title.slice(0, 31);
          const descFelt = formData.description.slice(0, 31);
          
          await contractService.createBounty(
            window.starknet,
            titleFelt,
            descFelt,
            formData.reward_amount,
            Math.floor(new Date(formData.deadline).getTime() / 1000),
            parseInt(formData.max_participants) || 100
          );
        } catch (contractError) {
          console.warn('Contract creation failed, continuing with database only:', contractError);
        }
      }

      // 4. Update bounty status to 'active' after successful deposit
      await supabase
        .from('bounties')
        .update({ status: 'active' })
        .eq('id', bounty.id);

      setSuccess('Bounty created and deposit successful! Your bounty is now active.');
      setFormData({
        title: '',
        description: '',
        requirements: '',
        submission_guidelines: '',
        reward_amount: '',
        reward_token: 'STRK',
        deadline: '',
        difficulty: 'medium',
        max_participants: '',
        tags: [],
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="glass border-border max-w-md">
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 text-chart-warning mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              Please sign in to create bounties.
            </p>
            <Button asChild>
              <a href="/auth">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile?.role === 'analyst') {
    return (
      <div className="min-h-screen bg-background">
        <AuthenticatedSidebar />
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <Header title="Create Bounty" subtitle="Post analytics challenges for the community" />
          
          <main className="flex-1 p-6 flex items-center justify-center">
            <Card className="glass border-border max-w-md">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-chart-warning mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Role Update Required</h3>
                <p className="text-muted-foreground mb-4">
                  To create bounties, please update your profile role to "Bounty Creator".
                </p>
                <Button asChild>
                  <a href="/profile">Update Profile</a>
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header 
          title="Create Bounty" 
          subtitle="Post analytics challenges for the community"
        />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6">
                <Trophy className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="glass border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Plus className="w-5 h-5" />
                      <span>Bounty Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Bounty Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g., Starknet DeFi TVL Analysis Dashboard"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe what you want the community to build or analyze..."
                          rows={4}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="requirements">Technical Requirements</Label>
                        <Textarea
                          id="requirements"
                          value={formData.requirements}
                          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                          placeholder="List specific technical requirements, tools, or skills needed..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="submission_guidelines">Submission Guidelines</Label>
                        <Textarea
                          id="submission_guidelines"
                          value={formData.submission_guidelines}
                          onChange={(e) => setFormData({ ...formData, submission_guidelines: e.target.value })}
                          placeholder="How should participants submit their work? What format is expected?"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reward_amount">Reward Amount *</Label>
                          <div className="flex">
                            <Input
                              id="reward_amount"
                              type="number"
                              step="0.01"
                              min="10"
                              max="10000"
                              value={formData.reward_amount}
                              onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })}
                              placeholder="100"
                              required
                            />
                            <Select
                              value={formData.reward_token}
                              onValueChange={(value) => setFormData({ ...formData, reward_token: value })}
                            >
                              <SelectTrigger className="w-24 ml-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STRK">STRK</SelectItem>
                                <SelectItem value="ETH">ETH</SelectItem>
                                <SelectItem value="USDC">USDC</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="difficulty">Difficulty Level *</Label>
                          <Select
                            value={formData.difficulty}
                            onValueChange={(value: 'easy' | 'medium' | 'hard' | 'expert') => 
                              setFormData({ ...formData, difficulty: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deadline">Deadline (Optional)</Label>
                          <Input
                            id="deadline"
                            type="datetime-local"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="max_participants">Max Participants (Optional)</Label>
                          <Input
                            id="max_participants"
                            type="number"
                            min="1"
                            value={formData.max_participants}
                            onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                            placeholder="Unlimited"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex space-x-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a tag"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" variant="outline" onClick={addTag}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                                <Tag className="w-3 h-3" />
                                <span>{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-4 pt-6">
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="glow-primary"
                        >
                          {loading ? 'Creating...' : 'Create Bounty'}
                        </Button>
                        <Button type="button" variant="outline">
                          Save as Draft
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Cost Breakdown */}
                <Card className="glass border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Cost Breakdown</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Reward Amount</span>
                      <span className="font-medium">{rewardAmount} {formData.reward_token}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Platform Fee (5%)</span>
                      <span className="font-medium">{platformFee.toFixed(2)} {formData.reward_token}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Cost</span>
                      <span className="text-primary">{totalCost.toFixed(2)} {formData.reward_token}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Guidelines */}
                <Card className="glass border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Guidelines</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start space-x-2">
                      <Target className="w-4 h-4 mt-0.5 text-chart-primary" />
                      <span>Be specific about deliverables and requirements</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 mt-0.5 text-chart-warning" />
                      <span>Set realistic deadlines for complex tasks</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Users className="w-4 h-4 mt-0.5 text-chart-success" />
                      <span>Consider limiting participants for focused competition</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}