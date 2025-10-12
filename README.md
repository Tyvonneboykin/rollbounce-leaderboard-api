# 🏆 RollBounce Leaderboard API

REST API backend for RollBounce game leaderboards with Web3 integration support.

## Features

- ✅ Top 100 leaderboard with real-time rankings
- ✅ Score submission with anti-cheat validation
- ✅ PostgreSQL database with optimized indexes
- ✅ Web3-ready architecture (wallet addresses, NFT skins)
- ✅ CORS enabled for Unity WebGL/builds
- ✅ Deployed on Render.com (free tier)

## API Endpoints

### Health Check
```
GET /api/health
```

### Get Top 100 Leaderboard
```
GET /api/leaderboard/top100
```

### Submit Score
```
POST /api/leaderboard/submit
Content-Type: application/json

{
  "userId": "string",
  "playerName": "string",
  "score": number,
  "maxCombo": number,
  "timeSurvived": number,
  "totalBounces": number
}
```

### Get Player Rank
```
GET /api/leaderboard/player/:userId
```

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run server
npm start
```

## Database Setup

Run the initialization script:
```bash
psql $DATABASE_URL < db/init.sql
```

## Deployment

Deployed on Render.com with automatic deployments from main branch.

## Tech Stack

- Node.js + Express
- PostgreSQL
- Render.com (hosting + database)

## Future Features

- [ ] WalletConnect integration
- [ ] NFT skin verification
- [ ] VBE token rewards for top 10
- [ ] Rate limiting
- [ ] Advanced anti-cheat
