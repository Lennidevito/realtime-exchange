// api/realtime-exchange.js
export default async function handler(req, res) {
  // Allow requests from your Storyline course
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle pre-flight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the connection info from Storyline
  const { sdp, type } = req.body || {};
  
  if (!sdp || type !== 'offer') {
    return res.status(400).json({ error: 'bad_offer' });
  }

  // Talk to OpenAI with your secret key
  const r = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/sdp'
    },
    body: sdp
  });

  // Get OpenAI's reply and send it back to Storyline
  const answerSdp = await r.text();
  return res.status(200).json({ 
    answer: { type: 'answer', sdp: answerSdp }
  });
}
