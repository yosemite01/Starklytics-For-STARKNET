import { useState } from 'react';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';


const RPC_ENDPOINTS = [
  'https://starknet-mainnet.public.blastapi.io',
  'https://free-rpc.nethermind.io/mainnet-juno',
  'https://starknet-mainnet.reddio.com/rpc/v0_7',
  'https://rpc.starknet.lava.build'
];

let currentRpcIndex = 0;

function getRpcUrl() {
  return RPC_ENDPOINTS[currentRpcIndex];
}

function switchToNextRpc() {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
}

// Helper to fetch latest block number
async function getLatestBlockNumber() {
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const body = {
        jsonrpc: "2.0",
        method: "starknet_blockNumber",
        params: [],
        id: 1
      };
      const res = await fetch(getRpcUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.result) {
        console.log('Using RPC:', getRpcUrl());
        return data.result;
      }
    } catch (e) {
      console.log('RPC failed:', getRpcUrl(), e);
      switchToNextRpc();
    }
  }
  throw new Error('All RPC endpoints failed');
}

// Helper to fetch block timestamp
async function getBlockTimestamp(block_number: number) {
  try {
    const body = {
      jsonrpc: "2.0",
      method: "starknet_getBlockWithTxs",
      params: [{ block_number }],
      id: 1
    };
    const res = await fetch(getRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return data.result?.timestamp;
  } catch (e) {
    return null;
  }
}

// Estimate the block number from two weeks ago
async function estimateBlockFromTwoWeeksAgo() {
  const now = Math.floor(Date.now() / 1000);
  const twoWeeksAgo = now - 14 * 24 * 60 * 60;
  const latest = await getLatestBlockNumber();
  let low = 0;
  let high = latest;
  let result = 0;
  // Binary search for block closest to twoWeeksAgo
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const ts = await getBlockTimestamp(mid);
    if (!ts) break;
    if (ts < twoWeeksAgo) {
      low = mid + 1;
    } else {
      result = mid;
      high = mid - 1;
    }
  }
  return result;
}

async function fetchEvents(contractAddress: string) {
  const { RpcProvider } = await import('starknet');
  
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      console.log('Trying RPC:', getRpcUrl());
      const provider = new RpcProvider({ nodeUrl: getRpcUrl() });
      
      const latest = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - 50000);
      
      console.log('Fetching events from block:', fromBlock, 'to', latest);
      
      console.log('Query params:', {
        address: contractAddress,
        from_block: { block_number: fromBlock },
        to_block: { block_number: latest },
        chunk_size: 100
      });
      
      const events = await provider.getEvents({
        address: contractAddress,
        from_block: { block_number: fromBlock },
        to_block: { block_number: latest },
        chunk_size: 1000
      });
      
      console.log('Events found:', events.events?.length || 0);
      
      // Enhanced event decoding with meaningful data extraction
      const decodedEvents = (events.events || []).map(event => {
        let eventName = 'Unknown Event';
        let decodedData: any = {};
        
        if (event.keys && event.keys.length > 0) {
          const eventKey = event.keys[0];
          
          // Transfer event
          if (eventKey === '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9') {
            eventName = 'Transfer';
            if (event.data && event.data.length >= 3) {
              decodedData = {
                from: event.data[0],
                to: event.data[1],
                amount: parseInt(event.data[2], 16).toString()
              };
            }
          }
          // Approval event
          else if (eventKey === '0x1dcde06aabdbca2f80aa51392b345d7549d7757aa855f7e37f5d335ac8243b1') {
            eventName = 'Approval';
            if (event.data && event.data.length >= 3) {
              decodedData = {
                owner: event.data[0],
                spender: event.data[1],
                amount: parseInt(event.data[2], 16).toString()
              };
            }
          }
          // Swap events (common in DEX)
          else if (eventKey.includes('302b4aa3237648863fc569a648f3625780753ababf66d86fd6f7e7bbc648c63')) {
            eventName = 'Swap';
            if (event.data && event.data.length >= 4) {
              decodedData = {
                user: event.data[0],
                token_in: event.data[1],
                token_out: event.data[2],
                amount: parseInt(event.data[3], 16).toString()
              };
            }
          }
          // Deposit/Withdrawal events
          else if (eventKey.includes('1dcde06aabdbca2f80aa51392b345d7549d7757aa855f7e37f5d335ac8243b1')) {
            eventName = event.data && event.data[0] === '0x1' ? 'Deposit' : 'Withdrawal';
            if (event.data && event.data.length >= 2) {
              decodedData = {
                user: event.keys[1] || 'Unknown',
                amount: parseInt(event.data[1] || '0', 16).toString()
              };
            }
          }
        }
        
        return { 
          ...event, 
          event_name: eventName,
          decoded_data: decodedData,
          timestamp: new Date().toISOString() // Add timestamp
        };
      });
      
      return decodedEvents;
    } catch (error) {
      console.error('RPC failed:', getRpcUrl(), error);
      switchToNextRpc();
      if (i === RPC_ENDPOINTS.length - 1) {
        throw error;
      }
    }
  }
  throw new Error('All RPC endpoints failed');
}

