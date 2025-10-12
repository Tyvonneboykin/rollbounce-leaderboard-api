const express = require('express');
const router = express.Router();

// GET /api/leaderboard/top100
// Fetch top 100 players
router.get('/top100', async (req, res) => {
  try {
    const db = req.app.locals.db;

    const result = await db.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
        user_id,
        player_name,
        score,
        max_combo,
        time_survived,
        total_bounces,
        wallet_address,
        nft_skin_id,
        is_verified,
        EXTRACT(EPOCH FROM created_at)::bigint as timestamp
      FROM leaderboard
      ORDER BY score DESC
      LIMIT 100
    `);

    res.json({
      entries: result.rows,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/leaderboard/submit
// Submit a new score
router.post('/submit', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      userId,
      playerName,
      score,
      maxCombo = 0,
      timeSurvived = 0,
      totalBounces = 0,
      walletAddress = null,
      nftSkinId = null
    } = req.body;

    // Validation
    if (!userId || !playerName || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score value' });
    }

    // Anti-cheat: Basic validation (can be enhanced later)
    const maxPossibleScore = 1000000; // 1 million max score
    if (score > maxPossibleScore) {
      return res.status(400).json({ error: 'Score exceeds maximum possible value' });
    }

    // Check if user exists
    const existing = await db.query(
      'SELECT score FROM leaderboard WHERE user_id = $1',
      [userId]
    );

    let newRank;

    if (existing.rows.length > 0) {
      // User exists - only update if new score is higher
      const currentScore = existing.rows[0].score;

      if (score > currentScore) {
        await db.query(`
          UPDATE leaderboard
          SET
            player_name = $1,
            score = $2,
            max_combo = $3,
            time_survived = $4,
            total_bounces = $5,
            wallet_address = COALESCE($6, wallet_address),
            nft_skin_id = COALESCE($7, nft_skin_id),
            updated_at = NOW()
          WHERE user_id = $8
        `, [playerName, score, maxCombo, timeSurvived, totalBounces, walletAddress, nftSkinId, userId]);

        console.log(`✅ Updated score for ${playerName}: ${currentScore} → ${score}`);
      } else {
        console.log(`⚠️ Score not updated for ${playerName}: ${score} <= ${currentScore}`);
      }
    } else {
      // New user - insert
      await db.query(`
        INSERT INTO leaderboard
        (user_id, player_name, score, max_combo, time_survived, total_bounces, wallet_address, nft_skin_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, playerName, score, maxCombo, timeSurvived, totalBounces, walletAddress, nftSkinId]);

      console.log(`✅ New entry created for ${playerName}: ${score}`);
    }

    // Get player's new rank
    const rankResult = await db.query(`
      SELECT rank FROM (
        SELECT
          user_id,
          ROW_NUMBER() OVER (ORDER BY score DESC) as rank
        FROM leaderboard
      ) ranked
      WHERE user_id = $1
    `, [userId]);

    newRank = rankResult.rows.length > 0 ? rankResult.rows[0].rank : -1;

    res.json({
      success: true,
      newRank: newRank,
      message: `Score submitted successfully! Rank: #${newRank}`
    });

  } catch (error) {
    console.error('❌ Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// GET /api/leaderboard/player/:userId
// Get specific player's rank and stats
router.get('/player/:userId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { userId } = req.params;

    const result = await db.query(`
      SELECT * FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
          user_id,
          player_name,
          score,
          max_combo,
          time_survived,
          total_bounces,
          wallet_address,
          nft_skin_id,
          is_verified,
          EXTRACT(EPOCH FROM created_at)::bigint as timestamp
        FROM leaderboard
      ) ranked
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

module.exports = router;
