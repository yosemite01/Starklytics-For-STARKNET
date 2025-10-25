import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Save, Download, Wand2, BarChart3, Lightbulb, RefreshCw, Zap, Trophy, Activity, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useQuerySaver } from '@/hooks/useQuerySaver';
import { useNavigate } from 'react-router-dom';

interface QueryEditorProps {
  onQueryComplete?: (results: any[], query: string) => void;
}

const examplePrompts = [
  {
    title: "DeFi TVL Analysis",
    prompt: "Show me the total value locked across all DeFi protocols on Starknet",
    sql: "SELECT protocol, SUM(tvl_usd) as total_tvl FROM defi_protocols GROUP BY protocol ORDER BY total_tvl DESC;"
  },
  {
    title: "Transaction Volume",
    prompt: "Get daily transaction volume for the last 30 days",
    sql: "SELECT DATE(block_timestamp) as date, COUNT(*) as tx_count FROM transactions WHERE block_timestamp >= NOW() - INTERVAL 30 DAY GROUP BY DATE(block_timestamp);"
  },
  {
    title: "Top Traders",
    prompt: "Find the most active traders by transaction count",
    sql: "SELECT from_address, COUNT(*) as tx_count FROM transactions GROUP BY from_address ORDER BY tx_count DESC LIMIT 10;"
  }
];

