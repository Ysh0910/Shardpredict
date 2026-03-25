# Quick Setup Guide for AI Verification

## Step 1: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

## Step 2: Configure Backend

Edit `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/prediction-market
PORT=5000
GEMINI_API_KEY=AIzaSy...your_key_here
CHALLENGE_THRESHOLD=3
```

## Step 3: Start the Application

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

## Step 4: Test the Feature

1. **Create a market** (as contract owner)
2. **Resolve the market** with a proof URL
3. **Challenge the resolution** from 3 different wallets
4. **Watch the AI verification** happen automatically
5. **See the badge** appear on the market card

## Verification Badge States

| Badge | Meaning | Confidence |
|-------|---------|------------|
| ✓ Verified | AI confirms resolution is accurate | ≥ 70% |
| ⚠ Disputed | AI questions the resolution | < 40% |
| 🔄 Verifying | AI analysis in progress | - |
| (none) | Not enough challenges yet | - |

## Challenge Flow

```
User 1 challenges → "1/3 challenges"
User 2 challenges → "2/3 challenges"
User 3 challenges → "3/3 - AI verification triggered!"
                  ↓
            Gemini analyzes proof
                  ↓
            Badge appears on market
```

## Troubleshooting

### "GEMINI_API_KEY not configured"
- Make sure you added the key to `backend/.env`
- Restart the backend server after adding the key

### "You have already challenged this market"
- Each wallet can only challenge once
- Use a different wallet to test multiple challenges

### Verification takes too long
- Gemini API calls typically complete in 2-5 seconds
- Check your API key quota at Google AI Studio
- Check backend console for error messages

## Testing Tips

For quick testing, you can temporarily lower the threshold:
```env
CHALLENGE_THRESHOLD=1
```

This triggers verification after just 1 challenge, making it easier to test the flow.
