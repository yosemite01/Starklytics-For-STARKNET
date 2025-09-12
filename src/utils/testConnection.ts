import { RpcProvider } from 'starknet';

export const testSupabaseConnection = async () => {
  try {
    const response = await fetch('https://yxpbcuoyahjdharayzgs.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cGJjdW95YWhqZGhhcmF5emdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5Njc2NzIsImV4cCI6MjA3MTU0MzY3Mn0.sH4CrEtGEnfO1ns9k6Ppt24kRG398HHznVgkX9EGlQs'
      }
    });
    console.log('Supabase connection test:', response.status, response.statusText);
    return response.ok;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
};

export const testRpcConnection = async () => {
  const endpoints = {
    REDDIO_V6: 'https://starknet-mainnet.reddio.com',
    REDDIO_V7: 'https://starknet-mainnet.reddio.com/rpc/v0_7'
  };

  const results = {
    reddio_v6: { status: false, latency: 0, blockNumber: 0 },
    reddio_v7: { status: false, latency: 0, blockNumber: 0 }
  };

  for (const [network, url] of Object.entries(endpoints)) {
    const provider = new RpcProvider({ nodeUrl: url });
    const startTime = Date.now();
    
    try {
      const blockNumber = await provider.getBlockNumber();
      const endTime = Date.now();
      const key = network.toLowerCase();
      results[key].status = true;
      results[key].latency = endTime - startTime;
      results[key].blockNumber = blockNumber;
      console.log(`${network} RPC Success:`, { blockNumber, latency: results[key].latency });
    } catch (error) {
      console.error(`${network} RPC Connection failed:`, error);
    }
  }

  return results;
};

export const getStarknetProvider = () => {
  return new RpcProvider({ nodeUrl: 'https://starknet-mainnet.reddio.com/rpc/v0_7' });
};