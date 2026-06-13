const User = require('../models/User');
const Token = require('../models/Token');
const {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
} = require('../utils/token.utils');

// ----------------------------------------
// Helper — set refresh token as httpOnly cookie
// ----------------------------------------
// We call this in both login and refresh.
// Keeping it as a helper avoids repeating the
// same cookie options in two places.

const setRefreshTokenCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        // 'none' is required for cross-site cookies (frontend and backend
        // on different domains). Browsers REQUIRE secure: true whenever
        // sameSite is 'none' — cookies won't be set otherwise.
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

// setRefreshTokenCookie — a small helper that stamps the refresh token into the browser's cookie jar with strict security settings. httpOnly means JavaScript running on the page can never read it — only the browser itself sends it. This is what protects it from XSS attacks.




// ----------------------------------------
// REGISTER
// POST /api/auth/register
// ----------------------------------------

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check all fields are provided
        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Username, email and password are all required.',
            });
        }

        // Check if email is already registered
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(409).json({
                message: 'This email is already registered.',
            });
        }

        // Check if username is already taken
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(409).json({
                message: 'This username is already taken.',
            });
        }

        // Create the user — password gets hashed automatically by the beforeSave hook
        const user = await User.create({ username, email, password });

        res.status(201).json({
            message: 'Account created successfully.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        // Catch Sequelize validation errors (e.g. invalid email format)
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: error.errors[0].message,
            });
        }
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// register — takes username, email, password from the request. Checks nothing is missing, checks neither email nor username is already taken, then creates the user. The password hashing happens automatically via the beforeSave hook we wrote in User.js — the controller doesn't need to think about it.




// ----------------------------------------
// LOGIN
// POST /api/auth/login
// ----------------------------------------

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check all fields are provided
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.',
            });
        }

        // Find the user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Use a vague message — don't tell the attacker whether
            // the email exists or the password is wrong
            return res.status(401).json({
                message: 'Invalid email or password.',
            });
        }

        // Compare the provided password against the stored hash
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password.',
            });
        }

        // Generate both tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();

        // Store the hashed refresh token in the database
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await Token.create({
            userId: user.id,
            token: hashToken(refreshToken),
            expiresAt,
        });

        // Send refresh token as httpOnly cookie
        setRefreshTokenCookie(res, refreshToken);

        // Send access token and user info in the response body
        res.status(200).json({
            message: 'Logged in successfully.',
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// login — finds the user by email, checks the password, then generates both tokens. Notice the deliberately vague error message "Invalid email or password" — you never want to tell someone which part was wrong, as that helps attackers know which emails are registered in your system.




// ----------------------------------------
// REFRESH
// POST /api/auth/refresh
// ----------------------------------------
// Called automatically by the frontend when
// an access token expires. The refresh token
// arrives via the httpOnly cookie automatically.

exports.refresh = async (req, res) => {
    try {
        // Read the refresh token from the cookie
        const rawToken = req.cookies.refreshToken;
        if (!rawToken) {
            return res.status(401).json({
                message: 'No refresh token provided.',
            });
        }

        // Look up the hashed version in the database
        const hashedToken = hashToken(rawToken);
        const storedToken = await Token.findOne({
            where: { token: hashedToken },
        });

        // Reject if not found in the whitelist
        if (!storedToken) {
            return res.status(403).json({
                message: 'Refresh token is invalid.',
            });
        }

        // Reject if expired
        if (storedToken.expiresAt < new Date()) {
            await storedToken.destroy();
            return res.status(403).json({
                message: 'Refresh token has expired. Please log in again.',
            });
        }

        // Find the user this token belongs to
        const user = await User.findByPk(storedToken.userId);
        if (!user) {
            return res.status(403).json({
                message: 'User not found.',
            });
        }

        // --- TOKEN ROTATION ---
        // Delete the old token record
        await storedToken.destroy();

        // Generate a brand new refresh token
        const newRefreshToken = generateRefreshToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Store the new hashed refresh token
        await Token.create({
            userId: user.id,
            token: hashToken(newRefreshToken),
            expiresAt,
        });

        // Generate a new access token
        const newAccessToken = generateAccessToken(user);

        // Set the new refresh token cookie
        setRefreshTokenCookie(res, newRefreshToken);

        // Return the new access token
        res.status(200).json({
            accessToken: newAccessToken,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// refresh — reads the refresh token from the cookie, hashes it, looks it up in the database, checks it hasn't expired, then performs token rotation (delete old, create new). Returns only the new access token in the response body.




// ----------------------------------------
// LOGOUT
// POST /api/auth/logout
// ----------------------------------------

exports.logout = async (req, res) => {
    try {
        const rawToken = req.cookies.refreshToken;

        if (rawToken) {
            // Delete the token record from the database (cross it out of the logbook)
            await Token.destroy({
                where: { token: hashToken(rawToken) },
            });
        }

        // Clear the cookie from the browser
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// logout — deletes the token record from the database and clears the cookie from the browser. Two actions, one result: that session is completely dead from both sides.