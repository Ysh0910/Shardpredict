const express = require('express');
const router  = express.Router();
const Market  = require('../models/Market');
const { verifyMarketResolution } = require('../services/geminiVerification');

// POST /markets
router.post('/', async (req, res) => {
  const { marketId, question, creator, category, image } = req.body;

  if (marketId === undefined || !question || !creator) {
    return res.status(400).json({ error: 'marketId, question, and creator are required.' });
  }

  try {
    const market = await Market.findOneAndUpdate(
      { marketId },
      { marketId, question, creator, category: category || 'Custom', image: image || null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(market);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /markets/resolve
router.post('/resolve', async (req, res) => {
  const { marketId, proof, outcome } = req.body;

  if (marketId === undefined || outcome === undefined) {
    return res.status(400).json({ error: 'marketId and outcome are required.' });
  }

  try {
    const market = await Market.findOneAndUpdate(
      { marketId },
      { resolved: true, outcome: Boolean(outcome), proof: proof || null },
      { new: true }
    );
    if (!market) return res.status(404).json({ error: 'Market not found.' });
    res.json(market);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /markets
router.get('/', async (_req, res) => {
  try {
    const markets = await Market.find().sort({ createdAt: -1 });
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /markets/challenge
router.post('/challenge', async (req, res) => {
  const { marketId, wallet } = req.body;

  if (marketId === undefined || !wallet) {
    return res.status(400).json({ error: 'marketId and wallet are required.' });
  }

  try {
    const market = await Market.findOne({ marketId });
    if (!market) return res.status(404).json({ error: 'Market not found.' });
    if (!market.resolved) return res.status(400).json({ error: 'Market is not resolved yet.' });

    // Check if user already challenged
    const alreadyChallenged = market.challenges.some(c => c.wallet.toLowerCase() === wallet.toLowerCase());
    if (alreadyChallenged) {
      return res.status(400).json({ error: 'You have already challenged this market.' });
    }

    // Add challenge
    market.challenges.push({ wallet: wallet.toLowerCase() });
    await market.save();

    const threshold = parseInt(process.env.CHALLENGE_THRESHOLD || '3');
    const challengeCount = market.challenges.length;

    // If threshold reached, trigger Gemini verification
    if (challengeCount >= threshold && market.verificationStatus === 'pending') {
      market.verificationStatus = 'verifying';
      await market.save();

      // Run verification asynchronously
      verifyMarketResolution(market.question, market.outcome, market.proof)
        .then(async (result) => {
          market.verificationResult = result.reasoning;
          market.verifiedAt = new Date();
          
          if (result.isVerified && result.confidence >= 70) {
            market.verificationStatus = 'verified';
          } else if (result.confidence < 40) {
            market.verificationStatus = 'disputed';
          } else {
            market.verificationStatus = 'unverified';
          }
          
          await market.save();
          console.log(`Market ${marketId} verification complete: ${market.verificationStatus}`);
        })
        .catch(err => {
          console.error('Verification error:', err);
          market.verificationStatus = 'unverified';
          market.verificationResult = 'Verification failed';
          market.save();
        });
    }

    res.json({ 
      challengeCount,
      threshold,
      verificationTriggered: challengeCount >= threshold,
      market 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
