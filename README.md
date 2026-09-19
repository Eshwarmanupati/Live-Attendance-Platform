# Attend — Live Attendance System

A full-stack classroom attendance platform. A teacher opens a live session; every enrolled
student sees it appear on their own device and marks themselves present; the roster fills in
front of the class over a WebSocket connection.

**[Live demo](#) · [API](#) · Demo logins: `teacher@demo.dev` / `student@demo.dev` — password `demopass123`**

> Replace the two links above once deployed — see [Deployment](#deployment).

---

## What it does

| | |
|---|---|
| **Live sessions** | A teacher starts a session for one class. Enrolled students receive it instantly over a WebSocket; each mark broadcasts back to the room in real time. |
| **Join codes** | Every class gets a unique six-character code. Students join with the code, or browse classes that are open to them. |
| **Present / late / absent** | A mark after the grace period is recorded as *late*. Ending a session writes an *absent* record for every enrolled student who never marked in, so attendance rates are counted rather than guessed. |
| **History and reporting** | Students see per-class rates and a full record list; teachers get per-session rosters, dashboard statistics and a CSV export. |
| **Role-based access** | Teachers reach only their own classes; students reach only classes they are enrolled in. Every read and write is authorised server-side. |

## Architecture

```
┌──────────────────────────┐        REST (JWT)        ┌───────────────────────────┐
│  React 19 + Vite SPA     │ ───────────────────────► │  Express 5 API            │
│                          │ ◄─────────────────────── │                           │
│  AuthContext  WsContext  │                          │  routes → controllers     │
│  (token)      (rooms,    │      WebSocket (ws)      │       → services → models │
│                reconnect)│ ◄───────────────────────►│                           │
└──────────────────────────┘   SESSION_STARTED        │  ws server: auth, rooms,  │
                               ATTENDANCE_UPDATED     │  heartbeat, rate limit    │
                               SESSION_ENDED          └─────────────┬─────────────┘
                                                                    │ Mongoose
                                                      ┌─────────────▼─────────────┐
                                                      │  MongoDB                  │
                                                      │  User · Class · Session   │
                                                      │  · Attendance             │
                                                      └───────────────────────────┘
```

**Session state lives in MongoDB, not in process memory.** That is what allows several classes to
hold sessions at once, a session to survive a server restart or redeploy, and the API to run on
more than one instance.

### Repository layout

```
attendance-system/
├── live-attendance-system/     # Express + WebSocket API
│   ├── src/
│   │   ├── config/             # validated environment, database connection
│   │   ├── models/             # User, Class, Session, Attendance
│   │   ├── services/           # business logic (auth, class, session, attendance)
│   │   ├── controllers/        # thin HTTP layer
│   │   ├── routes/             # REST endpoints
│   │   ├── middleware/         # auth, roles, validation, rate limits, errors
│   │   ├── websocket/          # ws server, room registry, event handlers
│   │   └── validations/        # Zod schemas
│   ├── scripts/seed.js         # demo data
│   └── tests/                  # 87 integration tests (Vitest + Supertest)
└── attendance-frontend/        # React 19 + Vite + Tailwind SPA
    └── src/
        ├── api/                # axios client and typed service wrappers
        ├── context/            # AuthContext, WsContext
        ├── components/         # ui primitives, layout, teacher widgets
        ├── pages/              # landing, auth, teacher, student
        └── hooks/
```

## Running it locally

**Requirements:** Node.js 20+, and MongoDB running locally (or a MongoDB Atlas connection string).

```bash
git clone https://github.com/Eshwarmanupati/Live-Attendance-Platform.git
cd Live-Attendance-Platform
```

**1. API**

```bash
cd live-attendance-system
npm install
cp .env.example .env          # then set MONGO_URI and a 32+ character JWT_SECRET
npm run seed                  # optional: demo accounts, classes and history
npm run dev                   # http://localhost:5001
```

Generate a secret with `openssl rand -base64 48`. The server refuses to start on an invalid
configuration rather than failing later at runtime.

**2. Frontend**

```bash
cd ../attendance-frontend
npm install
cp .env.example .env
npm run dev                   # http://localhost:5173
```

**3. See it live**

Open two browser windows — sign in as `teacher@demo.dev` in one and `student@demo.dev` in the
other (password `demopass123`). Start a session as the teacher and watch the student's screen.

## Tests

```bash
cd live-attendance-system && npm test    # 87 integration tests against MongoDB
cd attendance-frontend    && npm test    # 15 unit/component tests (jsdom)
```

The API tests run against a real MongoDB (`live-attendance-test` by default, overridable with
`MONGO_URI_TEST`) so the unique indexes that enforce *one active session per class* and *one
record per student per session* are genuinely exercised — the race conditions they prevent are
covered directly. The WebSocket suite opens real sockets against an ephemeral server and asserts
that events reach the right room and no other.

## API reference

All protected routes take `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | public | Register (rate limited) |
| POST | `/api/auth/login` | public | Sign in (rate limited) |
| GET | `/api/auth/me` | any | Current user |

### Classes
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/classes?scope=mine\|available` | any | Owned (teacher) or enrolled/joinable (student) |
| POST | `/api/classes` | teacher | Create a class, assigns a join code |
| GET | `/api/classes/:id` | teacher (owner) or enrolled student | One class |
| PUT | `/api/classes/:id` | teacher (owner) | Update title/description |
| DELETE | `/api/classes/:id` | teacher (owner) | Delete class, sessions and records |
| POST | `/api/classes/join` | student | Join with `{ joinCode }` |
| POST | `/api/classes/:id/enroll` | student | Join by id |
| DELETE | `/api/classes/:id/enroll` | student | Leave |

### Sessions and attendance
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/sessions/active` | any | Live sessions for your classes (restores state after a refresh) |
| GET | `/api/attendance/me` | student | Own records and per-class rates, in one request |
| GET | `/api/attendance/stats` | teacher | Dashboard totals |
| GET | `/api/attendance/session/:sessionId` | teacher (owner) or enrolled student | One session's roster |
| GET | `/api/attendance/class/:classId` | teacher (owner) | Every session of a class |
| GET | `/api/attendance/class/:classId/export` | teacher (owner) | CSV export |
| GET | `/health` | public | Liveness plus database state |

## WebSocket protocol

Connect with the JWT as a query parameter: `ws://localhost:5001?token=<jwt>`.
On connect the server authenticates the token, sends `CONNECTED`, and subscribes the socket to
every class the account belongs to.

**Client → server:** `SUBSCRIBE`, `START_SESSION`, `END_SESSION`, `MARK_ATTENDANCE` — each takes
`{ classId }`.

**Server → client:** `CONNECTED`, `SUBSCRIBED`, `SESSION_STARTED`, `ATTENDANCE_UPDATED`,
`ATTENDANCE_CONFIRMED`, `SESSION_ENDED`, `ERROR`.

```jsonc
// SESSION_STARTED
{ "type": "SESSION_STARTED", "sessionId": "…", "classId": "…", "classTitle": "Database Internals",
  "teacher": { "id": "…", "name": "Dr. Priya Rao" }, "startedAt": "…", "enrolled": 24 }

// ATTENDANCE_UPDATED — broadcast to that class's room only
{ "type": "ATTENDANCE_UPDATED", "classId": "…", "student": { "id": "…", "name": "Alex Chen" },
  "status": "present", "counts": { "present": 12, "late": 1, "absent": 0, "attended": 13 } }
```

`MARK_ATTENDANCE` carries no `studentId`: the server uses the authenticated socket's identity, so
a student cannot mark attendance on anyone else's behalf.

## Engineering notes

Decisions worth calling out, and the problems they solve:

- **Sessions are database rows with a partial unique index.** `{ classId }` unique where
  `status: "active"` means concurrent start requests cannot both succeed — the database rejects the
  second rather than the application racing itself. A `closeStaleSessions` sweep on boot releases
  sessions orphaned by a crash, which would otherwise lock a class permanently.
- **One attendance record per student per session,** enforced by a unique index on
  `{ sessionId, studentId }` and surfaced as a clear `ALREADY_MARKED` error rather than a duplicate row.
- **WebSocket rooms.** A room registry maps `classId → Set<socket>`, so an event reaches exactly
  the class it concerns. Membership is resolved server-side; a client asking to subscribe to a
  class it does not belong to is ignored.
- **Heartbeat.** Proxies and mobile networks drop connections without a close frame. The server
  pings every 30s and terminates sockets that never pong, so dead connections do not accumulate.
- **Reconnection with backoff and jitter.** The client retries on an unexpected close with
  exponential backoff, and stops entirely on close code `4001` (bad credentials), which no amount
  of retrying can fix.
- **Environment is validated at boot** with Zod. Configuration is read through one module that
  loads dotenv before anything else evaluates, so a missing or weak secret fails immediately and
  visibly instead of producing a subtly broken deployment.
- **Defence in depth:** helmet, per-route rate limits on credentials, a 100kb body cap, an 8kb
  WebSocket frame cap and a per-socket message budget, bcrypt at cost 12, and identical responses
  for "wrong password" and "unknown email" so accounts cannot be enumerated.

## Deployment

The frontend is a static bundle on Vercel; the API runs on Render, which supports the long-lived
WebSocket connections this project depends on (Vercel's serverless functions do not).

**1. Database — MongoDB Atlas**

Create a free cluster, add a database user, and under *Network Access* allow `0.0.0.0/0` (Render
does not publish fixed egress IPs on the free plan). Copy the connection string and add a database
name to it:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/live-attendance?retryWrites=true&w=majority
```

**2. API — Render**

In Render, choose *New → Blueprint* and point it at this repository; `render.yaml` describes the
service (root directory `live-attendance-system`, health check `/health`). Set the two variables
marked `sync: false` in the dashboard:

| Variable | Value |
|---|---|
| `MONGO_URI` | the Atlas string from step 1 |
| `CLIENT_URL` | your Vercel URL, e.g. `https://attend.vercel.app` (no trailing slash) |

`JWT_SECRET` is generated by Render. Confirm the deploy with `curl https://<api>.onrender.com/health`.

Seed the demo data from your own machine, pointing at the same database:

```bash
cd live-attendance-system
MONGO_URI="<your Atlas string>" npm run seed
```

**3. Frontend — Vercel**

Root directory `attendance-frontend`. Set both variables **before** building — Vite inlines them at
build time, so changing them later requires a redeploy:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<api>.onrender.com/api` |
| `VITE_WS_URL` | `wss://<api>.onrender.com` — note `wss`, not `ws`, on an HTTPS site |

`vercel.json` rewrites every path to `index.html`, so deep links such as `/teacher/dashboard`
resolve instead of returning 404.

**4. Close the loop**

Set `CLIENT_URL` on Render to the final Vercel origin and redeploy the API. Until that matches,
the browser blocks every request with a CORS error while the API itself looks perfectly healthy.

> **Free tier note:** Render sleeps a free instance after 15 minutes idle, and the next request
> takes roughly 30 seconds to wake it. The landing page pings `/health` on load to start that
> early, and tells the visitor what is happening if a demo sign-in is slow.

### Docker

```bash
docker compose up --build     # API on :5001, MongoDB on :27017
```

## Tech stack

**Frontend** React 19 · Vite · React Router 7 · Tailwind CSS · Axios · Vitest + Testing Library
**Backend** Node.js · Express 5 · MongoDB + Mongoose · ws · JWT · Zod · bcrypt · Vitest + Supertest
**Tooling** ESLint · GitHub Actions · Docker

---

Built by [Eshwar Manupati](https://github.com/Eshwarmanupati). MIT licensed.
