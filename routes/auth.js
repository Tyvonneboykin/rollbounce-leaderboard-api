const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

/**
 * Verify wallet signature
 * @param {string} walletAddress - Expected wallet address
 * @param {string} message - Original message that was signed
 * @param {string} signature - Signature from wallet
 * @returns {boolean} - True if signature is valid
 */
function verifySignature(walletAddress, message, signature) {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {object} - {valid: boolean, error: string}
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  if (username.length < 3 || username.length > 20) {
    return { valid: false, error: 'Username must be 3-20 characters' };
  }

  // Alphanumeric + underscores only
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  // Check for profanity (basic list - expand as needed)
  const profanityList = ['admin', 'moderator', 'system', 'official'];
  if (profanityList.some(word => username.toLowerCase().includes(word))) {
    return { valid: false, error: 'Username contains restricted words' };
  }

  return { valid: true };
}

/**
 * Check if signature timestamp is within acceptable window (5 minutes)
 * @param {string} message - Message containing timestamp
 * @returns {boolean} - True if timestamp is valid
 */
function isTimestampValid(message) {
  const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
  if (!timestampMatch) return false;

  const messageTime = parseInt(timestampMatch[1]);
  const currentTime = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;

  return Math.abs(currentTime - messageTime) <= fiveMinutes;
}

/**
 * POST /api/auth/create-account
 * Create a new account with wallet authentication
 */
router.post('/create-account', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { walletAddress, username, signature, message, isDevelopmentMode = false } = req.body;

    // Validation
    if (!walletAddress || !username || !signature || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate wallet address format (Ethereum)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Validate username
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      return res.status(400).json({ error: usernameCheck.error });
    }

    // PRODUCTION MODE: Verify signature
    if (!isDevelopmentMode) {
      // Verify signature timestamp
      if (!isTimestampValid(message)) {
        return res.status(400).json({ error: 'Signature expired. Please try again.' });
      }

      // Verify signature
      if (!verifySignature(walletAddress, message, signature)) {
        return res.status(400).json({ error: 'Invalid signature. Wallet verification failed.' });
      }
    } else {
      // DEVELOPMENT MODE: Log warning and skip verification
      console.warn('⚠️ DEV MODE: Skipping signature verification for account creation');
    }

    // Check if wallet already has an account
    const existingWallet = await db.query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [walletAddress.toLowerCase()]
    );

    if (existingWallet.rows.length > 0) {
      return res.status(409).json({ error: 'Wallet already has an account' });
    }

    // Check if username is taken
    const existingUsername = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create account
    const result = await db.query(
      `INSERT INTO users (wallet_address, username, player_name, is_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id, wallet_address, username, player_name`,
      [walletAddress.toLowerCase(), username.toLowerCase(), username, true]
    );

    const newUser = result.rows[0];

    console.log(`✅ New account created: ${username} (${walletAddress})`);

    res.json({
      success: true,
      userId: newUser.id,
      username: newUser.username,
      playerName: newUser.player_name,
      walletAddress: newUser.wallet_address
    });

  } catch (error) {
    console.error('❌ Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * GET /api/auth/check-wallet/:walletAddress
 * Check if wallet has an existing account
 */
router.get('/check-wallet/:walletAddress', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { walletAddress } = req.params;

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const result = await db.query(
      'SELECT id, username, player_name, is_verified FROM users WHERE wallet_address = $1',
      [walletAddress.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.json({
        exists: false,
        message: 'No account found for this wallet'
      });
    }

    const user = result.rows[0];

    res.json({
      exists: true,
      userId: user.id,
      username: user.username,
      playerName: user.player_name,
      isVerified: user.is_verified
    });

  } catch (error) {
    console.error('❌ Error checking wallet:', error);
    res.status(500).json({ error: 'Failed to check wallet' });
  }
});

/**
 * POST /api/auth/sign-in
 * Authenticate with wallet signature
 */
router.post('/sign-in', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { walletAddress, signature, message } = req.body;

    // Validation
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify signature timestamp
    if (!isTimestampValid(message)) {
      return res.status(400).json({ error: 'Signature expired. Please try again.' });
    }

    // Verify signature
    if (!verifySignature(walletAddress, message, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Fetch user account
    const result = await db.query(
      'SELECT id, username, player_name, wallet_address, is_verified FROM users WHERE wallet_address = $1',
      [walletAddress.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const user = result.rows[0];

    // Get player stats from leaderboard
    const statsResult = await db.query(
      `SELECT score, max_combo, time_survived, total_bounces
       FROM leaderboard
       WHERE wallet_address = $1
       ORDER BY score DESC
       LIMIT 1`,
      [walletAddress.toLowerCase()]
    );

    const stats = statsResult.rows.length > 0 ? statsResult.rows[0] : null;

    console.log(`✅ User signed in: ${user.username} (${walletAddress})`);

    res.json({
      success: true,
      userId: user.id,
      username: user.username,
      playerName: user.player_name,
      walletAddress: user.wallet_address,
      isVerified: user.is_verified,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error signing in:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

/**
 * PUT /api/auth/update-username
 * Update username for verified wallet
 */
router.put('/update-username', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { walletAddress, newUsername, signature, message } = req.body;

    // Validation
    if (!walletAddress || !newUsername || !signature || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate username
    const usernameCheck = validateUsername(newUsername);
    if (!usernameCheck.valid) {
      return res.status(400).json({ error: usernameCheck.error });
    }

    // Verify signature timestamp
    if (!isTimestampValid(message)) {
      return res.status(400).json({ error: 'Signature expired. Please try again.' });
    }

    // Verify signature
    if (!verifySignature(walletAddress, message, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if new username is taken (excluding current user)
    const existingUsername = await db.query(
      'SELECT id FROM users WHERE username = $1 AND wallet_address != $2',
      [newUsername.toLowerCase(), walletAddress.toLowerCase()]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Update username
    const result = await db.query(
      `UPDATE users
       SET username = $1, player_name = $2, updated_at = NOW()
       WHERE wallet_address = $3
       RETURNING username, player_name`,
      [newUsername.toLowerCase(), newUsername, walletAddress.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    console.log(`✅ Username updated: ${walletAddress} → ${newUsername}`);

    res.json({
      success: true,
      username: result.rows[0].username,
      playerName: result.rows[0].player_name
    });

  } catch (error) {
    console.error('❌ Error updating username:', error);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

module.exports = router;
