import { useState, useEffect } from "react";
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Trophy, 
  DollarSign, 
  Activity, 
  Shield, 
  Ban, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { bountyService } from "@/services/BountyService";
import { useAuth } from "@/contexts/AuthContext";

interface AdminStats {
  totalUsers: number;
  totalBounties: number;
  totalRewards: number;
  pendingApprovals: number;
  flaggedContent: number;
  activeReports: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  joinDate: string;
  lastActive: string;
}

interface Report {
  id: string;
  type: 'bounty' | 'user' | 'content';
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reportedBy: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBounties: 0,
    totalRewards: 0,
    pendingApprovals: 0,
    flaggedContent: 0,
    activeReports: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [bounties, setBounties] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch bounties
      const bountiesData = await bountyService.getBounties();
      setBounties(bountiesData);

      // Mock users data
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'analyst@starklytics.com',
          role: 'analyst',
          status: 'active',
          joinDate: '2025-01-15',
          lastActive: '2025-01-20'
        },
        {
          id: '2',
          email: 'creator@starklytics.com',
          role: 'creator',
          status: 'active',
          joinDate: '2025-01-10',
          lastActive: '2025-01-19'
        }
      ];
      setUsers(mockUsers);

      // Mock reports data
      const mockReports: Report[] = [
        {
          id: '1',
          type: 'bounty',
          targetId: 'bounty-1',
          reason: 'Inappropriate content',
          status: 'pending',
          reportedBy: 'user@example.com',
          createdAt: '2025-01-20'
        }
      ];
      setReports(mockReports);

      // Calculate stats
      const totalRewards = bountiesData.reduce((sum, b) => sum + b.reward.amount, 0);
      const pendingBounties = bountiesData.filter(b => b.status === 'pending').length;
      
      setStats({
        totalUsers: mockUsers.length,
        totalBounties: bountiesData.length,
        totalRewards,
        pendingApprovals: pendingBounties,
        flaggedContent: mockReports.filter(r => r.status === 'pending').length,
        activeReports: mockReports.length
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (userId: string, action: 'suspend' | 'activate' | 'ban') => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: action === 'activate' ? 'active' : action === 'suspend' ? 'suspended' : 'banned' }
        : user
    ));
  };

  const handleBountyAction = (bountyId: string, action: 'approve' | 'reject') => {
    setBounties(prev => prev.map(bounty => 
      bounty._id === bountyId 
        ? { ...bounty, status: action === 'approve' ? 'active' : 'rejected' }
        : bounty
    ));
  };

  const handleReportAction = (reportId: string, action: 'resolve' | 'dismiss') => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: action === 'resolve' ? 'resolved' : 'dismissed' }
        : report
    ));
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <AuthenticatedSidebar />
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <Header title="Access Denied" subtitle="Admin privileges required" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <Card className="glass border-border max-w-md">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
                <p className="text-muted-foreground">
                  You need admin privileges to access this dashboard.
                </p>
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
          title="Admin Dashboard" 
          subtitle="Platform management and oversight"
        />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Admin Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-8 h-8 text-chart-warning" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalBounties}</p>
                    <p className="text-xs text-muted-foreground">Total Bounties</p>
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
                  <Activity className="w-8 h-8 text-chart-secondary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
                    <p className="text-xs text-muted-foreground">Pending Approvals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{stats.flaggedContent}</p>
                    <p className="text-xs text-muted-foreground">Flagged Content</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-8 h-8 text-chart-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activeReports}</p>
                    <p className="text-xs text-muted-foreground">Active Reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="bounties">Bounties</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium">{user.email}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">{user.role}</Badge>
                            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                              {user.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined: {user.joinDate} | Last active: {user.lastActive}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'activate')}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'suspend')}>
                            <Ban className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleUserAction(user.id, 'ban')}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Ban
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bounties" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Bounty Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bounties.map((bounty) => (
                      <div key={bounty._id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium">{bounty.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{bounty.reward.amount} {bounty.reward.currency}</Badge>
                            <Badge variant={bounty.status === 'active' ? 'default' : 'secondary'}>
                              {bounty.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(bounty.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleBountyAction(bounty._id, 'approve')}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleBountyAction(bounty._id, 'reject')}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reports" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Content Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium capitalize">{report.type} Report</h4>
                          <p className="text-sm text-muted-foreground">{report.reason}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">By: {report.reportedBy}</Badge>
                            <Badge variant={report.status === 'pending' ? 'destructive' : 'default'}>
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Reported: {report.createdAt}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Investigate
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReportAction(report.id, 'resolve')}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleReportAction(report.id, 'dismiss')}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="system" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>System Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button variant="outline" className="h-20 flex-col">
                      <Activity className="w-6 h-6 mb-2" />
                      System Health
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Shield className="w-6 h-6 mb-2" />
                      Security Logs
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <DollarSign className="w-6 h-6 mb-2" />
                      Financial Reports
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Users className="w-6 h-6 mb-2" />
                      User Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}