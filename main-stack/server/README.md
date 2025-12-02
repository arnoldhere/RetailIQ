# RetailIQ server

This backend implements the API for RetailIQ. The repository includes a new authentication API (/api/auth) with cookie-based JWT tokens.

Environment variables
- Copy `.env.example` to `.env` and set the database connection and JWT secret.

Required vars (example in `.env.example`)
- DB_HOST_SQL, DB_USER_SQL, DB_PASSWORD_SQL, DB_NAME_SQL
- JWT_SECRET
- CLIENT_URL (defaults to http://localhost:5173)

Routes added
- POST /api/auth/signup — JSON body: { firstname, lastname, email, password, phone? }
- POST /api/auth/login — JSON body: { identifier, password } where identifier is email OR phone
- GET /api/auth/me — returns authenticated user (reads JWT cookie or Authorization header)
- POST /api/auth/logout — clears cookie

Cookie behavior
- The auth token is set as an httpOnly cookie called `retailiq_token` by default.

Install and run
1. cd server
2. npm install
3. copy `.env.example` -> `.env` and update values
4. npm run start
