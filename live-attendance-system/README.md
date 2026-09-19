# Live Attendance API

Express 5 + WebSocket API for the [Attend](../README.md) attendance platform. Full architecture,
API reference and deployment notes live in the [root README](../README.md); this file covers
running and working on the service itself.

## Quick start

```bash
npm install
cp .env.example .env     # set MONGO_URI and a 32+ character JWT_SECRET
npm run seed             # optional: demo accounts, classes and 4 weeks of history
npm run dev              # http://localhost:5001
```

Generate a secret with `openssl rand -base64 48`. The process validates its environment at boot
and exits with a readable message rather than starting in a broken state.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with reload |
| `npm start` | Production server |
| `npm run seed` | Seed demo data (`-- --fresh` clears demo data first) |
| `npm test` | Integration tests against MongoDB |
| `npm run test:coverage` | Tests with a coverage report |
| `npm run lint` | ESLint |

## Layout

```
src/
├── config/       env.js (validated config, loaded first), db.js
├── models/       User, Class, Session, Attendance
├── services/     business logic — the layer worth reading first
├── controllers/  thin request/response handling
├── routes/       REST endpoints
├── middleware/   auth, roles, validation, rate limiting, error handling
├── websocket/    wsServer (auth, heartbeat), rooms (pub/sub), handlers
├── validations/  Zod schemas
└── utils/        ApiError, asyncHandler, logger, tokens, constants
```

Controllers stay thin and delegate to services; services own the rules and throw `ApiError`,
which the error middleware turns into a consistent JSON response.

## Tests

```bash
npm test                                                   # default: live-attendance-test db
MONGO_URI_TEST=mongodb://127.0.0.1:27017/other npm test    # override the database
```

Tests run against a real MongoDB so the unique indexes behave as they do in production. Each test
starts from empty collections with the indexes intact.

## Environment

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development` \| `test` \| `production` |
| `PORT` | no | `5001` | macOS reserves 5000 for AirPlay |
| `MONGO_URI` | **yes** | — | Include a database name |
| `JWT_SECRET` | **yes** | — | 32 characters minimum |
| `JWT_EXPIRES_IN` | no | `7d` | |
| `CLIENT_URL` | no | — | Allowed browser origin(s), comma-separated |
| `LATE_AFTER_MINUTES` | no | `10` | Grace period before a mark counts as late |
| `BCRYPT_ROUNDS` | no | `12` | |
