# AI-Powered Resolution Verification

## Overview
This feature adds community-driven verification of market resolutions using Google's Gemini AI. When users suspect a market was resolved incorrectly, they can challenge it. Once enough challenges accumulate, Gemini automatically verifies the resolution.

## How It Works

### 1. Challenge System
- Any user can challenge a resolved market if they believe the outcome is incorrect
- Each wallet can only challenge once per market
- Challenges are tracked in MongoDB

### 2. Threshold Trigger
- Default threshold: **3 challenges** (configurable via `CHALLENGE_THRESHOLD` env var)
- When threshold is reached, Gemini AI verification is automatically triggered
- The market status changes to "verifying"

### 3. AI Verification
- Gemini analyzes:
  - The market question
  - The host's resolution (YES/NO)
  - The proof URL provided by the host
- Returns:
  - `isVerified`: boolean
  - `confidence`: 0-100 score
  - `reasoning`: explanation of the decision

### 4. Verification Results
- **Verified** (✓): Confidence ≥ 70% — resolution is accurate
- **Disputed** (⚠): Confidence < 40% — resolution is questionable
- **Unverified**: Confidence 40-69% or verification failed

### 5. Visual Indicators
- Badges appear on market cards in the dashboard
- Detailed verification results shown on market detail page
- Challenge count displayed for transparency

## Setup

### Backend Configuration

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Add to `backend/.env`:
```env
GEMINI_API_KEY=your_api_key_here
CHALLENGE_THRESHOLD=3
```

3. Install dependencies (already done):
```bash
cd backend
npm install @google/generative-ai
```

### Database Schema Updates
The Market model now includes:
- `challenges`: Array of { wallet, timestamp }
- `verificationStatus`: 'pending' | 'verified' | 'disputed' | 'unverified'
- `verificationResult`: AI's reasoning text
- `verifiedAt`: Timestamp of verification

## API Endpoints

### POST /markets/challenge
Challenge a market resolution

**Request:**
```json
{
  "marketId": 0,
  "wallet": "0x..."
}
```

**Response:**
```json
{
  "challengeCount": 3,
  "threshold": 3,
  "verificationTriggered": true,
  "market": { ... }
}
```

## User Flow

1. Market is resolved by host with proof URL
2. User disagrees → clicks "Challenge This Resolution"
3. Challenge is recorded (1/3, 2/3, etc.)
4. At 3rd challenge, Gemini verification starts automatically
5. Within seconds, verification badge appears
6. Users can see AI's reasoning on the market detail page

## Benefits

- **Trust**: Community can verify host decisions
- **Transparency**: AI reasoning is visible to all
- **Automation**: No manual review needed
- **Scalability**: Handles verification at any volume

## Future Enhancements

- Stake requirement to challenge (prevent spam)
- Reward accurate challengers
- Multi-source verification (not just proof URL)
- Appeal mechanism for disputed resolutions
