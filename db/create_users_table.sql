-- RollBounce Users Table - Web3 Authentication
-- Separate user accounts from leaderboard scores

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,  -- Ethereum address (0x + 40 chars)
    username VARCHAR(50) UNIQUE NOT NULL,         -- Unique username
    player_name VARCHAR(100) NOT NULL,            -- Display name (same as username initially)
    is_verified BOOLEAN DEFAULT FALSE,            -- Wallet verification status
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_wallet_users ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_username ON users(username);

-- Add constraint to ensure wallet addresses are lowercase
CREATE OR REPLACE FUNCTION lowercase_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
    NEW.wallet_address = LOWER(NEW.wallet_address);
    NEW.username = LOWER(NEW.username);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_lowercase_wallet
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION lowercase_wallet_address();

-- Display success message
SELECT 'Users table created successfully!' as message;
