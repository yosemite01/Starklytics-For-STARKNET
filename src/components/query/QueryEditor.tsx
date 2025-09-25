import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Save, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { SavedQueries } from './SavedQueries';
import { useQuerySaver } from '@/hooks/useQuerySaver';

interface QueryEditorProps {
  onQueryComplete?: (results: any[], query: string) => void;
}

export function QueryEditor({ onQueryComplete }: QueryEditorProps) {
  const [query, setQuery] = useState('SELECT * FROM bounties LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const {
    isAutosaveEnabled,
    savedQueries,
    saveQuery: saveQueryToCollection,
    deleteQuery,
    updateLastRun,
    toggleAutosave
  } = useQuerySaver();

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

  // Auto-save query when enabled
  useEffect(() => {
    if (isAutosaveEnabled && query.trim()) {
      const timeoutId = setTimeout(() => {
        saveQueryToCollection(query, true);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [query, isAutosaveEnabled]);

  const saveQuery = () => {
    saveQueryToCollection(query);
    toast({
      title: "Query saved",
      description: "Query has been saved to your collection",
    });
  };

  return (
    <div className="space-y-4">
      <SavedQueries 
        queries={savedQueries}
        autosaveEnabled={isAutosaveEnabled}
        onAutosaveToggle={() => toggleAutosave()}
        onSelectQuery={setQuery}
        onDeleteQuery={deleteQuery}
      />
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