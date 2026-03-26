# Blockchain Prediction Market — Phase 1 MVP

## About the Project

A decentralized prediction market platform built on Ethereum-compatible blockchains where users can create markets, place bets on outcomes, and earn rewards. The platform combines smart contract functionality with a modern web interface and AI-powered resolution verification.

### Key Features

- **Wallet Integration**: Connect via MetaMask to interact with prediction markets
- **Market Creation**: Create custom prediction markets with any yes/no question
- **Decentralized Betting**: Place bets on YES or NO outcomes with ETH/SHM
- **Real-time Pool Tracking**: View live betting pools and odds for each market
- **Market Resolution**: Resolve markets and distribute rewards to winners
- **AI Verification**: Google Gemini AI automatically verifies disputed resolutions
- **Challenge System**: Community-driven dispute mechanism with verification badges

### Tech Stack

- **Frontend**: React + Vite, TailwindCSS, Ethers.js, Framer Motion
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Smart Contract**: Solidity (deployed on Ethereum-compatible networks)
- **AI Integration**: Google Gemini API for resolution verification
- **Wallet**: MetaMask browser extension

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- MongoDB (local or Atlas cluster)
- Git

### Clone the Repository

```bash
git clone <your-repository-url>
cd blockchain-prediction-market
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Market.js
│   │   │   └── User.js
│   │   ├── routes/markets.js
│   │   ├── services/geminiVerification.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletBar.jsx
│   │   │   ├── CreateMarket.jsx
│   │   │   ├── MarketCard.jsx
│   │   │   └── Navbar.jsx
│   │   ├── hooks/
│   │   │   ├── useWallet.js
│   │   │   ├── useContract.js
│   │   │   └── useTheme.js
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── MarketDetail.jsx
│   │   │   └── CreateMarketPage.jsx
│   │   ├── contract.js   ← Contract address + ABI
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Smart Contract Deployment

### Option 1: Use Existing Deployed Contract

The project is already configured with a deployed contract at:
```
0x2945bB558465467613419DB908E1628Dd1A2c180
```

If you want to use this contract, skip to the Backend Setup section.

### Option 2: Deploy Your Own Contract via Remix IDE

If you want to deploy your own instance of the contract:

#### Step 1: Access Remix IDE

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create a new file: `PredictionMarket.sol`

#### Step 2: Contract Code

Copy the Solidity contract code into Remix. The contract includes:
- `createMarket(string _question)` - Create a new prediction market
- `betYes(uint256 marketId)` - Bet on YES outcome (payable)
- `betNo(uint256 marketId)` - Bet on NO outcome (payable)
- `resolveMarket(uint256 marketId, bool _outcome)` - Resolve market (owner only)
- `claim(uint256 marketId)` - Claim winnings after resolution
- `getMarket(uint256 marketId)` - View market details

#### Step 3: Compile

1. Go to the "Solidity Compiler" tab (left sidebar)
2. Select compiler version matching your contract (e.g., `0.8.x`)
3. Click "Compile PredictionMarket.sol"
4. Ensure there are no errors

#### Step 4: Deploy

1. Go to the "Deploy & Run Transactions" tab
2. Select "Environment":
   - **Remix VM**: For local testing (no real funds)
   - **Injected Provider - MetaMask**: For testnet/mainnet deployment
3. If using MetaMask:
   - Ensure you're connected to the correct network (e.g., Sepolia, Polygon Mumbai, or your preferred testnet)
   - Ensure you have testnet ETH/tokens for gas fees
4. Click "Deploy"
5. Confirm the transaction in MetaMask (if applicable)
6. Copy the deployed contract address from the "Deployed Contracts" section

#### Step 5: Get the ABI

1. In Remix, after compilation, go to the "Solidity Compiler" tab
2. Scroll down and click the "ABI" button to copy the contract ABI
3. Save this ABI for the next step

#### Step 6: Update Frontend Configuration

Open `frontend/src/contract.js` and update:
```javascript
export const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
export const CONTRACT_ABI = [ /* paste your ABI here */ ];
```

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

```env
# MongoDB connection string (local or Atlas)
MONGO_URI=mongodb://localhost:27017/prediction-market

# Backend server port
PORT=5000

# Google Gemini API key for AI verification
GEMINI_API_KEY=your_gemini_api_key_here

# Number of challenges needed to trigger AI verification
CHALLENGE_THRESHOLD=3
```

**Getting a Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into your `.env` file

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas:**
Update `MONGO_URI` in `.env` with your Atlas connection string.

### 4. Run the Backend

```bash
npm run dev    # Development mode with auto-reload
# or
npm start      # Production mode
```

Backend runs on `http://localhost:5000`

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Contract (if using your own deployment)

