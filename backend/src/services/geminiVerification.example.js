/**
 * Example Gemini API Responses
 * 
 * This file shows what kind of responses you can expect from the Gemini verification system
 */

// Example 1: Valid proof, resolution is correct
const example1 = {
  question: "Will Bitcoin reach $100,000 by December 31, 2024?",
  outcome: true, // Host resolved as YES
  proofUrl: "https://coinmarketcap.com/currencies/bitcoin/",
  geminiResponse: {
    isVerified: true,
    confidence: 85,
    reasoning: "The proof URL links to CoinMarketCap showing Bitcoin's current price. Based on the question's date constraint and the credible source, the YES resolution appears accurate."
  }
};

// Example 2: Invalid proof, resolution is disputed
const example2 = {
  question: "Will India win the Cricket World Cup 2024?",
  outcome: true, // Host resolved as YES
  proofUrl: "https://example.com/fake-news",
  geminiResponse: {
    isVerified: false,
    confidence: 15,
    reasoning: "The proof URL does not appear to be a credible source. Official cricket results should come from ICC or major sports outlets. Cannot verify this resolution."
  }
};

// Example 3: No proof provided
const example3 = {
  question: "Will Tesla stock reach $300 by end of Q1 2024?",
  outcome: false, // Host resolved as NO
  proofUrl: null,
  geminiResponse: {
    isVerified: false,
    confidence: 0,
    reasoning: "No proof URL provided by the host"
  }
};

// Example 4: Proof contradicts resolution
const example4 = {
  question: "Will SpaceX launch Starship in January 2024?",
  outcome: false, // Host resolved as NO
  proofUrl: "https://spacex.com/launches/starship-january-2024",
  geminiResponse: {
    isVerified: false,
    confidence: 25,
    reasoning: "The proof URL suggests a launch did occur in January 2024, which contradicts the NO resolution. This appears to be an incorrect resolution."
  }
};

// Example 5: Ambiguous case
const example5 = {
  question: "Will AI surpass human intelligence in 2024?",
  outcome: true, // Host resolved as YES
  proofUrl: "https://news.example.com/ai-breakthrough",
  geminiResponse: {
    isVerified: false,
    confidence: 45,
    reasoning: "The question is subjective and difficult to verify objectively. While the proof shows AI progress, 'surpassing human intelligence' is not clearly defined. Moderate confidence in verification."
  }
};

module.exports = {
  example1,
  example2,
  example3,
  example4,
  example5
};
