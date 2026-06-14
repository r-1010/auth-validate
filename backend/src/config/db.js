const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = isProduction
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: false,
    })
    : new Sequelize({
        dialect: 'sqlite',
        storage: path.resolve(__dirname, '../../', process.env.DB_PATH),
        logging: false,
    });

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        const dbType = isProduction ? 'PostgreSQL' : 'SQLite';
        console.log(`${dbType} database connected successfully.`);
        await sequelize.sync({ alter: true });
        console.log('All models synchronized with database.');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };