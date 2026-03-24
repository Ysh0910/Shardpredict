const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  marketId:  { type: Number, required: true, unique: true },
  question:  { type: String, required: true },
  creator:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  resolved:  { type: Boolean, default: false },
  outcome:   { type: Boolean, default: null },
  proof:     { type: String, default: null },
  category:  { type: String, default: 'Custom' },
  image:     { type: String, default: null },
});

module.exports = mongoose.model('Market', marketSchema);
