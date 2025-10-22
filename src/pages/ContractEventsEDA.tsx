import { useState } from 'react';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


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
      const fromBlock = Math.max(0, latest - 1000);
      
      console.log('Fetching events from block:', fromBlock, 'to', latest);
      
      const events = await provider.getEvents({
        address: contractAddress,
        from_block: { block_number: fromBlock },
        to_block: { block_number: latest },
        chunk_size: 100
      });
      
      console.log('Events found:', events.events?.length || 0);
      return events.events || [];
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
      if (evs.length === 0) {
        setError(`✓ Contract address is valid, but no events found in the last 1000 blocks.`);
      } else {
        setError(`✓ Successfully fetched ${evs.length} events from contract`);
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
            {(events.length > 0 || error.includes('demo')) && (
              <Card className="glass max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle>Contract Events ({events.length} found)</CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No events found for this contract.</p>
                      <p className="text-sm mt-2">This is normal for newly deployed contracts with no activity.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((ev, i) => (
                        <div key={i} className="border border-border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm text-muted-foreground">Block Number</h4>
                              <p className="font-mono">{ev.block_number}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-muted-foreground">Event Type</h4>
                              <p>{ev.event_name || 'Unknown Event'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <h4 className="font-semibold text-sm text-muted-foreground">Event Keys</h4>
                              <p className="font-mono text-xs break-all">{ev.keys?.join(', ') || 'No keys'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <h4 className="font-semibold text-sm text-muted-foreground">Event Data</h4>
                              <p className="font-mono text-xs break-all">{ev.data?.join(', ') || 'No data'}</p>
                            </div>
                            {ev.transaction_hash && (
                              <div className="md:col-span-2">
                                <h4 className="font-semibold text-sm text-muted-foreground">Transaction Hash</h4>
                                <p className="font-mono text-xs break-all">{ev.transaction_hash}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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
