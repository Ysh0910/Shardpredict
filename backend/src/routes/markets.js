const express = require('express');
const router  = express.Router();
const Market  = require('../models/Market');

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

module.exports = router;
