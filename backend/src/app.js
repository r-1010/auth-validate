require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');

// Import route files
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const PORT = process.env.PORT || 5000;

const app = express();

// ----------------------------------------
// Global Middleware
// ----------------------------------------

// Allow requests from your React frontend
app.use(cors({
    origin: process.env.CLIENT_URL, // http://localhost:5173
    credentials: true, // required for cookies to be sent cross-origin
}));

// Parse incoming JSON request bodies (populates req.body)
app.use(express.json());

// Parse cookies from incoming requests (populates req.cookies)
app.use(cookieParser());

// ----------------------------------------
// Routes
// ----------------------------------------

// Health check — visit http://localhost:5000/api/health to confirm server is running
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is up and running.' });
});

// Auth routes — register, login, refresh, logout
// All routes in authRoutes get the /api/auth prefix
// e.g. POST /api/auth/login
app.use('/api/auth', authRoutes);

// User routes — profile, dashboard, admin
// All routes in userRoutes get the /api/users prefix
// e.g. GET /api/users/profile
app.use('/api/users', userRoutes);

// ----------------------------------------
// Handle unknown routes
// ----------------------------------------
// If a request comes in for a URL that doesn't
// exist, send a clean 404 instead of letting
// Express crash or hang silently.

app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found.` });
});

// ----------------------------------------
// Global error handler
// ----------------------------------------
// If any route or middleware calls next(error),
// it lands here instead of crashing the server.
// The four arguments (err, req, res, next) are
// required — Express identifies this as an error
// handler by the four-parameter signature.

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Something went wrong on the server.',
    });
});

// ----------------------------------------
// Start server
// ----------------------------------------

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();