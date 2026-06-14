const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../../', process.env.DB_PATH),
    logging: false,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('SQLite database connected successfully.');
        await sequelize.sync({ alter: true });
        console.log('All models synchronized with database.');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };