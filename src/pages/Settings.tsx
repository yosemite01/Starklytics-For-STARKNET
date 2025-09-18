import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Bell, Shield, Database, Palette } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: true,
    autoSave: true,
    dataRetention: '30'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header title="Settings" subtitle="Manage your account preferences" />
        
        <main className="flex-1 p-6 space-y-6">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Notifications */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications about bounties and updates</p>
                  </div>
                  <Switch 
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings({...settings, notifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Updates</Label>
                    <p className="text-sm text-muted-foreground">Weekly summary of platform activity</p>
                  </div>
                  <Switch 
                    checked={settings.emailUpdates}
                    onCheckedChange={(checked) => setSettings({...settings, emailUpdates: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Appearance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme for better visibility</p>
                  </div>
                  <Switch 
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => setSettings({...settings, darkMode: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Data & Privacy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save Queries</Label>
                    <p className="text-sm text-muted-foreground">Automatically save query drafts</p>
                  </div>
                  <Switch 
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => setSettings({...settings, autoSave: checked})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Retention (days)</Label>
                  <Input 
                    type="number"
                    value={settings.dataRetention}
                    onChange={(e) => setSettings({...settings, dataRetention: e.target.value})}
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground">How long to keep query results</p>
                </div>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                <Separator />
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={loading} className="glow-primary">
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}