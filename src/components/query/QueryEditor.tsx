import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Save, Download, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface QueryEditorProps {
  onQueryComplete?: (results: any[]) => void;
}

export function QueryEditor({ onQueryComplete }: QueryEditorProps) {
  const [query, setQuery] = useState('SELECT * FROM bounties LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const executeQuery = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Parse LIMIT from query
      const limitMatch = query.match(/LIMIT\s+(\d+)/i);
      const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
      
      const allMockResults = [
        { id: 1, title: 'Analyze DeFi TVL', reward: 500, status: 'active', created_at: '2024-01-15' },
        { id: 2, title: 'Transaction Patterns', reward: 750, status: 'completed', created_at: '2024-01-14' },
        { id: 3, title: 'User Behavior Study', reward: 300, status: 'active', created_at: '2024-01-13' },
        { id: 4, title: 'Smart Contract Audit', reward: 1000, status: 'active', created_at: '2024-01-12' },
        { id: 5, title: 'Gas Optimization', reward: 400, status: 'completed', created_at: '2024-01-11' },
        { id: 6, title: 'Security Analysis', reward: 800, status: 'active', created_at: '2024-01-10' },
        { id: 7, title: 'Performance Testing', reward: 600, status: 'active', created_at: '2024-01-09' },
        { id: 8, title: 'UI/UX Research', reward: 350, status: 'completed', created_at: '2024-01-08' },
        { id: 9, title: 'Data Migration', reward: 450, status: 'active', created_at: '2024-01-07' },
        { id: 10, title: 'API Integration', reward: 550, status: 'active', created_at: '2024-01-06' },
        { id: 11, title: 'Mobile Testing', reward: 250, status: 'completed', created_at: '2024-01-05' },
        { id: 12, title: 'Load Testing', reward: 700, status: 'active', created_at: '2024-01-04' }
      ];
      
      // Apply LIMIT
      const limitedResults = allMockResults.slice(0, limit);
      
      setResults(limitedResults);
      onQueryComplete?.(limitedResults);
      
      // Store query results for dashboard
      localStorage.setItem('lastQueryResults', JSON.stringify(limitedResults));
      localStorage.setItem('lastQuery', query);
      
      toast({
        title: "Query executed successfully",
        description: `Found ${limitedResults.length} results (limited to ${limit})`,
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

  const saveQuery = () => {
    const savedQueries = JSON.parse(localStorage.getItem('savedQueries') || '[]');
    const newQuery = {
      id: Date.now(),
      query,
      name: `Query ${savedQueries.length + 1}`,
      created_at: new Date().toISOString()
    };
    savedQueries.push(newQuery);
    localStorage.setItem('savedQueries', JSON.stringify(savedQueries));
    
    toast({
      title: "Query saved",
      description: "Query has been saved to your collection",
    });
  };

  const visualizeInDashboard = () => {
    if (results.length === 0) {
      toast({
        title: "No data to visualize",
        description: "Please run a query first",
        variant: "destructive",
      });
      return;
    }
    
    // Store data for dashboard
    localStorage.setItem('dashboardData', JSON.stringify(results));
    localStorage.setItem('dashboardQuery', query);
    
    navigate('/charts');
  };

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>SQL Query Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="min-h-[120px] font-mono"
          />
          <div className="flex gap-2">
            <Button onClick={executeQuery} disabled={loading} className="glow-primary">
              <Play className="w-4 h-4 mr-2" />
              {loading ? 'Running...' : 'Run Query'}
            </Button>
            <Button onClick={saveQuery} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={visualizeInDashboard} variant="outline" disabled={!results.length}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" disabled={!results.length}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Query Results ({results.length} rows)</CardTitle>
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
  );
}