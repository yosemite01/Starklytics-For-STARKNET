export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  
  // Fallback AI responses when GPT-OSS unavailable
  const responses = {
    'bounty': 'To create a bounty: 1) Set your role to Bounty Creator in Profile, 2) Go to Create Bounty page, 3) Fill details and set reward amount, 4) Submit and deposit funds.',
    'network': 'Current Starknet network shows active transaction processing. Block production is consistent with average 10-second finality.',
    'platform': 'Starklytics Suite offers analytics dashboards, bounty creation, and real-time Starknet data visualization.',
    'default': 'I can help with bounties, analytics, platform features, and Starknet data interpretation. What would you like to know?'
  };

  const key = Object.keys(responses).find(k => message.toLowerCase().includes(k)) || 'default';
  
  res.status(200).json({ 
    response: responses[key]
  });
}