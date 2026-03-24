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
npm install
npm run dev                 # or: npm start
```

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
