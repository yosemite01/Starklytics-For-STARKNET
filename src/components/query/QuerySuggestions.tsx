import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Zap } from 'lucide-react';

interface QuerySuggestionsProps {
  onSelectQuery: (query: string) => void;
}

export function QuerySuggestions({ onSelectQuery }: QuerySuggestionsProps) {
  const suggestions = [
    {
      category: 'Network Analytics',
      queries: [
        'SELECT block_number, transaction_count FROM starknet_blocks ORDER BY block_number DESC LIMIT 10',
        'SELECT COUNT(*) as total_transactions FROM starknet_transactions WHERE timestamp > NOW() - INTERVAL 24 HOUR',
        'SELECT contract_address, COUNT(*) as call_count FROM contract_calls GROUP BY contract_address ORDER BY call_count DESC LIMIT 5'
      ]
    },
    {
      category: 'DeFi Metrics',
      queries: [
        'SELECT token_symbol, SUM(amount) as volume FROM token_transfers WHERE timestamp > NOW() - INTERVAL 7 DAY GROUP BY token_symbol',
        'SELECT pool_address, tvl_usd FROM liquidity_pools ORDER BY tvl_usd DESC LIMIT 10',
        'SELECT DATE(timestamp) as date, AVG(gas_price) as avg_gas FROM transactions GROUP BY DATE(timestamp) ORDER BY date DESC'
      ]
    },
    {
      category: 'Bounty Analytics',
      queries: [
        'SELECT status, COUNT(*) as count FROM bounties GROUP BY status',
        'SELECT creator_address, SUM(reward_amount) as total_rewards FROM bounties GROUP BY creator_address ORDER BY total_rewards DESC',
        'SELECT AVG(reward_amount) as avg_reward, category FROM bounties GROUP BY category'
      ]
    }
  ];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span>Query Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((category, i) => (
          <div key={i} className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">{category.category}</h4>
            <div className="space-y-1">
              {category.queries.map((query, j) => (
                <Button
                  key={j}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start h-auto p-2 text-xs"
                  onClick={() => onSelectQuery(query)}
                >
                  <Zap className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{query}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}