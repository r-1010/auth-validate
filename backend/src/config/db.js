const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Create a Sequelize instance pointing to our SQLite file
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../../', process.env.DB_PATH),
    logging: false, // set to console.log if you want to see SQL queries in terminal
});

// Test the connection
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('\nSQLite database connected successfully...\n');

        // sync() creates the tables if they don't exist yet
        // "alter: true" updates existing tables if your models change
        await sequelize.sync({ alter: true });
        console.log('All models synchronized with database.\n');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1); // stop the app if DB can't connect — nothing works without it
    }
};

module.exports = { sequelize, connectDB };

// ## What each part does:

// `new Sequelize({ dialect: 'sqlite', storage: ... })` — creates the connection. `dialect` tells Sequelize which database type it's talking to. `storage` is the file path where SQLite will create (or find) the `.sqlite` file on disk.

// `sequelize.authenticate()` — sends a simple test query to confirm the connection is alive. If it fails, there's no point continuing.

// `sequelize.sync({ alter: true })` — looks at all your models and creates or updates the matching tables in the database automatically. This means you never have to write `CREATE TABLE` SQL by hand.

// `process.exit(1)` — if the database can't connect, the entire app shuts down immediately. This is intentional — an auth app with no database is completely broken, so there's no reason to keep running.

// `module.exports = { sequelize, connectDB }` — exports two things. `connectDB` will be called once in `app.js` when the server starts. `sequelize` will be imported by your model files so they can define their tables against the same connection.