If you deployed your own contract, update `frontend/src/contract.js`:
```javascript
export const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS';
export const CONTRACT_ABI = [ /* your ABI */ ];
```

### 3. Run the Frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

The Vite dev server automatically proxies `/markets` requests to the backend at `http://localhost:5000`.

---

## Usage

1. **Connect Wallet**: Click "Connect Wallet" in the navbar and approve MetaMask connection
2. **Create Market**: Navigate to "Create Market" and submit a yes/no question
3. **View Markets**: Browse all active markets on the home page
4. **Place Bets**: Enter an amount and click "Bet YES" or "Bet NO" on any market
5. **Resolve Markets**: Market creators can resolve markets with proof URLs
6. **Challenge Resolutions**: Users can challenge incorrect resolutions (3 challenges trigger AI verification)
7. **Claim Rewards**: Winners can claim their rewards after market resolution

---

## Features in Detail

### Core Functionality
- **Wallet Connection**: MetaMask integration for secure blockchain interactions
- **Market Creation**: Create prediction markets with custom questions
- **Betting System**: Place bets on YES or NO outcomes with real ETH/tokens
- **Pool Tracking**: Real-time display of betting pools and implied odds
- **Market Resolution**: Resolve markets with proof URLs
- **Reward Distribution**: Automatic calculation and claiming of winnings

### AI-Powered Resolution Verification
Users can challenge market resolutions they believe are incorrect. Once the challenge threshold (default: 3) is reached, Google's Gemini AI automatically:
- Analyzes the proof URL provided by the market creator
- Verifies the resolution accuracy against the market question
- Displays verification badges:
  - ✓ **Verified**: AI confirms resolution is correct
  - ⚠ **Disputed**: AI found issues with the resolution

See [VERIFICATION_FEATURE.md](./VERIFICATION_FEATURE.md) for detailed documentation.

---

## Network Configuration

### Supported Networks

The contract can be deployed on any Ethereum-compatible network:
- Ethereum Mainnet
- Ethereum Testnets (Sepolia, Goerli)
- Polygon (Mumbai testnet, Mainnet)
- Binance Smart Chain
- Avalanche
- Arbitrum
- Optimism

### MetaMask Network Setup

Ensure MetaMask is connected to the same network where your contract is deployed:

1. Open MetaMask
2. Click the network dropdown at the top
3. Select your network or click "Add Network" to configure a custom network
4. Match the network to your contract deployment

---

## Troubleshooting

### Common Issues

**MetaMask not detected:**
- Ensure MetaMask extension is installed and enabled
- Refresh the page after installing MetaMask

**Transaction fails:**
- Check you have sufficient ETH/tokens for gas fees
- Verify you're on the correct network
- Ensure the contract address is correct

**Markets not loading:**
- Verify backend is running on port 5000
- Check MongoDB connection in backend logs
- Ensure CORS is properly configured

**Contract calls fail:**
- Verify CONTRACT_ADDRESS in `frontend/src/contract.js`
- Ensure CONTRACT_ABI matches your deployed contract
- Check MetaMask is connected to the correct network

**AI verification not working:**
- Verify GEMINI_API_KEY is set in backend `.env`
- Check backend logs for API errors
- Ensure proof URLs are accessible

---

## Development Notes

### Architecture

The application follows a three-tier architecture:

1. **Smart Contract Layer**: Handles all financial transactions and market state
2. **Backend API Layer**: Stores market metadata, manages challenges, and coordinates AI verification
3. **Frontend Layer**: Provides user interface and wallet integration

### Key Design Decisions

- **Hybrid Storage**: Market metadata stored in MongoDB for fast queries, while financial data lives on-chain
- **Event-Driven**: Frontend listens to contract events for real-time updates
- **Challenge Threshold**: Prevents spam while ensuring community oversight
- **AI Integration**: Automated verification reduces manual moderation needs

### Testing

**Frontend:**
```bash
cd frontend
npm run build    # Test production build
npm run preview  # Preview production build
```

**Backend:**
```bash
cd backend
npm start        # Run in production mode
```

### Deployment

**Frontend (Vercel/Netlify):**
1. Build: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables if needed

**Backend (Heroku/Railway/DigitalOcean):**
1. Set environment variables
2. Deploy with `npm start` as the start command
3. Ensure MongoDB connection string is configured

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Additional Resources

- [Remix IDE Documentation](https://remix-ide.readthedocs.io/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Verification Feature Guide](./VERIFICATION_FEATURE.md)
- [Setup Guide](./SETUP_GUIDE.md)

---

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation in the repository
- Review the troubleshooting section above
