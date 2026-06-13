# auth-validate: JWT Authentication & Authorization System

A full-stack authentication system built to understand JWT tokens, refresh token rotation, and role-based authorization from the ground up.

## Features

- User registration and login with hashed passwords (bcrypt)
- Short-lived JWT access tokens (15 min) stored in memory/localStorage
- Long-lived refresh tokens (7 days) stored as httpOnly cookies
- Refresh token rotation — every refresh invalidates the old token and issues a new one
- Server-side refresh token whitelist (database-backed session registry)
- Automatic silent token refresh on the frontend via axios interceptors
- Role-based authorization (user / admin)
- Protected routes on both frontend (React) and backend (Express)

## Tech Stack

- **Backend:** Node.js, Express, Sequelize, SQLite, bcryptjs, jsonwebtoken
- **Frontend:** React (Vite), Tailwind CSS, React Router, Axios

# Project Structure

## Setup Instructions

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with the following variables:

```env
PORT=5000
NODE_ENV=development
DB_PATH=./src/database.sqlite
ACCESS_TOKEN_SECRET=your_secret_here
REFRESH_TOKEN_SECRET=your_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLIENT_URL=http://localhost:5173
```

Start the server:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint    | Description                                   | Auth Required |
| ------ | ----------- | --------------------------------------------- | ------------- |
| POST   | `/register` | Create a new account                          | No            |
| POST   | `/login`    | Log in, receive access token + refresh cookie | No            |
| POST   | `/refresh`  | Get a new access token using refresh cookie   | No (cookie)   |
| POST   | `/logout`   | Invalidate session                            | No            |

### User Routes (`/api/users`)

| Method | Endpoint     | Description                  | Auth Required    |
| ------ | ------------ | ---------------------------- | ---------------- |
| GET    | `/test`      | Sanity check                 | No               |
| GET    | `/profile`   | Get logged-in user's profile | Yes              |
| GET    | `/dashboard` | Get dashboard data           | Yes              |
| GET    | `/admin`     | Admin-only data              | Yes (admin role) |

## How the Token System Works

1. **Login** issues two tokens: a short-lived JWT access token (returned in response body) and a long-lived random refresh token (set as an httpOnly cookie). The refresh token's hash is stored in a database "token registry."

2. **Protected requests** attach the access token via `Authorization: Bearer <token>`. Backend middleware verifies the JWT signature and expiry.

3. **Token expiry**: when the access token expires (15 min), the next request returns `401` with `code: TOKEN_EXPIRED`. The frontend's axios response interceptor catches this, silently calls `/refresh`, gets a new access token, and retries the original request — the user notices nothing.

4. **Refresh token rotation**: every successful `/refresh` call deletes the old token record and creates a new one, returning a new refresh token cookie. This means each refresh token can only be used once — if a stolen token is reused after the legitimate user has refreshed, it will be rejected.

5. **Logout** deletes the refresh token record from the database and clears the cookie — the session is invalidated on both ends immediately.

## Security Notes

- Passwords are hashed with bcrypt (cost factor 12) before storage
- Refresh tokens are stored as SHA-256 hashes in the database, never in plaintext
- Refresh tokens use httpOnly, sameSite=strict cookies — inaccessible to JavaScript, protecting against XSS and CSRF
- Access tokens are never stored in cookies, avoiding CSRF on protected API calls
