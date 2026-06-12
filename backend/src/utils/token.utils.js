const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// ----------------------------------------
// Generate a short-lived ACCESS token
// ----------------------------------------
// This is a signed JWT containing the user's id, email and role.
// It expires in 15 minutes (set in .env).
// The frontend will attach this to every API request.

const generateAccessToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };

    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // "15m"
    });
};

// generateAccessToken(user) — takes a user object and creates a signed JWT. A JWT has three parts: a header (algorithm info), a payload (your data — id, email, role), and a signature (proof it wasn't tampered with). The signature is created using your ACCESS_TOKEN_SECRET. Anyone can read a JWT payload, but they cannot forge one without knowing the secret.



// ----------------------------------------
// Generate a long-lived REFRESH token
// ----------------------------------------
// This is NOT a JWT. It is a random 64-byte string.
// It is long-lived (7 days) and stored as a httpOnly cookie.
// We store its hash in the database, not the token itself.

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

// generateRefreshToken() — notice this is not a JWT. It's just a cryptographically random string. We don't need it to carry any data — it's purely a lookup key. crypto.randomBytes(64) generates 64 random bytes from your OS's secure random number generator, then .toString('hex') converts it to a readable string. It cannot be guessed.




// ----------------------------------------
// Verify an ACCESS token
// ----------------------------------------
// Decodes and validates a JWT access token.
// Returns the decoded payload ({ id, email, role, iat, exp })
// Throws an error if the token is invalid or expired —
// the caller (middleware) is responsible for catching that error.

const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};

// verifyAccessToken(token) — calls jwt.verify() which does two things simultaneously: checks the signature (was this token signed with our secret?) and checks the expiry (is exp in the past?). If either check fails, it throws an error. We intentionally let it throw — the middleware that calls this will catch the error and decide what response to send.




// ----------------------------------------
// Hash a token
// ----------------------------------------
// We never store raw refresh tokens in the database.
// If the database is breached, attackers get SHA-256 hashes
// which are useless without the original value.
// SHA-256 always produces a consistent 64-character hex string —
// so hashing the same token twice always gives the same result,
// which lets us look it up in the database later.

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// hashToken(token) — uses Node's built-in crypto module to run SHA-256 on the token. The same input always produces the same output, so we can hash an incoming refresh token and compare it to what's stored in the database. This is a one-way operation — you can go from token → hash, but never from hash → token.



module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    hashToken,
};