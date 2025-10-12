const express = require('express');
const router = express.Router();

// Test database connection
router.get('/test-db', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Initialize database with schema and sample data
router.post('/init-db', async (req, res) => {
  const db = req.app.locals.db;

  try {
    // Drop existing table
    await db.query('DROP TABLE IF EXISTS leaderboard CASCADE');

    // Create table
    await db.query(`
      CREATE TABLE leaderboard (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        player_name VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL,
        max_combo INTEGER DEFAULT 0,
        time_survived FLOAT DEFAULT 0,
        total_bounces INTEGER DEFAULT 0,
        wallet_address VARCHAR(42) DEFAULT NULL,
        nft_skin_id VARCHAR(255) DEFAULT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await db.query('CREATE INDEX idx_score ON leaderboard(score DESC)');
    await db.query('CREATE INDEX idx_user_id ON leaderboard(user_id)');
    await db.query('CREATE INDEX idx_wallet ON leaderboard(wallet_address) WHERE wallet_address IS NOT NULL');

    // Insert sample data
    await db.query(`
      INSERT INTO leaderboard (user_id, player_name, score, max_combo, time_survived, total_bounces) VALUES
      ('sample-user-1', 'CryptoKing', 125430, 52, 248.5, 892),
      ('sample-user-2', 'BounceGod', 118220, 48, 235.2, 856),
      ('sample-user-3', 'NeonRunner', 95100, 41, 198.7, 712),
      ('sample-user-4', 'SpeedDemon', 88450, 38, 185.3, 678),
      ('sample-user-5', 'ComboMaster', 82390, 44, 172.9, 645)
    `);

    // Create view
    await db.query(`
      CREATE OR REPLACE VIEW top100 AS
      SELECT
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
        *
      FROM leaderboard
      ORDER BY score DESC
      LIMIT 100
    `);

    // Get count
    const countResult = await db.query('SELECT COUNT(*) FROM leaderboard');
    const count = countResult.rows[0].count;

    res.json({
      success: true,
      message: 'Database initialized successfully',
      entries: parseInt(count),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({
      error: 'Failed to initialize database',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
