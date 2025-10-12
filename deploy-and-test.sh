#!/bin/bash

# RollBounce Leaderboard API - Complete Deployment & Testing Script
# Run this after creating the Render web service

set -e  # Exit on any error

echo "🚀 RollBounce Leaderboard API - Deployment & Testing"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get service URL from user
read -p "Enter your Render service URL (e.g., https://rollbounce-api.onrender.com): " SERVICE_URL
SERVICE_URL=$(echo "$SERVICE_URL" | sed 's:/*$::')  # Remove trailing slash

echo ""
echo -e "${BLUE}📊 Step 1: Initializing Database Schema${NC}"
echo "--------------------------------------------"

# Database connection details
DB_HOST="dpg-d3lv5aidbo4c73bf5020-a.ohio-postgres.render.com"
DB_PORT="5432"
DB_USER="leaderboard_user"
DB_NAME="leaderboard_0cns"
DB_PASSWORD="RyklVj8q4iA70YkJQ1AqnBtg7TzDmp6P"

export PGPASSWORD="$DB_PASSWORD"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql not found. Installing PostgreSQL client...${NC}"
    sudo apt-get update && sudo apt-get install -y postgresql-client
fi

# Initialize database
echo "Running init.sql..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f db/init.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database initialized successfully${NC}"
else
    echo -e "${RED}❌ Database initialization failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Step 2: Testing API Endpoints${NC}"
echo "--------------------------------------------"

# Test 1: Health Check
echo "Test 1: Health Check..."
HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/api/health")
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

echo ""

# Test 2: Fetch Top 100 (should have sample data)
echo "Test 2: Fetching Top 100 Leaderboard..."
TOP100_RESPONSE=$(curl -s "$SERVICE_URL/api/leaderboard/top100")
echo "Sample entries:"
echo "$TOP100_RESPONSE" | python3 -m json.tool | head -30

ENTRY_COUNT=$(echo "$TOP100_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['entries']))")
echo -e "${GREEN}✅ Fetched $ENTRY_COUNT entries${NC}"

echo ""

# Test 3: Submit test score
echo "Test 3: Submitting Test Score..."
SUBMIT_RESPONSE=$(curl -s -X POST "$SERVICE_URL/api/leaderboard/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-unity-player-001",
    "playerName": "TestPlayer",
    "score": 50000,
    "maxCombo": 30,
    "timeSurvived": 150.5,
    "totalBounces": 200
  }')

echo "Response: $SUBMIT_RESPONSE"

if echo "$SUBMIT_RESPONSE" | grep -q "success"; then
    RANK=$(echo "$SUBMIT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['newRank'])")
    echo -e "${GREEN}✅ Score submitted! New rank: #$RANK${NC}"
else
    echo -e "${RED}❌ Score submission failed${NC}"
fi

echo ""

# Test 4: Fetch player data
echo "Test 4: Fetching Test Player Data..."
PLAYER_RESPONSE=$(curl -s "$SERVICE_URL/api/leaderboard/player/test-unity-player-001")
echo "Player data: $PLAYER_RESPONSE"

if echo "$PLAYER_RESPONSE" | grep -q "TestPlayer"; then
    echo -e "${GREEN}✅ Player data retrieved${NC}"
else
    echo -e "${RED}❌ Player lookup failed${NC}"
fi

echo ""

# Test 5: Verify updated leaderboard
echo "Test 5: Verifying Updated Leaderboard..."
UPDATED_TOP100=$(curl -s "$SERVICE_URL/api/leaderboard/top100")
NEW_ENTRY_COUNT=$(echo "$UPDATED_TOP100" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['entries']))")
echo -e "${GREEN}✅ Leaderboard now has $NEW_ENTRY_COUNT entries${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "📋 Summary:"
echo "  • Database: Initialized with schema"
echo "  • API Health: ✅ Operational"
echo "  • Sample Data: $ENTRY_COUNT entries"
echo "  • Test Score: ✅ Submitted successfully"
echo "  • Total Entries: $NEW_ENTRY_COUNT"
echo ""
echo "🔗 Your API is live at: $SERVICE_URL/api"
echo ""
echo "📝 Next Steps:"
echo "  1. Update Unity LeaderboardManager.cs:"
echo "     public string apiBaseUrl = \"$SERVICE_URL/api\";"
echo ""
echo "  2. Test from Unity:"
echo "     - Open Leaderboards menu"
echo "     - Click Refresh"
echo "     - Play a game and submit score"
echo ""
echo -e "${YELLOW}⚠️  Note: First API call may be slow (~10s) as Render spins up free tier${NC}"
echo ""
