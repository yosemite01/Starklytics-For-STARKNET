import { useState } from 'react';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


const RPC_ENDPOINTS = [
  'https://starknet-mainnet.reddio.com/rpc/v0_7',
  'https://starknet-mainnet.public.blastapi.io',
  'https://free-rpc.nethermind.io/mainnet-juno'
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
  try {
    const latest = await getLatestBlockNumber();
    console.log('Latest block:', latest);
    
    // Try with a wider range - last 1000 blocks instead of 2 weeks
    const fromBlock = Math.max(0, latest - 1000);
    console.log('Fetching events from block:', fromBlock, 'to', latest);
    
    const body = {
      jsonrpc: "2.0",
      method: "starknet_getEvents",
      params: {
        filter: {
          address: contractAddress,
          from_block: { block_number: fromBlock },
          to_block: { block_number: latest },
          keys: []
        },
        chunk_size: 100
      },
      id: 1
    };
    
    console.log('Fetching events with body:', body);
    
    const res = await fetch(getRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    console.log('RPC response:', data);
    
    if (data.error) {
      throw new Error(data.error.message || 'RPC Error');
    }
    
    return data.result ? data.result.events || [] : [];
  } catch (e) {
    console.error('Error fetching events:', e);
    throw e;
  }
}

export default function ContractEventsEDA() {
  const [address, setAddress] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    if (!address.trim()) {
      setError('Please enter a contract address');
      return;
    }
    
    setLoading(true);
    setError('');
    setEvents([]);
    
    try {
      console.log('Fetching events for contract:', address?.replace(/[\r\n]/g, '').slice(0, 66));
      const evs = await fetchEvents(address.trim());
      console.log('Events found:', evs.length);
      
      if (evs.length === 0) {
        // Show demo events for contracts with no activity
        const demoEvents = [
          {
            block_number: 123456,
            keys: ['0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9',
                   '0x1234567890abcdef1234567890abcdef12345678'],
            data: ['0x1', '0x5f5e100', '0x64'],
            transaction_hash: '0x0123456789abcdef0123456789abcdef01234567',
            event_name: 'BountyCreated'
          },
          {
            block_number: 123457,
            keys: ['0x1dcde06aabdbca2732de817ba6614a4f4c1fb4ffcea3b8cf1a5e4c8c9e8e8e8',
                   '0x2345678901bcdef2345678901bcdef23456789'],
            data: ['0x1', '0x7890abcdef123456'],
            transaction_hash: '0x1234567890abcdef1234567890abcdef12345678',
            event_name: 'ParticipantJoined'
          }
        ];
        setEvents(demoEvents);
        setError(`No events found for contract ${address.slice(0,10)}... in the last 1000 blocks. This is normal for contracts with no recent activity. Showing demo events below.`);
      } else {
        setEvents(evs);
        setError('');
      }
    } catch (e: any) {
      console.error('Fetch error:', e);
      setError(`Failed to fetch events: ${e.message || 'Unknown error'}. Please check the contract address and try again.`);
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
                      placeholder="0x..."
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleFetch} disabled={loading || !address}>
                      {loading ? 'Loading...' : 'Fetch Events'}
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAddress('0x07070d915635269ea0930fa1c538f2d026e02e5078884aeb007141c39f481eee')}
                      className="flex-1"
                    >
                      Starklytics Contract
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAddress('0x067883deb1c1cb60756eb6e60d500081352441a040d5039d0e4ce9fed35d68c1')}
                      className="flex-1"
                    >
                      Test Contract
                    </Button>
                  </div>
                </div>
                {error && <div className={`mt-2 ${error.includes('demo') ? 'text-yellow-500' : 'text-red-500'}`}>{error}</div>}
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
