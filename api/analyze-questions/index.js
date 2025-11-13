export default async function handler(req, res) {
  // CORS headers
  const allowedOrigins = [
    'https://articulateusercontent.com',
    'https://content.articulate.com',
    'https://rise.articulate.com',
    'https://360.articulate.com'
  ];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript } = req.body;

    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: 'Transcript array is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Format transcript for analysis
    const conversationText = transcript.map(t => 
      `${t.speaker}: ${t.text}`
    ).join('\n\n');

    const analysisPrompt = `You are an expert interview coach specializing in the STAR method (Situation, Task, Action, Result). Analyze this interview transcript where a hiring manager is practicing behavioral interview follow-up questions.

TRANSCRIPT:
${conversationText}

EVALUATION CRITERIA:
Rate the interviewer's follow-up questions on:
1. Did they probe for missing STAR components?
2. Were questions open-ended (not yes/no)?
3. Did they ask for specific examples and metrics?
4. Did they avoid leading questions?
5. Did they listen and build on previous answers?

Provide feedback in the following JSON structure:
{
  "overall_score": 0-100,
  "overall_rating": "Excellent/Good/Needs Improvement/Poor",
  "strengths": ["List 2-3 specific things they did well"],
  "weaknesses": ["List 2-3 specific areas to improve"],
  "question_analysis": [
    {
      "question": "The actual question asked",
      "score": 0-25,
      "feedback": "Why this question was strong/weak",
      "missing_star_component": "S/T/A/R or null if question was complete",
      "suggested_improvement": "How to improve this question"
    }
  ],
  "star_coverage": {
    "situation": {"probed": true/false, "quality": "good/weak/missing"},
    "task": {"probed": true/false, "quality": "good/weak/missing"},
    "action": {"probed": true/false, "quality": "good/weak/missing"},
    "result": {"probed": true/false, "quality": "good/weak/missing"}
  },
  "best_question": "Quote the strongest question asked",
  "worst_question": "Quote the weakest question asked",
  "next_steps": ["3 specific action items for improvement"]
}

Be specific and reference actual questions from the transcript. Provide actionable coaching.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-2024-08-06',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Analyze interview transcripts and provide structured, actionable feedback. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return res.status(response.status).json({ error: 'Failed to analyze questions' });
    }

    const data = await response.json();
    const feedback = JSON.parse(data.choices[0].message.content);

    console.log('Generated feedback:', feedback);

    return res.status(200).json({
      feedback: feedback,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in analyze-questions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
