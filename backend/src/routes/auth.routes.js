const router = require('express').Router();
const authController = require('../controllers/auth.controller');

// require('express').Router() — Express has a built-in mini-app called a Router. Think of it as a smaller version of the main app that only handles a specific group of routes. We create one router per feature (auth, users, products etc.) and then mount them all in app.js. This keeps things modular — each router is its own independent unit.


// ----------------------------------------
// Public routes
// ----------------------------------------
// These routes do NOT use the authenticate middleware
// because they are the entry points — the user
// doesn't have a token yet when they hit these.

// Register a new account
router.post('/register', authController.register);

// Login with email + password
router.post('/login', authController.login);

// Get a new access token using the refresh token cookie
// The refresh token arrives automatically via the httpOnly cookie
// no Authorization header needed here
router.post('/refresh', authController.refresh);

// Logout — clears the cookie and deletes the token from DB
router.post('/logout', authController.logout);

module.exports = router;