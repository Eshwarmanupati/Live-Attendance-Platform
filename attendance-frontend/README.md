# Attend — Frontend

React 19 + Vite single-page app for the [Attend](../README.md) attendance platform.

## Quick start

```bash
npm install
cp .env.example .env     # point at your API
npm run dev              # http://localhost:5173
```

The API must be running first — see [`../live-attendance-system`](../live-attendance-system).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production bundle into `dist/` |
| `npm run preview` | Serve the built bundle |
| `npm test` | Vitest (jsdom) |
| `npm run lint` | ESLint |

## Layout

```
src/
├── api/          axios instance (auth header, 401 handling) + service wrappers
├── context/      AuthContext (session), WsContext (socket, rooms, reconnect)
├── components/   ui/ primitives, layout/, teacher/ widgets
├── pages/        public/ landing, auth/, teacher/, student/
├── hooks/        useClasses and context re-exports
└── utils/        constants, date formatting, storage
```

**`WsContext` is the interesting part:** it owns one socket for the whole app, tracks live
sessions as a `classId → session` map so several classes can be live at once, reconnects with
exponential backoff and jitter, and stops retrying on close code `4001` (rejected credentials)
because retrying cannot fix that.

## Environment

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5001/api` | REST base URL |
| `VITE_WS_URL` | derived from `VITE_API_URL` | WebSocket origin |

Both are read at build time. A production deploy must set them before building, and use `wss://`
for the socket when the site is served over HTTPS.
