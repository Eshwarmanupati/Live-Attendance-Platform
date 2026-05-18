# 🎓 Live Attendance System

A production-ready backend for a **Live Attendance Application** built with Node.js, Express, MongoDB, and WebSockets. Teachers can start live sessions, students join and mark attendance in real-time, and all data is persisted in MongoDB.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Real-time | ws (WebSocket) |
| Config | dotenv |
| CORS | cors |
| Dev Server | nodemon |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd live-attendance-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/live-attendance
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 3. Run

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:5000`.

---

## 📁 Folder Structure

```
src/
├── config/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── User.js                # User schema (teacher/student)
│   ├── Class.js               # Class schema
│   └── Attendance.js          # Attendance record schema
├── controllers/
│   ├── auth.controller.js     # Signup, login, me
│   ├── class.controller.js    # CRUD for classes
│   └── attendance.controller.js  # Read attendance records
├── routes/
│   ├── auth.routes.js
│   ├── class.routes.js
│   └── attendance.routes.js
├── middleware/
│   ├── auth.middleware.js     # JWT verification
│   ├── role.middleware.js     # Role-based access control
│   └── error.middleware.js    # Centralized error handler
├── validations/
│   ├── auth.validation.js     # Zod schemas for auth
│   ├── class.validation.js    # Zod schemas for classes
│   └── attendance.validation.js  # Zod schemas for WS events
├── websocket/
│   └── wsServer.js            # WebSocket server & event handlers
├── utils/
│   ├── generateToken.js       # JWT token generator
│   └── ApiError.js            # Custom error class
├── app.js                     # Express app setup
└── server.js                  # HTTP + WS server bootstrap
```

---

## 🔐 Authentication

All protected routes require a JWT in the Authorization header:

```
Authorization: Bearer <your_token>
```

---

## 📡 REST API Endpoints

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and get JWT |
| GET | `/api/auth/me` | Private | Get current user |

### Classes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/classes` | Teacher | Create a class |
| GET | `/api/classes` | Any | List classes (filtered by role) |
| GET | `/api/classes/:id` | Any | Get a class by ID |
| PUT | `/api/classes/:id` | Teacher (owner) | Update a class |
| DELETE | `/api/classes/:id` | Teacher (owner) | Delete a class |

### Attendance

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/attendance/:classId` | Private | Get attendance for a class |
| GET | `/api/attendance/:classId/student/:studentId` | Private | Get student attendance |

---

## 🌐 WebSocket

Connect to the WebSocket server by passing your JWT as a query param:

```
ws://localhost:5000?token=<your_jwt>
```

### Client → Server Events

#### `START_SESSION` (Teacher only)
```json
{
  "type": "START_SESSION",
  "classId": "664f..."
}
```

#### `MARK_ATTENDANCE` (Student only)
```json
{
  "type": "MARK_ATTENDANCE",
  "classId": "664f...",
  "studentId": "665a..."
}
```

#### `END_SESSION` (Teacher only)
```json
{
  "type": "END_SESSION",
  "classId": "664f..."
}
```

---

### Server → Client Events

#### `SESSION_STARTED`
```json
{
  "type": "SESSION_STARTED",
  "classId": "664f...",
  "classTitle": "Math 101",
  "teacher": { "id": "...", "name": "Mr. Smith" },
  "startedAt": "2024-01-01T10:00:00.000Z"
}
```

#### `ATTENDANCE_UPDATED`
```json
{
  "type": "ATTENDANCE_UPDATED",
  "classId": "664f...",
  "studentId": "665a...",
  "studentName": "Alice",
  "status": "present",
  "presentCount": 12,
  "timestamp": "2024-01-01T10:05:00.000Z"
}
```

#### `SESSION_ENDED`
```json
{
  "type": "SESSION_ENDED",
  "classId": "664f...",
  "finalPresentCount": 25,
  "endedAt": "2024-01-01T11:00:00.000Z"
}
```

#### `ERROR`
```json
{
  "type": "ERROR",
  "message": "You have already marked attendance for this class."
}
```

---

## 📝 Example API Requests

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mr. Smith",
    "email": "teacher@example.com",
    "password": "secret123",
    "role": "teacher"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "secret123"
  }'
```

### Create a Class (Teacher)
```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher_token>" \
  -d '{
    "title": "Mathematics 101",
    "description": "Introduction to calculus"
  }'
```

### Get All Classes
```bash
curl http://localhost:5000/api/classes \
  -H "Authorization: Bearer <your_token>"
```

### Get Attendance for a Class
```bash
curl http://localhost:5000/api/attendance/<classId> \
  -H "Authorization: Bearer <your_token>"
```

---

## ⚙️ Business Rules

- Only **one active session** globally at any time
- Only the **teacher who created the class** can start/end its session
- Students **cannot mark attendance twice** (enforced at DB level with a unique index)
- Attendance can only be marked during an **active session**
- Students can only mark **their own** attendance via WebSocket

---

## 🛡️ Error Response Format

All errors return consistent JSON:

```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

---

## 🧪 Testing WebSocket

Edit and run the provided example client:

```bash
node ws-client-example.js
```

Replace the placeholder tokens and IDs in `ws-client-example.js` with real values from your signup/login responses.