export function QueryEditor({ onQueryComplete }: QueryEditorProps) {
  const [query, setQuery] = useState('SELECT * FROM bounties LIMIT 10;');
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Auto-load query from localStorage if coming from library
  useEffect(() => {
    const loadQuery = localStorage.getItem('loadQuery');
    if (loadQuery) {
      setQuery(loadQuery);
      localStorage.removeItem('loadQuery');
    }
  }, []);
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    isAutosaveEnabled,
    savedQueries,
    saveQuery: saveQueryToCollection,
    deleteQuery,
    updateLastRun,
    toggleAutosave
  } = useQuerySaver();

  const generateSQLFromPrompt = async () => {
    if (!prompt.trim()) return;
    
    setAiLoading(true);
    try {
      // Simulate AI SQL generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI response based on prompt keywords
      let generatedSQL = '';
      if (prompt.toLowerCase().includes('tvl') || prompt.toLowerCase().includes('defi')) {
        generatedSQL = "SELECT protocol, SUM(tvl_usd) as total_tvl FROM defi_protocols GROUP BY protocol ORDER BY total_tvl DESC LIMIT 10;";
      } else if (prompt.toLowerCase().includes('transaction') || prompt.toLowerCase().includes('volume')) {
        generatedSQL = "SELECT DATE(block_timestamp) as date, COUNT(*) as tx_count FROM transactions WHERE block_timestamp >= NOW() - INTERVAL 7 DAY GROUP BY DATE(block_timestamp);";
      } else {
        generatedSQL = "SELECT * FROM starknet_data WHERE created_at >= NOW() - INTERVAL 1 DAY LIMIT 100;";
      }
      
      setQuery(generatedSQL);
      toast({
        title: "SQL Generated",
        description: "AI has generated SQL from your prompt",
      });
    } catch (error) {
      toast({
        title: "AI Generation Failed",
        description: "Please try again or write SQL manually",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const executeQuery = async () => {
    setLoading(true);
    try {
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResults = [
        { id: 1, title: 'Analyze DeFi TVL', reward: 500, status: 'active' },
        { id: 2, title: 'Transaction Patterns', reward: 750, status: 'completed' },
        { id: 3, title: 'User Behavior Study', reward: 300, status: 'active' }
      ];
      // Parse LIMIT from query
      let limit = undefined;
      const limitMatch = query.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        limit = parseInt(limitMatch[1], 10);
      }
      const limitedResults = limit ? mockResults.slice(0, limit) : mockResults;
      setResults(limitedResults);
      
      // Store results in localStorage for visualization
      localStorage.setItem('queryResults', JSON.stringify(limitedResults));
      localStorage.setItem('lastQuery', query);
      
      onQueryComplete?.(limitedResults, query);

      // Update last run timestamp if query is saved
      const savedQuery = savedQueries.find(sq => sq.query === query);
      if (savedQuery) {
        updateLastRun(savedQuery.id);
      }

      toast({
        title: "Query executed successfully",
        description: `Found ${limitedResults.length} results`,
      });
    } catch (error) {
      toast({
        title: "Query failed",
        description: "Please check your query syntax",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const visualizeResults = () => {
    if (results.length > 0) {
      localStorage.setItem('queryResults', JSON.stringify(results));
      localStorage.setItem('lastQuery', query);
      navigate('/charts');
    }
  };
  
  const createDashboardFromQuery = () => {
    if (!results.length) return;
    
    const queryName = prompt(`Enter dashboard name:`, `Dashboard from Query`);
    if (!queryName) return;
    
    // Create dashboard with auto-generated widgets from query results
    const dashboardConfig = {
      id: `query-dashboard-${Date.now()}`,
      name: queryName,
      description: `Auto-generated dashboard from query results`,
      source: 'query',
      query: query,
      widgets: generateDashboardWidgets(results),
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('ai_generated_dashboard', JSON.stringify(dashboardConfig));
    navigate(`/dashboard/builder?source=query&id=${dashboardConfig.id}`);
  };
  
  const generateDashboardWidgets = (data: any[]) => {
    if (!data.length) return [];
    
    const widgets = [];
    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => 
      data.every(row => !isNaN(Number(row[col])) && row[col] !== '')
    );
    const textColumns = columns.filter(col => !numericColumns.includes(col));
    
    // KPI widgets for numeric values
    numericColumns.slice(0, 3).forEach((col, index) => {
      const total = data.reduce((sum, row) => sum + Number(row[col]), 0);
      widgets.push({
        id: `kpi-${col}`,
        type: 'kpi',
        title: col.replace(/_/g, ' ').toUpperCase(),
        data: [{ value: total }],
        position: { x: index * 3, y: 0, w: 3, h: 3 }
      });
    });
    
    // Chart widgets
    if (numericColumns.length > 0 && textColumns.length > 0) {
      widgets.push({
        id: 'main-chart',
        type: 'bar',
        title: `${textColumns[0]} Analysis`,
        data: data.slice(0, 10),
        position: { x: 0, y: 4, w: 8, h: 5 }
      });
      
      widgets.push({
        id: 'pie-chart',
        type: 'pie', 
        title: 'Distribution',
        data: data.slice(0, 5).map(row => ({ 
          name: row[textColumns[0]], 
          value: Number(row[numericColumns[0]]) 
        })),
        position: { x: 8, y: 4, w: 4, h: 5 }
      });
    }
    
    // Data table
    widgets.push({
      id: 'data-table',
      type: 'table',
      title: 'Query Results',
      data: data,
      position: { x: 0, y: 9, w: 12, h: 6 }
    });
    
    return widgets;
  };

  // Auto-save query when enabled
  useEffect(() => {
    if (isAutosaveEnabled && query.trim() && query !== 'SELECT * FROM bounties LIMIT 10;') {
      const timeoutId = setTimeout(() => {
        saveQueryToCollection(query, true);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [query, isAutosaveEnabled, saveQueryToCollection]);

  const saveQuery = () => {
    const queryName = prompt(`Enter a name for this query:`, ``);
    if (!queryName || queryName.trim() === '') return;
    
    // Save query with results and visualization config
    const savedQuery = {
      id: `query-${Date.now()}`,
      name: queryName.trim(),
      query: query,
      results: results,
      visualizations: generateVisualizationsFromResults(results),
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    const existingQueries = JSON.parse(localStorage.getItem('saved_queries') || '[]');
    existingQueries.push(savedQuery);
    localStorage.setItem('saved_queries', JSON.stringify(existingQueries));
    
    toast({
      title: "Query saved",
      description: `"${queryName}" has been saved to your library`,
    });
  };
  
  const generateVisualizationsFromResults = (data: any[]) => {
    if (!data.length) return [];
    
    const visualizations = [];
    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => 
      data.every(row => !isNaN(Number(row[col])) && row[col] !== '')
    );
    const textColumns = columns.filter(col => !numericColumns.includes(col));
    
    // Auto-generate different chart types
    if (numericColumns.length > 0 && textColumns.length > 0) {
      // Bar chart
      visualizations.push({
        type: 'bar',
        title: `${textColumns[0]} vs ${numericColumns[0]}`,
        xAxis: textColumns[0],
        yAxis: numericColumns[0],
        data: data.slice(0, 10)
      });
      
      // Pie chart if suitable
      if (data.length <= 10) {
        visualizations.push({
          type: 'pie',
          title: `Distribution of ${numericColumns[0]}`,
          data: data.map(row => ({ name: row[textColumns[0]], value: Number(row[numericColumns[0]]) }))
        });
      }
    }
    
    // Line chart for time series
    if (columns.some(col => col.toLowerCase().includes('date') || col.toLowerCase().includes('time'))) {
      const timeCol = columns.find(col => col.toLowerCase().includes('date') || col.toLowerCase().includes('time'));
      if (timeCol && numericColumns.length > 0) {
        visualizations.push({
          type: 'line',
          title: `${numericColumns[0]} Over Time`,
          xAxis: timeCol,
          yAxis: numericColumns[0],
          data: data
        });
      }
    }
    
    // Table view
    visualizations.push({
      type: 'table',
      title: 'Data Table',
      data: data
    });
    
    return visualizations;
  };

  return (
    <div className="space-y-6">
      {/* Quick Query Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Quick Query</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
      
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">SQL Editor</TabsTrigger>
          <TabsTrigger value="ai-prompt">AI Assistant</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>SQL Query Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                className="min-h-[200px] font-mono"
              />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={executeQuery} disabled={loading} className="glow-primary">
                  <Play className="w-4 h-4 mr-2" />
                  {loading ? 'Running...' : 'Run Query'}
                </Button>
                <Button onClick={saveQuery} variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={visualizeResults} disabled={!results.length} variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Visualize
                </Button>
                <Button onClick={() => createDashboardFromQuery()} disabled={!results.length} className="bg-gradient-to-r from-primary to-accent">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Make Dashboard
                </Button>
                <Button variant="outline" disabled={!results.length}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-prompt" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                AI SQL Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what data you want to analyze in plain English..."
                className="min-h-[100px]"
              />
              <Button onClick={generateSQLFromPrompt} disabled={aiLoading || !prompt.trim()}>
                <Wand2 className="w-4 h-4 mr-2" />
                {aiLoading ? 'Generating...' : 'Generate SQL'}
              </Button>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Example Prompts
                </h4>
                <div className="grid gap-3">
                  {examplePrompts.map((example, i) => (
                    <div
                      key={i}
                      className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setPrompt(example.prompt)}
                    >
                      <h5 className="font-medium text-sm">{example.title}</h5>
                      <p className="text-xs text-muted-foreground mt-1">{example.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results.length > 0 && (
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Query Results ({results.length} rows)</CardTitle>
            <div className="flex space-x-2">
              <Button onClick={visualizeResults} size="sm" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Create Visualization
              </Button>
              <Button onClick={createDashboardFromQuery} size="sm" className="bg-gradient-to-r from-primary to-accent">
                <BarChart3 className="w-4 h-4 mr-2" />
                Make Dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {Object.keys(results[0]).map((key) => (
                      <th key={key} className="text-left p-2 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Object.values(row).map((value: any, j) => (
                        <td key={j} className="p-2 text-sm">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
        
        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* AI Suggestions */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI Suggestions
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground mb-3">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
              
              <div className="space-y-3">
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Analyze Recent Block Activity</h4>
                    <Badge variant="destructive" className="text-xs">high</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Block N/A: Examine transaction patterns in the last 100 blocks.
                  </p>
                  <Badge variant="outline" className="text-xs">analysis</Badge>
                </div>
                
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Query DeFi Protocol Performance</h4>
                    <Badge variant="secondary" className="text-xs">medium</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Compare TVL changes across major DeFi protocols this week.
                  </p>
                  <Badge variant="outline" className="text-xs">query</Badge>
                </div>
                
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Visualize Gas Usage Trends</h4>
                    <Badge variant="secondary" className="text-xs">medium</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Create charts showing gas consumption by contract type.
                  </p>
                  <Badge variant="outline" className="text-xs">visualization</Badge>
                </div>
                
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Network Health Check</h4>
                    <Badge variant="outline" className="text-xs">low</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Block N/A: Network operating normally. Monitor for anomalies.
                  </p>
                  <Badge variant="outline" className="text-xs">insight</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Query Suggestions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Query Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setQuery('SELECT * FROM bounties WHERE status = "active" ORDER BY reward DESC;')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Active Bounties</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Bounties</div>
                  <p className="text-xs text-muted-foreground mb-2">Get all currently active bounties</p>
                  <Button size="sm" variant="outline" className="text-xs h-6">
                    Use Query
                  </Button>
                </div>
                
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setQuery('SELECT * FROM bounties ORDER BY reward DESC LIMIT 10;')}>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Top Rewards</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Analytics</div>
                  <p className="text-xs text-muted-foreground mb-2">Find bounties with highest rewards</p>
                  <Button size="sm" variant="outline" className="text-xs h-6">
                    Use Query
                  </Button>
                </div>
                
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setQuery('SELECT * FROM submissions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Recent Activity</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Activity</div>
                  <p className="text-xs text-muted-foreground mb-2">Show submissions from last 7 days</p>
                  <Button size="sm" variant="outline" className="text-xs h-6">
                    Use Query
                  </Button>
                </div>
                
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setQuery('SELECT user_id, COUNT(*) as bounties_won FROM bounties WHERE status = "completed" GROUP BY user_id;')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">User Statistics</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Users</div>
                  <p className="text-xs text-muted-foreground mb-2">Count bounties won by each user</p>
                  <Button size="sm" variant="outline" className="text-xs h-6">
                    Use Query
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Bounties */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Bounties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <h4 className="text-sm font-medium mb-1">Analyze Starknet Transaction Patterns</h4>
                  <p className="text-xs text-muted-foreground mb-2">Reward: 500 STRK</p>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
                
                <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <h4 className="text-sm font-medium mb-1">DeFi Protocol Usage Analysis</h4>
                  <p className="text-xs text-muted-foreground mb-2">Reward: 750 STRK</p>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
              </div>
              
              <Button variant="outline" className="w-full text-xs">
                View All Bounties
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}