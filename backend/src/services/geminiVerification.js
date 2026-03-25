const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function verifyMarketResolution(question, outcome, proofUrl) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  if (!proofUrl) {
    return {
      isVerified: false,
      confidence: 0,
      reasoning: 'No proof URL provided by the host',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a fact-checking AI for a prediction market platform. 
    
Market Question: "${question}"
Host's Resolution: ${outcome ? 'YES' : 'NO'}
Proof URL: ${proofUrl}

Your task:
1. Analyze if the proof URL is relevant and credible
2. Determine if the resolution (${outcome ? 'YES' : 'NO'}) is accurate based on the question
3. Provide a confidence score (0-100)

Respond in this exact JSON format:
{
  "isVerified": true/false,
  "confidence": 0-100,
  "reasoning": "brief explanation"
}

Note: If you cannot access the URL or it's invalid, set isVerified to false and explain why.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      isVerified: parsed.isVerified === true,
      confidence: parsed.confidence || 0,
      reasoning: parsed.reasoning || 'No reasoning provided',
    };
  } catch (error) {
    console.error('Gemini verification error:', error.message);
    return {
      isVerified: false,
      confidence: 0,
      reasoning: `Verification failed: ${error.message}`,
    };
  }
}

module.exports = { verifyMarketResolution };
