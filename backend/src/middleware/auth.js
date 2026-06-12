const { verifyAccessToken } = require('../utils/token.utils');

// ----------------------------------------
// AUTHENTICATE
// ----------------------------------------
// Checks that a valid access token is present
// on the request. If valid, attaches the decoded
// user payload to req.user so the next function
// (the controller) can use it.
//
// Usage: router.get('/profile', authenticate, controller)

const authenticate = (req, res, next) => {
    try {
        // Access tokens arrive in the Authorization header
        // in this format: "Bearer eyJhbGciOiJIUzI1NiIsInR5..."
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({
                message: 'Access denied. No token provided.',
            });
        }

        // Split "Bearer <token>" and grab just the token part
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                message: 'Access denied. Token format invalid.',
            });
        }

        const token = parts[1];

        // Verify the token — throws if invalid or expired
        const decoded = verifyAccessToken(token);

        // Attach decoded payload to the request object
        // { id, email, role, iat, exp }
        // Now any controller after this middleware can
        // access req.user.id, req.user.role etc.
        req.user = decoded;

        // Everything checks out — move on to the controller
        next();
    } catch (error) {
        // jwt.verify() throws specific error types
        // we check for them to give meaningful responses

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Access token has expired.',
                code: 'TOKEN_EXPIRED', // frontend uses this code to trigger a refresh
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Access token is invalid.',
            });
        }

        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// authenticate — reads the Authorization header, pulls out the token after "Bearer ", then calls verifyAccessToken() from your utils file. If that passes, it puts the decoded user info onto req.user and calls next() — which means "ok, continue to whatever comes after me." If anything fails, it sends an error response immediately and next() is never called, so the controller never runs.

// req.user = decoded — this is the handshake between middleware and controller. The middleware does the security check and rewards a passing request by attaching the user's identity to it. When the controller runs next, it can simply read req.user.id to know who made the request — no database lookup needed.

// next() — this is how Express middleware works. Every middleware function receives three arguments: req (the request), res (the response), and next (a function that says "pass control to the next thing"). If you don't call next(), the request just hangs forever. If you call res.json() instead, the request ends there.

// TokenExpiredError vs JsonWebTokenError — jwt.verify() throws different error types for different failures. TokenExpiredError means the token was valid but has passed its 15 minute window — the frontend should automatically request a new one. JsonWebTokenError means the token is malformed or the signature doesn't match — likely tampering or a wrong secret.

// code: 'TOKEN_EXPIRED' — notice this extra field in the expired token response. When we build the frontend axios interceptor, it will look specifically for this code to know "I should silently refresh and retry" versus "I should redirect to login." This small detail is what makes the auto-refresh experience seamless for the user.




// ----------------------------------------
// AUTHORIZE
// ----------------------------------------
// Checks that the authenticated user has the
// required role to access a specific route.
// Must always be used AFTER authenticate —
// it relies on req.user being set.
//
// Usage: router.get('/admin', authenticate, authorize('admin'), controller)
// Multiple roles: authorize('admin', 'moderator')

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Access denied. Not authenticated.',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(' or ')}.`,
            });
        }

        next();
    };
};

// authorize(...roles) — this is a function that returns a middleware function. The ...roles syntax means it accepts any number of role arguments. So authorize('admin') works, and so does authorize('admin', 'moderator'). It checks req.user.role against the allowed roles list. The 401 vs 403 distinction matters — 401 means "I don't know who you are", 403 means "I know who you are but you're not allowed here."

module.exports = { authenticate, authorize };