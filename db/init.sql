-- RollBounce Leaderboard Database Schema
-- PostgreSQL initialization script

-- Drop table if exists (for clean reinstall)
DROP TABLE IF EXISTS leaderboard CASCADE;

-- Create leaderboard table
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_combo INTEGER DEFAULT 0,
    time_survived FLOAT DEFAULT 0,
    total_bounces INTEGER DEFAULT 0,
    wallet_address VARCHAR(42) DEFAULT NULL,  -- Ethereum address (42 chars with 0x prefix)
    nft_skin_id VARCHAR(255) DEFAULT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_score ON leaderboard(score DESC);
CREATE INDEX idx_user_id ON leaderboard(user_id);
CREATE INDEX idx_wallet ON leaderboard(wallet_address) WHERE wallet_address IS NOT NULL;

-- Insert sample data for testing (optional)
INSERT INTO leaderboard (user_id, player_name, score, max_combo, time_survived, total_bounces) VALUES
('sample-user-1', 'CryptoKing', 125430, 52, 248.5, 892),
('sample-user-2', 'BounceGod', 118220, 48, 235.2, 856),
('sample-user-3', 'NeonRunner', 95100, 41, 198.7, 712),
('sample-user-4', 'SpeedDemon', 88450, 38, 185.3, 678),
('sample-user-5', 'ComboMaster', 82390, 44, 172.9, 645);

-- Create view for top 100 with ranking (optional, for easier queries)
CREATE OR REPLACE VIEW top100 AS
SELECT
    ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
    *
FROM leaderboard
ORDER BY score DESC
LIMIT 100;

-- Display success message
SELECT 'Database initialized successfully!' as message;
