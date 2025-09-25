import { useNavigate } from 'react-router-dom';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function JoinBounty() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64">
        <Header title="Join Bounty" subtitle="Participate in analytics challenges" />
        <main className="p-6">
          <Card className="glass max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Join Analytics Bounties</h2>
              <p className="text-muted-foreground mb-6">
                Browse and participate in analytics challenges to earn rewards.
              </p>
              <Button onClick={() => navigate('/bounties')} className="glow-primary">
                View Available Bounties
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}