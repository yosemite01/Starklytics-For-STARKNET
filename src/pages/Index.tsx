import { useState, useEffect } from "react";

import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { QueryEditor } from "@/components/query/QueryEditor";
import { QuerySuggestions } from "@/components/query/QuerySuggestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Zap } from "lucide-react";
import { Chart } from "@/components/ui/chart";
import { AIDataInterpreter } from "@/components/ai/AIDataInterpreter";
import { AIChatBox } from "@/components/ai/AIChatBox";
import { AIFloatingButton } from "@/components/ai/AIFloatingButton";
import { AISuggestions } from "@/components/ai/AISuggestions";
import { bountyService, type Bounty } from "@/services/BountyService";

const Index = () => {
  const [rpcData, setRpcData] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [recentBounties, setRecentBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentBounties = async () => {
      try {
        const bounties = await bountyService.getBounties({ limit: 3 });
        setRecentBounties(bounties);
      } catch (error) {
        console.error("Error fetching recent bounties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBounties();
  }, []);

  const endpoints = [
    "https://starknet-mainnet.public.blastapi.io",
    "https://free-rpc.nethermind.io/mainnet-juno",
    "https://starknet-mainnet.g.alchemy.com/v2/demo",
    "https://rpc.starknet.lava.build",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthenticatedSidebar />
      <div className="lg:ml-64">
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
                <Chart
                  title="Transaction Volume"
                  type="line"
                  method="starknet_getBlockWithTxs"
                  data={[]} // required initial data
                  xAxis="timestamp"
                  yAxis="value"
                  color="hsl(var(--chart-primary))"
                  endpoints={endpoints}
                  onDataUpdate={setRpcData}
                />
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Network Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  title="Network Activity"
                  type="line"
                  method="starknet_getStateUpdate"
                  data={[]} // required initial data
                  xAxis="timestamp"
                  yAxis="value"
                  color="hsl(var(--chart-secondary))"
                  endpoints={endpoints}
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
            <div className="space-y-6">
              <AISuggestions />
              <QuerySuggestions
                onSelectQuery={(selectedQuery) => {
                  const encodedQuery = encodeURIComponent(selectedQuery);
                  window.location.href = `/query?q=${encodedQuery}`;
                }}
              />
            </div>
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
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Loading bounties...
                    </p>
                  </div>
                ) : recentBounties.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No bounties available yet
                    </p>
                  </div>
                ) : (
                  recentBounties.map((bounty) => (
                    <div
                      key={bounty._id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/20 transition-all"
                    >
                      <div>
                        <h4 className="font-medium">{bounty.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Reward: {bounty.reward.amount}{" "}
                          {bounty.reward.currency}
                        </p>
                      </div>
                      <Badge
                        variant={
                          bounty.status === "active" ? "default" : "secondary"
                        }
                      >
                        {bounty.status.charAt(0).toUpperCase() +
                          bounty.status.slice(1)}
                      </Badge>
                    </div>
                  ))
                )}
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

      {/* AI Components */}
      {!chatOpen && <AIFloatingButton onClick={() => setChatOpen(true)} />}
      <AIChatBox isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Index;