export default function ContractEventsEDA() {
  const [address, setAddress] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  const validateAddress = (addr: string) => {
    const cleaned = addr.trim();
    if (!cleaned) return false;
    if (!cleaned.startsWith('0x')) return false;
    if (cleaned.length !== 66) return false;
    return /^0x[0-9a-fA-F]{64}$/.test(cleaned);
  };

  const handleFetch = async () => {
    const cleanAddress = address.trim();
    
    if (!cleanAddress) {
      setError('Please enter a contract address');
      return;
    }
    
    if (!validateAddress(cleanAddress)) {
      setError('Invalid contract address format. Must be 0x followed by 64 hex characters.');
      return;
    }
    
    setLoading(true);
    setError('');
    setEvents([]);
    
    try {
      console.log('Fetching events for contract:', cleanAddress);
      const evs = await fetchEvents(cleanAddress);
      console.log('Events found:', evs.length);
      
      setEvents(evs);
      
      // Calculate stats like Dune
      if (evs.length > 0) {
        const eventTypes = evs.reduce((acc: any, ev) => {
          const type = ev.event_name || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        const blocks = [...new Set(evs.map(ev => ev.block_number))];
        const transactions = [...new Set(evs.map(ev => ev.transaction_hash))];
        
        setStats({
          totalEvents: evs.length,
          uniqueBlocks: blocks.length,
          uniqueTransactions: transactions.length,
          eventTypes,
          dateRange: {
            from: Math.min(...blocks),
            to: Math.max(...blocks)
          }
        });
        
        setError(`✓ Successfully fetched ${evs.length} events from contract`);
      } else {
        setStats(null);
        setError(`✓ Contract address is valid, but no events found in the last 50,000 blocks.`);
      }
    } catch (e: any) {
      console.error('Fetch error:', e);
      if (e.message.includes('Contract not found')) {
        setError('Contract not found. Please verify the address is deployed on Starknet mainnet.');
      } else if (e.message.includes('Invalid contract address')) {
        setError('Invalid contract address. Please check the format and try again.');
      } else {
        setError(`Network error: ${e.message}. Please try again or check your connection.`);
      }
      setEvents([]);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    if (events.length === 0) return;
    
    const headers = ['Block', 'Event Type', 'From/User', 'To/Target', 'Amount', 'Tx Hash'];
    const csvContent = [
      headers.join(','),
      ...events.map(ev => [
        ev.block_number,
        ev.event_name || 'Unknown Event',
        ev.decoded_data?.from || ev.decoded_data?.user || ev.decoded_data?.owner || 'N/A',
        ev.decoded_data?.to || ev.decoded_data?.spender || ev.decoded_data?.token_out || 'N/A',
        ev.decoded_data?.amount ? (parseInt(ev.decoded_data.amount) / 1e18).toFixed(6) : 'N/A',
        ev.transaction_hash || 'N/A'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_events_${address.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (events.length === 0) return;
    
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_events_${address.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthenticatedSidebar />
      <div className="lg:ml-64">
          <Header title="Contract Events EDA" subtitle="Basic event analysis for any Starknet contract" />
          <main className="p-6 space-y-6">
            <Card className="glass max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>Enter Mainnet Contract Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="0x07070d915635269ea0930fa1c538f2d026e02e5078884aeb007141c39f481eee"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="flex-1 font-mono text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleFetch()}
                    />
                    <Button 
                      onClick={handleFetch} 
                      disabled={loading}
                      className="bg-gradient-to-r from-primary to-accent"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          <span>Fetching...</span>
                        </div>
                      ) : (
                        'Fetch Events'
                      )}
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setAddress('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');
                        setError('');
                        setEvents([]);
                      }}
                      className="flex-1"
                    >
                      ETH Token
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setAddress('0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d');
                        setError('');
                        setEvents([]);
                      }}
                      className="flex-1"
                    >
                      STRK Token
                    </Button>
                  </div>
                </div>
                {error && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    error.includes('✓') 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Stats Overview - Dune Style */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Total Events</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalEvents}</p>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Unique Blocks</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.uniqueBlocks}</p>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <PieChart className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Transactions</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.uniqueTransactions}</p>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Block Range</span>
                    </div>
                    <p className="text-sm font-mono">{stats.dateRange.from} - {stats.dateRange.to}</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Event Types Distribution */}
            {stats && (
              <Card className="glass max-w-6xl mx-auto">
                <CardHeader>
                  <CardTitle>Event Types Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.eventTypes).map(([type, count]: [string, any]) => (
                      <Badge key={type} variant="secondary" className="px-3 py-1">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {events.length > 0 && (
              <Card className="glass max-w-6xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Contract Events ({events.length} found)</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button onClick={exportToJSON} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No events found for this contract.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border border-border px-3 py-2 text-left font-semibold">Block</th>
                            <th className="border border-border px-3 py-2 text-left font-semibold">Event Type</th>
                            <th className="border border-border px-3 py-2 text-left font-semibold">From/User</th>
                            <th className="border border-border px-3 py-2 text-left font-semibold">To/Target</th>
                            <th className="border border-border px-3 py-2 text-left font-semibold">Amount/Value</th>
                            <th className="border border-border px-3 py-2 text-left font-semibold">Tx Hash</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((ev, i) => (
                            <tr key={i} className="hover:bg-muted/30">
                              <td className="border border-border px-3 py-2 font-mono text-sm">{ev.block_number}</td>
                              <td className="border border-border px-3 py-2">
                                <Badge variant={ev.event_name === 'Transfer' ? 'default' : ev.event_name === 'Approval' ? 'secondary' : 'outline'}>
                                  {ev.event_name || 'Unknown'}
                                </Badge>
                              </td>
                              <td className="border border-border px-3 py-2 font-mono text-xs">
                                {ev.decoded_data?.from || ev.decoded_data?.user || ev.decoded_data?.owner || 'N/A'}
                              </td>
                              <td className="border border-border px-3 py-2 font-mono text-xs">
                                {ev.decoded_data?.to || ev.decoded_data?.spender || ev.decoded_data?.token_out || 'N/A'}
                              </td>
                              <td className="border border-border px-3 py-2 font-mono text-sm">
                                {ev.decoded_data?.amount ? 
                                  (parseInt(ev.decoded_data.amount) / 1e18).toFixed(6) + ' tokens' : 
                                  'N/A'
                                }
                              </td>
                              <td className="border border-border px-3 py-2 font-mono text-xs break-all max-w-xs">
                                {ev.transaction_hash?.slice(0, 10)}...{ev.transaction_hash?.slice(-8) || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
      </div>
    </div>
  );
}
