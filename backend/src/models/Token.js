const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Token = sequelize.define('Token', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
        onDelete: 'CASCADE', // if a user is deleted, all their tokens are deleted too
    },
    token: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true, // no two rows can have the same token hash
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'tokens',
    timestamps: true,
});

// Define the relationship — a User has many Tokens
User.hasMany(Token, { foreignKey: 'userId' });
Token.belongsTo(User, { foreignKey: 'userId' });

module.exports = Token;


// ## What each part does

// `userId` with `references` — this is a **foreign key**. It links every token row back to a specific user row in the `users` table. You can't create a token for a `userId` that doesn't exist in the `users` table — the database enforces this automatically.

// `onDelete: 'CASCADE'` — if a user account is deleted, all their token records in this table are automatically deleted too. Without this, you'd have "orphan" token rows pointing to users that no longer exist.

// `token: DataTypes.STRING(64)` — we store a **SHA-256 hash** of the refresh token here, not the raw token itself. SHA-256 always produces a 64-character hex string, so we size the column exactly to that. If your database is ever breached, attackers get hashes — useless without the original values.

// `unique: true` on the token column — ensures no two sessions can ever have the same token hash stored. An extra layer of integrity.

// `expiresAt` — we store the expiry date explicitly so we can check it server-side. Even if a token exists in the database, if `expiresAt` is in the past we reject it. This is a double check — the token is both in the whitelist AND not expired.

// `User.hasMany(Token)` and `Token.belongsTo(User)` — these two lines tell Sequelize about the **relationship** between the two models. One user can have many tokens (multiple devices, multiple logins). Each token belongs to exactly one user. Sequelize uses this to enable queries like "find all tokens for this user."

// ## Why two model files instead of one?

// You might wonder why tokens aren't just a field on the User model. The reason is **separation of concerns** — a user is a person with an identity, a token is a session artifact. Mixing them would mean every time you load a user, you'd also load their tokens, and vice versa. Keeping them as separate tables with a relationship gives you clean, independent control over both.