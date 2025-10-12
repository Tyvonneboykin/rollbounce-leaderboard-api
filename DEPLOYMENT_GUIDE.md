# 🚀 RollBounce Leaderboard API - Complete Deployment Guide

## ✅ What's Already Done

- ✅ Backend code written and pushed to GitHub
- ✅ PostgreSQL database created on Render.com
- ✅ Database connection configured
- ✅ GitHub repository: https://github.com/Tyvonneboykin/rollbounce-leaderboard-api

---

## 📋 ONE MANUAL STEP: Create Web Service (2 minutes)

### Go to Render Dashboard
**URL**: https://dashboard.render.com/create?type=web

### 1. Sign in to Render
- Use GitHub, GitLab, Bitbucket, or Google
- Account: support@vonbase.com

### 2. Connect Repository
- Click "Build and deploy from a Git repository"
- Click "Next"
- Select: **Tyvonneboykin/rollbounce-leaderboard-api**
- Click "Connect"

### 3. Configure Service

**Basic Settings:**
- **Name**: `rollbounce-leaderboard-api`
- **Region**: Ohio (US East)
- **Branch**: `master`
- **Root Directory**: (leave blank)

**Build Settings:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan:**
- Select: **Free** ($0/month)

### 4. Add Environment Variables

Click "Advanced" → "Add Environment Variable"

**Variable 1:**
- **Key**: `DATABASE_URL`
- **Value**:
```
postgresql://leaderboard_user:RyklVj8q4iA70YkJQ1AqnBtg7TzDmp6P@dpg-d3lv5aidbo4c73bf5020-a.ohio-postgres.render.com:5432/leaderboard_0cns
```

**Variable 2:**
- **Key**: `NODE_ENV`
- **Value**: `production`

### 5. Create Service

- Click **"Create Web Service"**
- Wait ~3-5 minutes for build and deployment
- Status will show "Live" when ready

### 6. Copy Your Service URL

Once deployed, you'll see a URL like:
```
https://rollbounce-leaderboard-api-XXXX.onrender.com
```

**COPY THIS URL** - you'll need it for the next step!

---

## 🤖 AUTOMATED: Run Deployment Script

Once you have your service URL, run this command:

```bash
cd ~/dev/rollbounce-leaderboard-api
./deploy-and-test.sh
```

The script will:
1. ✅ Initialize database schema
2. ✅ Insert sample leaderboard data
3. ✅ Test all API endpoints
4. ✅ Submit a test score
5. ✅ Verify everything works
6. ✅ Provide Unity integration instructions

---

## 🎮 Unity Integration

After the script completes successfully, update your Unity project:

**File**: `/mnt/c/Users/Tyvon/RollBouncev1/Assets/Scripts/NewGame/LeaderboardManager.cs`

**Line 14**: Change to your actual Render URL:
```csharp
public string apiBaseUrl = "https://your-actual-url.onrender.com/api";
```

---

## 🧪 Testing in Unity

1. **Open Unity** and load the RollBounce project
2. **Navigate to Leaderboards** menu
3. **Click Refresh** - Should show 5-6 sample entries
4. **Play a game** and get a score
5. **Check leaderboard again** - Your score should appear!

---

## 📊 Expected Results

### Database (after init.sql):
- ✅ `leaderboard` table created
- ✅ 5 sample entries inserted
- ✅ Indexes created for performance

### API Tests:
- ✅ Health check: `{"status":"ok"}`
- ✅ Top 100: Returns 5-6 entries with ranks
- ✅ Submit score: Returns new rank
- ✅ Player lookup: Returns player data

### Unity Client:
- ✅ Online indicator shows 🌐 ONLINE
- ✅ Leaderboard displays with rankings
- ✅ Your best score shows in footer
- ✅ Scores persist across sessions

---

## 🔧 Troubleshooting

### "Service taking too long to respond"
- First API call on free tier can take 10-30 seconds
- Render spins down free services after 15 mins of inactivity
- Solution: Be patient on first request, or upgrade to Starter plan

### "Database connection failed"
- Check environment variable `DATABASE_URL` is correct
- Verify database is "Available" in Render dashboard
- Database URL: https://dashboard.render.com/d/dpg-d3lv5aidbo4c73bf5020-a

### "Unity shows offline"
- Verify service URL in LeaderboardManager.cs
- Check service is "Live" in Render dashboard
- Test health endpoint manually: `curl https://your-url.onrender.com/api/health`

---

## 💰 Cost Breakdown

### Current Setup (Free Tier):
- **PostgreSQL Database**: $0/month (1GB storage, 100GB bandwidth)
- **Web Service**: $0/month (750 hours/month, spins down after inactivity)
- **Total**: **$0/month**

### Upgrade Options (Optional):
- **Starter Plan**: $7/month (always-on, faster response times)
- **Professional Database**: $20/month (10GB storage, backups, high availability)

---

## 🎯 Success Criteria

✅ Database initialized with sample data
✅ API responds to health check
✅ Top 100 endpoint returns entries
✅ Score submission works
✅ Unity client connects successfully
✅ Leaderboard displays in game
✅ Online/offline mode switching works

---

## 📞 Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check database status: Dashboard → Database → Status
3. Review API responses with curl commands
4. Check Unity console for LeaderboardManager debug logs

---

## 🚀 Ready to Deploy!

**Time Required**: ~5 minutes total
- Manual dashboard setup: 2 minutes
- Automated script: 3 minutes

**Let's do this!** 💪
