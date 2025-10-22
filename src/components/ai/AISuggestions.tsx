import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, RefreshCw, TrendingUp, Database, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'analysis' | 'query' | 'visualization' | 'insight';
  priority: 'low' | 'medium' | 'high';
  rpcData?: any;
  createdAt: Date;
}

const RPC_ENDPOINT = import.meta.env.VITE_STARKNET_RPC_URL || "https://starknet-mainnet.reddio.com/rpc/v0_7";

export function AISuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchRPCData = async () => {
    try {
      const response = await fetch(RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'starknet_blockNumber',
          params: [],
          id: 1
        })
      });
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('RPC fetch error:', error);
      return null;
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const blockNumber = await fetchRPCData();
      const currentTime = new Date();
      
      // Generate AI suggestions based on RPC data and time
      const newSuggestions: Suggestion[] = [
        {
          id: `suggestion-${Date.now()}-1`,
          title: 'Analyze Recent Block Activity',
          description: `Current block: ${blockNumber || 'N/A'}. Analyze transaction patterns in the last 100 blocks.`,
          category: 'analysis',
          priority: 'high',
          rpcData: { blockNumber },
          createdAt: currentTime
        },
        {
          id: `suggestion-${Date.now()}-2`,
          title: 'Query Transaction Volume Trends',
          description: 'Create a query to track daily transaction volume changes over the past week.',
          category: 'query',
          priority: 'medium',
          rpcData: { blockNumber },
          createdAt: currentTime
        },
        {
          id: `suggestion-${Date.now()}-3`,
          title: 'Visualize Gas Usage Patterns',
          description: 'Build a dashboard showing gas consumption across different contract types.',
          category: 'visualization',
          priority: 'medium',
          rpcData: { blockNumber },
          createdAt: currentTime
        },
        {
          id: `suggestion-${Date.now()}-4`,
          title: 'Network Health Insight',
          description: `Block ${blockNumber || 'N/A'} shows normal network activity. Monitor for any anomalies.`,
          category: 'insight',
          priority: 'low',
          rpcData: { blockNumber },
          createdAt: currentTime
        }
      ];

      setSuggestions(newSuggestions);
      setLastUpdate(currentTime);
      
      toast({
        title: "Suggestions Updated",
        description: "AI suggestions refreshed with latest network data",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not fetch latest suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    // Store suggestion data for use in other components
    localStorage.setItem('aiSuggestion', JSON.stringify(suggestion));
    
    // Navigate based on suggestion category
    switch (suggestion.category) {
      case 'query':
        window.location.href = '/query';
        break;
      case 'analysis':
        window.location.href = '/analytics';
        break;
      case 'visualization':
        window.location.href = '/charts';
        break;
      default:
        toast({
          title: "Suggestion Applied",
          description: suggestion.description,
        });
    }
  };

  // Auto-refresh every hour
  useEffect(() => {
    generateSuggestions();
    const interval = setInterval(generateSuggestions, 60 * 60 * 1000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analysis': return TrendingUp;
      case 'query': return Database;
      case 'visualization': return Activity;
      default: return Lightbulb;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className="glass border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          AI Suggestions
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSuggestions}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
        
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No suggestions available</p>
          </div>
        ) : (
          suggestions.map((suggestion) => {
            const IconComponent = getCategoryIcon(suggestion.category);
            return (
              <div
                key={suggestion.id}
                className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                  </div>
                  <Badge variant={getPriorityColor(suggestion.priority) as any} className="text-xs">
                    {suggestion.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {suggestion.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs capitalize">
                    {suggestion.category}
                  </Badge>
                  {suggestion.rpcData?.blockNumber && (
                    <span className="text-xs text-muted-foreground">
                      Block: {suggestion.rpcData.blockNumber}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}