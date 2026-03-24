const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

// GET /users/:wallet — fetch score
router.get('/:wallet', async (req, res) => {
  try {
    const user = await User.findOne({ wallet: req.params.wallet.toLowerCase() });
    res.json({ wallet: req.params.wallet, score: user ? user.score : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users/score — add points
// body: { wallet, points }
router.post('/score', async (req, res) => {
  const { wallet, points } = req.body;
  if (!wallet || points === undefined) {
    return res.status(400).json({ error: 'wallet and points are required.' });
  }
  try {
    const user = await User.findOneAndUpdate(
      { wallet: wallet.toLowerCase() },
      { $inc: { score: points } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
