export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bountyId, amount, token } = req.body;
  
  if (!bountyId || !amount || !token) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Simulate deposit process
  setTimeout(() => {
    res.status(200).json({ 
      success: true, 
      tx: `0x${Math.random().toString(16).substr(2, 8)}`,
      message: 'Deposit simulated successfully'
    });
  }, 1000);
}