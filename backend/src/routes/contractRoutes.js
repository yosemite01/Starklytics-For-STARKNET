const express = require('express');
const router = express.Router();

// Analyze contract endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { contractAddress } = req.body;
    
    if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 66) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract address format'
      });
    }

    console.log(`🔍 Analyzing contract: ${contractAddress}`);

    // Starknet RPC endpoints
    const endpoints = [
      "https://starknet-mainnet.public.blastapi.io",
      "https://free-rpc.nethermind.io/mainnet-juno"
    ];

    // Get current block number
    const blockResponse = await fetch(endpoints[0], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'starknet_blockNumber',
        params: [],
        id: 1
      })
    });

    const blockData = await blockResponse.json();
    const currentBlock = parseInt(blockData.result, 16);
    console.log(`📦 Current block: ${currentBlock}`);

    // Search recent blocks for contract activity
    const contractTransactions = [];
    const searchBlocks = 1000; // Search last 1000 blocks for better coverage

    for (let i = 0; i < searchBlocks; i++) {
      const blockNum = currentBlock - i;
      
      try {
        const response = await fetch(endpoints[0], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'starknet_getBlockWithTxs',
            params: [{ block_number: blockNum }],
            id: i + 2
          })
        });

        const data = await response.json();
        const block = data.result;

        if (block && block.transactions) {
          // Filter transactions involving this contract
          const relevantTxs = block.transactions.filter(tx => 
            tx.sender_address === contractAddress ||
            tx.contract_address === contractAddress ||
            (tx.calldata && tx.calldata.some(call => call.includes(contractAddress.slice(2))))
          );

          contractTransactions.push(...relevantTxs.map(tx => ({
            block_number: blockNum,
            transaction_hash: tx.transaction_hash,
            sender_address: tx.sender_address,
            contract_address: contractAddress,
            max_fee: tx.max_fee || '0x0',
            type: tx.type || 'INVOKE',
            timestamp: block.timestamp
          })));
        }
      } catch (blockError) {
        console.warn(`⚠️ Failed to fetch block ${blockNum}:`, blockError.message);
      }
    }

    console.log(`📊 Found ${contractTransactions.length} transactions`);

    if (contractTransactions.length === 0) {
      // Try to get contract class info
      let contractInfo = 'Unknown Contract';
      try {
        const classResponse = await fetch(endpoints[0], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'starknet_getClassAt',
            params: [contractAddress, 'latest'],
            id: 999
          })
        });
        const classData = await classResponse.json();
        if (classData.result && !classData.error) {
          contractInfo = 'Valid Contract (Deployed)';
        }
      } catch (e) {
        contractInfo = 'Contract Not Found or Invalid';
      }

      return res.json({
        success: true,
        data: {
          contract_address: contractAddress,
          status: 'No Recent Activity',
          contract_info: contractInfo,
          message: `No transactions found in the last ${searchBlocks} blocks. This contract may be inactive or have older transactions.`,
          suggestion: 'Try a more active contract address, or this contract may have been deployed before the search range.',
          blocks_searched: searchBlocks,
          current_block: currentBlock,
          search_range: `Block ${currentBlock - searchBlocks} to ${currentBlock}`,
          transactions: []
        }
      });
    }

    // Calculate metrics
    const totalFees = contractTransactions.reduce((sum, tx) => sum + parseInt(tx.max_fee, 16), 0);
    const avgFee = totalFees / contractTransactions.length;
    const uniqueSenders = new Set(contractTransactions.map(tx => tx.sender_address)).size;

    res.json({
      success: true,
      data: {
        contract_address: contractAddress,
        status: 'Active',
        transaction_count: contractTransactions.length,
        avg_fee: (avgFee / 1e18).toFixed(6),
        total_fees: (totalFees / 1e18).toFixed(4),
        unique_senders: uniqueSenders,
        blocks_analyzed: searchBlocks,
        current_block: currentBlock,
        transactions: contractTransactions.slice(0, 10) // Return first 10 transactions
      }
    });

  } catch (error) {
    console.error('❌ Contract analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze contract',
      error: error.message
    });
  }
});

module.exports = router;