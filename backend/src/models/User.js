const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: 'This username is already taken.',
        },
        validate: {
            notEmpty: { msg: 'Username cannot be empty.' },
            len: {
                args: [3, 30],
                msg: 'Username must be between 3 and 30 characters.',
            },
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: 'This email is already registered.',
        },
        validate: {
            isEmail: { msg: 'Please provide a valid email address.' },
            notEmpty: { msg: 'Email cannot be empty.' },
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Password cannot be empty.' },
            len: {
                args: [6, 100],
                msg: 'Password must be at least 6 characters.',
            },
        },
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
    },
}, {
    tableName: 'users',
    timestamps: true, // auto-adds createdAt and updatedAt columns
    hooks: {
        // Runs automatically before every save — hashes the password
        beforeSave: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(12);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
    },
});

// Instance method — call this to check a login password against the stored hash
User.prototype.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

module.exports = User;


// ## What each part does

// `sequelize.define('User', { ... })` — registers this model with Sequelize. The first argument `'User'` is the model name. Sequelize will look for (or create) a table named `users` (lowercased + pluralized by default, but we override it with `tableName: 'users'` to be explicit).

// `DataTypes.STRING / INTEGER / ENUM` — Sequelize's way of defining column types that map to SQLite column types under the hood.

// `allowNull: false` — makes the column required. If you try to create a user without an email, Sequelize throws a validation error before even touching the database.

// `unique` — ensures no two rows can have the same value. If someone tries to register with an already-used email, Sequelize catches it with the custom message.

// `validate` — Sequelize runs these checks before any database operation. `isEmail` checks email format, `len` checks string length. These run in JavaScript — they never even reach SQLite if they fail.

// `timestamps: true` — automatically adds `createdAt` and `updatedAt` columns to the table. Sequelize manages these for you — you never set them manually.

// `hooks: { beforeSave }` — a hook is a function that runs automatically at a specific point in a model's lifecycle. `beforeSave` runs every time a user is created or updated. `user.changed('password')` checks if the password field was actually modified — this prevents re-hashing an already hashed password when you update something unrelated like the username.

// `bcrypt.genSalt(12)` — generates a random "salt" (extra random data mixed into the hash). The `12` is the cost factor — higher means slower to compute, which makes brute-force attacks harder. 12 is the industry standard balance between security and speed.

// `User.prototype.comparePassword` — an instance method means you call it on a specific user object: `user.comparePassword('plaintext')`. It uses `bcrypt.compare` which hashes the plain password and compares it to the stored hash — you never store or compare plain passwords directly.
