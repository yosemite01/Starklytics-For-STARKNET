import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlaceBounty() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthenticatedSidebar />
      <div className="lg:ml-64">
          <Header title="Place Bounty" subtitle="Create and post a new bounty" />
          <main className="p-6">
            <Card className="glass max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>Place a Bounty</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">This is a placeholder for placing a bounty. Integrate with bounty creation logic as needed.</p>
              </CardContent>
            </Card>
          </main>
      </div>
    </div>
  );
}