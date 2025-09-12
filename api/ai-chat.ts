import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = req.body;

  try {
    // Call the local GPT-OSS model
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for Starklytics Suite, a Starknet analytics and bounty platform. 
            Help users understand:
            - Starknet RPC data and analytics
            - Bounty creation and participation
            - Platform features and navigation
            - Smart contract interactions
            
            Context: ${context || 'No additional context provided'}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 256,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json({ 
      response: data.choices[0].message.content 
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      error: 'AI service unavailable. Please ensure the GPT-OSS model is running on localhost:8000' 
    });
  }
}