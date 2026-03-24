const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  wallet: { type: String, required: true, unique: true, lowercase: true },
  score:  { type: Number, default: 0 },
});

module.exports = mongoose.model('User', userSchema);
