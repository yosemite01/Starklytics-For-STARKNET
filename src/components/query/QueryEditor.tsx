import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Save, Download, History, Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "../ui/use-toast";
import { QueryVisualizer } from "./QueryVisualizer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StarknetDataService } from "@/services/StarknetDataService";
import { validateQueryText } from "@/utils/validation";
import { handleSupabaseError, handleRpcError, getUserFriendlyMessage } from "@/utils/errorHandler";
import { rateLimiters } from "@/middleware/rateLimiter";

interface QueryEditorProps {
  onQueryComplete?: (results: any[]) => void;
}

export function QueryEditor({ onQueryComplete }: QueryEditorProps = {}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [query, setQuery] = useState(() => {
    // Check for query parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    return queryParam ? decodeURIComponent(queryParam) : 
    `-- Starknet Analytics Query
SELECT 
  block_number,
  transaction_count,
  gas_used,
  timestamp
FROM blocks 
WHERE timestamp >= NOW() - INTERVAL '7 days'
ORDER BY block_number DESC
LIMIT 100;`;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [savedQueries, setSavedQueries] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [queryTitle, setQueryTitle] = useState("");
  const [queryDescription, setQueryDescription] = useState("");
  const [queryResults, setQueryResults] = useState(null);

  useEffect(() => {
    loadSavedQueries();
  }, []);

  const loadSavedQueries = async () => {
    if (!user) return;
    try {
      const { data: queries, error } = await supabase
        .from('queries')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSavedQueries(queries || []);
    } catch (error: any) {
      const appError = handleSupabaseError(error);
      toast({
        title: "Failed to Load Queries",
        description: getUserFriendlyMessage(appError),
        variant: "destructive",
      });
    }
  };

  const [currentVisualization, setCurrentVisualization] = useState(null);

  const runQuery = async () => {
    // Rate limiting
    const rateCheck = rateLimiters.query.isAllowed(user?.id || 'anonymous');
    if (!rateCheck.allowed) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many queries. Please wait before trying again.",
        variant: "destructive",
      });
      return;
    }

    // Validate query before execution
    const validation = validateQueryText(query);
    if (!validation.isValid) {
      toast({
        title: "Invalid Query",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    try {
      // Save query and update context
      if (user) {
        const { data: savedQuery } = await supabase
          .from('queries')
          .insert({
            creator_id: user.id,
            title: 'Untitled Query',
            query_text: query,
            is_public: false
          })
          .select()
          .single();
        
        if (savedQuery) {
          const queryWithResults = {
            ...savedQuery,
            results: mockResults
          };
          
          // Update global data context
          if (typeof window !== 'undefined' && (window as any).updateDataContext) {
            (window as any).updateDataContext(queryWithResults);
          }
        }
      }
      
      // Execute real Starknet query
      const dataService = new StarknetDataService();
      let results;
      
      if (query.toLowerCase().includes('blocks')) {
        results = await dataService.getLatestBlocks(100);
      } else if (query.toLowerCase().includes('network') || query.toLowerCase().includes('stats')) {
        const stats = await dataService.getNetworkStats();
        results = [stats];
      } else {
        // Default to block data
        results = await dataService.getLatestBlocks(50);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setQueryResults(results);
      setCurrentVisualization(null);
      
      // Call onQueryComplete callback if provided
      if (onQueryComplete) {
        onQueryComplete(results);
      }
      
      toast({
        title: "Query executed successfully",
        description: `Returned ${results.length} rows from Starknet mainnet`,
      });
    } catch (error: any) {
      const appError = error?.code ? handleSupabaseError(error) : handleRpcError(error);
      toast({
        title: "Query Execution Failed",
        description: getUserFriendlyMessage(appError),
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveQuery = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('queries')
        .insert({
          creator_id: user.id,
          title: queryTitle,
          description: queryDescription,
          query_text: query,
          is_public: false
        });
      
      if (error) throw error;
      
      setShowSaveDialog(false);
      setQueryTitle('');
      setQueryDescription('');
      loadSavedQueries();
      
      toast({
        title: "Query saved successfully",
        description: "Your query has been saved and can be accessed from the history.",
      });
    } catch (error: any) {
      const appError = handleSupabaseError(error);
      toast({
        title: "Failed to Save Query",
        description: getUserFriendlyMessage(appError),
        variant: "destructive",
      });
    }
  };

  const loadQuery = (savedQuery) => {
    setQuery(savedQuery.query_text);
    setShowHistoryDialog(false);
  };

  return (
    <div className="space-y-4">
      {/* Query Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">SQL Query Editor</h3>
          <Badge variant="secondary">
            Starknet Mainnet
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Query History</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-4">
                  {savedQueries.map((savedQuery) => (
                    <Card key={savedQuery.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{savedQuery.title}</h4>
                          {savedQuery.description && (
                            <p className="text-sm text-muted-foreground">{savedQuery.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => loadQuery(savedQuery)}>
                          Load
                        </Button>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded-md">
                        {savedQuery.query_text}
                      </pre>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Query</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={queryTitle}
                    onChange={(e) => setQueryTitle(e.target.value)}
                    placeholder="Enter a title for your query"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={queryDescription}
                    onChange={(e) => setQueryDescription(e.target.value)}
                    placeholder="Enter a description for your query"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveQuery}>Save Query</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (queryResults) {
                const blob = new Blob([JSON.stringify(queryResults, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `query-results-${new Date().toISOString()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Query Editor */}
      <Card className="glass glow-chart">
        <CardContent className="p-0">
          <div className="border-b border-border">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/20">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-chart-error rounded-full"></div>
                <div className="w-3 h-3 bg-chart-warning rounded-full"></div>
                <div className="w-3 h-3 bg-chart-success rounded-full"></div>
                <span className="ml-2 text-xs text-muted-foreground">query.sql</span>
              </div>
              <Button 
                onClick={runQuery}
                disabled={isRunning}
                className="glow-primary"
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? "Running..." : "Run Query"}
              </Button>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-80 p-4 bg-transparent border-none resize-none focus:outline-none font-mono text-sm"
              placeholder="Enter your SQL query here..."
              spellCheck={false}
            />
            {/* Line numbers */}
            <div className="absolute left-0 top-0 p-4 text-xs text-muted-foreground font-mono select-none pointer-events-none">
              {query.split('\n').map((_, i) => (
                <div key={i} className="leading-5">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Query Results */}
      {isRunning ? (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse-glow">
              <Database className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Executing query...</p>
            </div>
          </CardContent>
        </Card>
      ) : queryResults ? (
        <>
          <Card className="glass">
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {Object.keys(queryResults[0] || {}).map((header) => (
                        <th key={header} className="text-left p-2 text-muted-foreground">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResults.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                        {Object.values(row).map((value: any, j) => (
                          <td key={j} className="p-2 font-mono">
                            {typeof value === 'object' ? JSON.stringify(value) : value?.toString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <QueryVisualizer 
            data={queryResults} 
            onVisualizationSave={(config) => {
              setCurrentVisualization(config);
              // Update the query metadata with visualization config
              if (savedQueries.find(q => q.query_text === query)?.id) {
                queryService.saveQuery({
                  id: savedQueries.find(q => q.query_text === query)?.id,
                  query_text: query,
                  metadata: { visualization: config }
                });
              }
              toast({
                title: "Visualization saved",
                description: "You can now use this visualization in your dashboard.",
              });
            }} 
          />
        </>
      ) : null}
    </div>
  );
}