# Requirements Document

## Introduction

Phase 1 MVP of a blockchain-based prediction market. Users connect their MetaMask wallet, create prediction markets by submitting a question to a deployed smart contract, view all markets with their YES/NO bet pools, and place bets. The backend stores market metadata in MongoDB. No resolution, rewards, or authentication are in scope for this phase.

## Glossary

- **System**: The full-stack prediction market application (frontend + backend)
- **Frontend**: The React (Vite) single-page application
- **Backend**: The Node.js + Express REST API server
- **Database**: MongoDB accessed via Mongoose
- **Contract**: The already-deployed Ethereum-compatible smart contract
- **Wallet**: The user's MetaMask browser extension
- **Market**: A prediction question with associated YES/NO bet pools on-chain
- **MarketId**: The numeric identifier returned by the Contract when a market is created
- **Creator**: The Ethereum address of the wallet that created a market
- **Pool**: The total ETH/SHM staked on a given outcome (YES or NO) for a market

---

## Requirements

### Requirement 1: Wallet Connection

**User Story:** As a user, I want to connect my MetaMask wallet, so that I can interact with the prediction market contract.

#### Acceptance Criteria

1. WHEN the user clicks "Connect Wallet", THE Frontend SHALL request account access via the MetaMask provider (`window.ethereum.request({ method: 'eth_requestAccounts' })`).
2. WHEN MetaMask grants access, THE Frontend SHALL display the connected wallet address.
3. IF MetaMask is not installed, THEN THE Frontend SHALL display a message instructing the user to install MetaMask.
4. WHILE a wallet is connected, THE Frontend SHALL keep the connected address visible in the UI.

---

### Requirement 2: Create Market

**User Story:** As a user, I want to create a prediction market by submitting a question, so that others can bet on the outcome.

#### Acceptance Criteria

1. THE Frontend SHALL provide a text input field for the market question.
2. WHEN the user submits the create market form, THE Frontend SHALL call `createMarket(question)` on the Contract.
3. WHEN the Contract transaction is confirmed, THE Frontend SHALL extract the `marketId` from the transaction receipt or event log.
4. WHEN the `marketId` is obtained, THE Frontend SHALL send a POST request to `POST /markets` with `{ marketId, question, creator }`.
5. IF the Contract call fails, THEN THE Frontend SHALL display an error message to the user.
6. IF the backend POST request fails, THEN THE Frontend SHALL display an error message to the user.

---

### Requirement 3: Backend Market Storage

**User Story:** As a developer, I want market metadata stored in MongoDB, so that the application can retrieve markets without querying the blockchain for every page load.

#### Acceptance Criteria

1. THE Backend SHALL expose a `POST /markets` endpoint that accepts `{ marketId, question, creator }` in the request body.
2. WHEN a valid POST request is received, THE Backend SHALL persist a Market document with fields `marketId` (Number), `question` (String), `creator` (String), and `createdAt` (Date, defaulting to now).
3. IF a required field (`marketId`, `question`, or `creator`) is missing, THEN THE Backend SHALL return HTTP 400 with a descriptive error message.
4. THE Backend SHALL expose a `GET /markets` endpoint that returns all stored Market documents as a JSON array.
5. WHEN `GET /markets` is called, THE Backend SHALL return HTTP 200 with the array of markets.

---

### Requirement 4: Display Markets

**User Story:** As a user, I want to see all prediction markets with their current bet pools, so that I can decide where to place my bet.

#### Acceptance Criteria

1. WHEN the Frontend loads, THE Frontend SHALL fetch all markets from `GET /markets`.
2. FOR EACH market returned, THE Frontend SHALL display the market question and creator address.
3. FOR EACH market returned, THE Frontend SHALL call `getMarket(marketId)` on the Contract to retrieve the YES pool and NO pool values.
4. THE Frontend SHALL display the YES pool and NO pool values (in ETH/SHM) for each market.
5. IF the `GET /markets` request fails, THEN THE Frontend SHALL display an error message.

---

### Requirement 5: Place Bets

**User Story:** As a user, I want to bet YES or NO on a market with a specified ETH/SHM amount, so that I can participate in the prediction.

#### Acceptance Criteria

1. FOR EACH displayed market, THE Frontend SHALL provide a numeric input for the bet amount in ETH/SHM.
2. FOR EACH displayed market, THE Frontend SHALL provide a "Bet YES" button that calls `betYes(marketId)` on the Contract with the specified ETH value.
3. FOR EACH displayed market, THE Frontend SHALL provide a "Bet NO" button that calls `betNo(marketId)` on the Contract with the specified ETH value.
4. WHEN a bet transaction is confirmed, THE Frontend SHALL refresh the YES pool and NO pool values for that market.
5. IF a bet transaction fails, THEN THE Frontend SHALL display an error message to the user.
6. WHILE a wallet is not connected, THE Frontend SHALL disable the bet inputs and buttons.

---

### Requirement 6: UI Constraints

**User Story:** As a user, I want a clean, simple dark-themed interface, so that the app is easy to use.

#### Acceptance Criteria

1. THE Frontend SHALL apply a dark color theme across all views.
2. THE Frontend SHALL display each market inside a card component.
3. THE Frontend SHALL require no authentication to view markets.
4. THE Frontend SHALL require no authentication to place bets beyond wallet connection.
