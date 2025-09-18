import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Wallet, 
  Trophy, 
  TrendingUp, 
  Edit, 
  Save, 
  X,
  Star,
  DollarSign,
  Award,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  token: string;
  status: string;
  description: string;
  created_at: string;
}

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    wallet_address: profile?.wallet_address || '',
    role: profile?.role || 'analyst',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        wallet_address: profile.wallet_address || '',
        role: profile.role || 'analyst',
      });
    }
  }, [profile]);

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await updateProfile(formData);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Profile updated successfully!');
        setEditing(false);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        wallet_address: profile.wallet_address || '',
        role: profile.role || 'analyst',
      });
    }
    setEditing(false);
    setError('');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'bounty_creator':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'analyst':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-chart-success';
      case 'pending':
        return 'text-chart-warning';
      case 'failed':
        return 'text-chart-error';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header 
          title="Profile" 
          subtitle="Manage your account settings and view activity"
        />
        
        <main className="flex-1 p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                  {!editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {editing && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                        className="glow-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!editing}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wallet_address">Wallet Address</Label>
                    <Input
                      id="wallet_address"
                      value={formData.wallet_address}
                      onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                      disabled={!editing}
                      placeholder="0x..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    {editing ? (
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant={formData.role === 'analyst' ? 'default' : 'outline'}
                          onClick={() => setFormData({ ...formData, role: 'analyst' })}
                          className={formData.role === 'analyst' ? 'glow-primary' : ''}
                        >
                          Analyst
                        </Button>
                        <Button
                          type="button"
                          variant={formData.role === 'bounty_creator' ? 'default' : 'outline'}
                          onClick={() => setFormData({ ...formData, role: 'bounty_creator' })}
                          className={formData.role === 'bounty_creator' ? 'glow-primary' : ''}
                        >
                          Bounty Creator
                        </Button>
                      </div>
                    ) : (
                      <Badge className={`${getRoleColor(formData.role)} text-white border-0`}>
                        {formData.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="pt-4">
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="w-5 h-5" />
                    <span>Recent Transactions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No transactions yet. Start participating in bounties to see your transaction history!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium capitalize">
                                {transaction.transaction_type.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {transaction.amount} {transaction.token}
                            </p>
                            <p className={`text-xs capitalize ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              {/* Profile Stats */}
              <Card className="glass border-border">
                <CardHeader className="pb-3">
                  <CardTitle>Account Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <Badge className={`${getRoleColor(profile.role)} text-white border-0`}>
                      {profile.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Earnings</span>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-chart-success" />
                      <span className="font-semibold text-chart-success">
                        {profile.total_earnings} STRK
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reputation</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-chart-warning" />
                      <span className="font-semibold">
                        {profile.reputation_score}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Verified</span>
                    <Badge variant={profile.email_verified ? 'secondary' : 'outline'}>
                      {profile.email_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>

                  {profile.wallet_address && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Wallet className="w-4 h-4 mr-1" />
                          Connected Wallet
                        </span>
                        <p className="text-xs font-mono bg-muted/30 p-2 rounded break-all">
                          {profile.wallet_address}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="glass border-border">
                <CardHeader className="pb-3">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="w-4 h-4 mr-2" />
                    View My Bounties
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="w-4 h-4 mr-2" />
                    Achievements
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet Settings
                  </Button>
                  <Separator />
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={signOut}
                  >
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}