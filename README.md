# Blockchain Prediction Market — Phase 1 MVP

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── models/Market.js
│   │   ├── routes/markets.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletBar.jsx
│   │   │   ├── CreateMarket.jsx
│   │   │   └── MarketCard.jsx
│   │   ├── hooks/
│   │   │   ├── useWallet.js
│   │   │   └── useContract.js
│   │   ├── contract.js   ← put your address + ABI here
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
```

## Setup

### 1. Contract

Open `frontend/src/contract.js` and replace:
- `CONTRACT_ADDRESS` with your deployed contract address
- `CONTRACT_ABI` array entries if your actual ABI differs (especially the `createMarket` return type and event)

### 2. Backend

```bash
cd backend
cp .env.example .env        # edit MONGO_URI if needed
# Add your Gemini API key for AI verification feature
npm install
npm run dev                 # or: npm start
```

**Required Environment Variables:**
- `MONGO_URI`: MongoDB connection string
- `PORT`: Backend port (default: 5000)
- `GEMINI_API_KEY`: Google Gemini API key for resolution verification
- `CHALLENGE_THRESHOLD`: Number of challenges needed to trigger AI verification (default: 3)

Runs on `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` (proxies `/markets` to the backend automatically)

## Notes

- Make sure MongoDB is running locally, or update `MONGO_URI` in `backend/.env` to point to your Atlas cluster.
- The `createMarket` marketId extraction in `CreateMarket.jsx` uses the last event log. Adjust the parsing logic to match your contract's actual event signature if needed.
- MetaMask must be connected to the same network your contract is deployed on.

## Features

### AI-Powered Resolution Verification
Users can challenge market resolutions they believe are incorrect. Once 3 challenges are submitted, Google's Gemini AI automatically verifies the proof URL and resolution accuracy. Markets display verification badges (✓ Verified, ⚠ Disputed) based on AI analysis.

See [VERIFICATION_FEATURE.md](./VERIFICATION_FEATURE.md) for detailed documentation.
