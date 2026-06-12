const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');

// ----------------------------------------
// Public route — no token needed
// ----------------------------------------
// Just a sanity check to confirm the
// user routes are mounted and working.

router.get('/test', (req, res) => {
    res.status(200).json({
        message: 'User routes are working.',
    });
});

// router.get('/test', ...) — a completely open route with no middleware. Useful during development to confirm your routes are mounted correctly in app.js before testing the protected ones.




// ----------------------------------------
// Protected route — any logged in user
// ----------------------------------------
// authenticate middleware runs first.
// If token is valid, req.user is populated
// and the controller function runs.
// If token is missing or invalid, authenticate
// sends the error and this function never runs.

router.get('/profile', authenticate, (req, res) => {
    res.status(200).json({
        message: 'Profile fetched successfully.',
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
        },
    });
});

// router.get('/profile', authenticate, ...) — notice the three arguments here. The first is the path, the last is the controller function, and authenticate sits in the middle. This is how Express middleware chaining works — it runs left to right. The request hits authenticate first, and only if authenticate calls next() does it reach the controller function.

// req.user — look at how the controller uses req.user.id and req.user.email without any database lookup. This data was decoded from the JWT token by the authenticate middleware and attached to the request object. The token carries the user's identity so you don't need an extra database query on every single protected request. This is one of the core performance benefits of JWT.




// ----------------------------------------
// Protected route — logged in user
// can update their own profile info
// ----------------------------------------

router.get('/dashboard', authenticate, (req, res) => {
    res.status(200).json({
        message: `Welcome to your dashboard, user ${req.user.id}.`,
        user: req.user,
    });
});

// ----------------------------------------
// Admin only route — requires both
// authentication AND admin role
// ----------------------------------------
// authorize('admin') runs after authenticate.
// If the user's role is not 'admin',
// authorize sends a 403 and this function
// never runs.

router.get('/admin', authenticate, authorize('admin'), (req, res) => {
    res.status(200).json({
        message: 'Welcome, admin. You have access to this protected data.',
        user: req.user,
    });
});

// router.get('/admin', authenticate, authorize('admin'), ...) — now there are two middleware functions before the controller. Express runs them in order — authenticate first (are you logged in?), then authorize('admin') (are you an admin?), then the controller function (here's the data). If either middleware rejects the request, the chain stops immediately.

// Why inline controller functions here instead of a separate controller file? For simple responses like these, a separate controller file would be overkill — the "logic" is just sending back req.user. In a real app, if these routes grew more complex (database queries, data transformation), you'd move them to a user.controller.js file. For now, keeping them inline keeps the project simpler while still demonstrating the concept clearly.

module.exports = router;


// MIDDLEWARE CHAIN VISUALISED ------>

// Incoming request
//       ↓
//   authenticate        ← checks token, sets req.user
//       ↓ (if valid)
//   authorize('admin')  ← checks req.user.role
//       ↓ (if allowed)
//   controller function ← sends the response



// Full URL picture for user routes ----->

// GET   http://localhost:5000/api/users/test       ← public
// GET   http://localhost:5000/api/users/profile    ← requires token
// GET   http://localhost:5000/api/users/dashboard  ← requires token
// GET   http://localhost:5000/api/users/admin      ← requires token + admin role