require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const marketsRouter = require('./routes/markets');
const usersRouter   = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/markets', marketsRouter);
app.use('/users',   usersRouter);

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prediction-market')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
