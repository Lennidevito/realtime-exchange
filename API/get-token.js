// This file runs on Vercel's server to create secure tokens
// It keeps your OpenAI API key safe and hidden from learners

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call OpenAI to create a temporary token (expires in 60 seconds)
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy'
      })
    });

    const data = await response.json();
    
    // Send the temporary token back to Storyline
    res.status(200).json({
      token: data.client_secret.value
    });
  } catch (error) {
    // If something goes wrong, send an error message
    res.status(500).json({ error: 'Failed to create token' });
  }
}
