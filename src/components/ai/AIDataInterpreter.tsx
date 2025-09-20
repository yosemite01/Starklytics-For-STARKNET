import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react';

interface AIDataInterpreterProps {
  rpcData: any;
}

export function AIDataInterpreter({ rpcData }: AIDataInterpreterProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rpcData) {
      generateInsights();
    }
  }, [rpcData]);

  const generateInsights = async () => {
    setLoading(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockInsights = [
      "Transaction volume has increased by 15% compared to last week",
      "Peak activity detected between 14:00-16:00 UTC",
      "DeFi protocols showing strong adoption with 23% growth",
      "Network congestion is minimal with average block time of 12s"
    ];
    
    setInsights(mockInsights);
    setLoading(false);
  };

  if (!rpcData && !loading && insights.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            AI insights will appear here when data is available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary animate-pulse-glow" />
          <span>AI Data Insights</span>
          <Badge variant="secondary" className="text-xs">GPT-OSS 120B</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Analyzing data patterns...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-muted/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
            {insights.length === 0 && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No significant patterns detected</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}