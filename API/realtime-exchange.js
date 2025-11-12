// api/realtime-exchange.js
export default async function handler(req, res) {
  // Allow requests from Articulate Review and your domains
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle pre-flight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { sdp, type } = req.body || {};
  
  if (!sdp || type !== 'offer') {
    return res.status(400).json({ error: 'Invalid offer' });
  }

  try {
    // Exchange with OpenAI Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp'
      },
      body: sdp
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      return res.status(response.status).json({ error: 'OpenAI API error' });
    }

    const answerSdp = await response.text();
    return res.status(200).json({ 
      answer: { type: 'answer', sdp: answerSdp }
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
