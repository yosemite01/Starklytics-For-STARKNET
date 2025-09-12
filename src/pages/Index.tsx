import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { QueryEditor } from "@/components/query/QueryEditor";
import { QuerySuggestions } from "@/components/query/QuerySuggestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Zap } from "lucide-react";
import { LiveChart } from "@/components/ui/chart";
import { AIDataInterpreter } from "@/components/ai/AIDataInterpreter";
import { AIChatBox } from "@/components/ai/AIChatBox";
import { AIFloatingButton } from "@/components/ai/AIFloatingButton";

const Index = () => {
  const [rpcData, setRpcData] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <AuthenticatedSidebar />
        <div className="flex-1">
          <Header 
            title="Analytics Dashboard" 
            subtitle="Monitor Starknet network activity and performance"
          />
          
          <main className="p-6 space-y-6">
            {/* Stats Overview */}
            <StatsOverview />

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass glow-chart">
                <CardHeader>
                  <CardTitle>Transaction Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <LiveChart 
                    title="Transaction Volume"
                    method="starknet_getBlockWithTxs"
                    dataKey="value"
                    color="hsl(var(--chart-primary))"
                    onDataUpdate={setRpcData}
                  />
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Network Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <LiveChart 
                    title="Network Activity"
                    method="starknet_getStateUpdate"
                    dataKey="value"
                    color="hsl(var(--chart-secondary))"
                  />
                </CardContent>
              </Card>
            </div>

            {/* AI Data Interpreter */}
            <AIDataInterpreter rpcData={rpcData} />

            {/* Query Editor Section */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-primary animate-pulse-glow" />
                      <span>Quick Query</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QueryEditor />
                  </CardContent>
                </Card>
              </div>
              <QuerySuggestions onSelectQuery={(selectedQuery) => {
                // Navigate to query page with the selected query
                const encodedQuery = encodeURIComponent(selectedQuery);
                window.location.href = `/query?q=${encodedQuery}`;
              }} />
            </div>

            {/* Recent Activity */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-chart-warning" />
                  <span>Recent Bounties</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: "Starknet DeFi TVL Analysis", reward: "500 STRK", status: "Active" },
                    { title: "Transaction Fee Optimization", reward: "750 STRK", status: "Completed" },
                    { title: "NFT Market Analytics", reward: "300 STRK", status: "Active" },
                  ].map((bounty, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/20 transition-all">
                      <div>
                        <h4 className="font-medium">{bounty.title}</h4>
                        <p className="text-sm text-muted-foreground">Reward: {bounty.reward}</p>
                      </div>
                      <Badge variant={bounty.status === "Active" ? "default" : "secondary"}>
                        {bounty.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button className="w-full" asChild>
                    <a href="/bounties">View All Bounties</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      
      {/* AI Components */}
      {!chatOpen && <AIFloatingButton onClick={() => setChatOpen(true)} />}
      <AIChatBox isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Index;
