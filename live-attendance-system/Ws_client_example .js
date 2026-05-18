/**
 * ============================================================
 * WebSocket Client Example
 * ============================================================
 * Run this file to test the WebSocket server locally.
 * Usage:
 *   node ws-client-example.js
 *
 * Replace the TOKEN values with real JWTs from /api/auth/login.
 * ============================================================
 */

const WebSocket = require("ws");

// -------------------------------------------------------
// CONFIGURATION — replace with your actual values
// -------------------------------------------------------
const SERVER_URL = "ws://localhost:5000";
const TEACHER_TOKEN = "REPLACE_WITH_TEACHER_JWT";
const STUDENT_TOKEN = "REPLACE_WITH_STUDENT_JWT";
const CLASS_ID = "REPLACE_WITH_CLASS_ID";
const STUDENT_ID = "REPLACE_WITH_STUDENT_USER_ID";
// -------------------------------------------------------

/**
 * Create a WebSocket connection with the given token.
 * @param {string} role  - "teacher" or "student" (for logging only)
 * @param {string} token - JWT token
 * @param {Function} onOpen - Callback when connection is established
 */
function createClient(role, token, onOpen) {
  const ws = new WebSocket(`${SERVER_URL}?token=${token}`);

  ws.on("open", () => {
    console.log(`\n[${role.toUpperCase()}] Connected to WebSocket server`);
    onOpen(ws);
  });

  ws.on("message", (data) => {
    const event = JSON.parse(data.toString());
    console.log(`[${role.toUpperCase()}] Received event:`, JSON.stringify(event, null, 2));
  });

  ws.on("close", () => {
    console.log(`[${role.toUpperCase()}] Disconnected`);
  });

  ws.on("error", (err) => {
    console.error(`[${role.toUpperCase()}] WS Error:`, err.message);
  });

  return ws;
}

// -------------------------------------------------------
// DEMO FLOW
// 1. Teacher connects and starts a session
// 2. Student connects and marks attendance
// 3. Teacher ends the session after 5 seconds
// -------------------------------------------------------

// Step 1: Teacher connects and starts the session
const teacherWs = createClient("teacher", TEACHER_TOKEN, (ws) => {
  console.log("[TEACHER] Starting session...");
  ws.send(JSON.stringify({
    type: "START_SESSION",
    classId: CLASS_ID,
  }));
});

// Step 2: Student connects and marks attendance after a short delay
setTimeout(() => {
  createClient("student", STUDENT_TOKEN, (ws) => {
    console.log("[STUDENT] Marking attendance...");
    ws.send(JSON.stringify({
      type: "MARK_ATTENDANCE",
      classId: CLASS_ID,
      studentId: STUDENT_ID,
    }));
  });
}, 1500);

// Step 3: Teacher ends the session after 5 seconds
setTimeout(() => {
  if (teacherWs.readyState === WebSocket.OPEN) {
    console.log("[TEACHER] Ending session...");
    teacherWs.send(JSON.stringify({
      type: "END_SESSION",
      classId: CLASS_ID,
    }));
  }
}, 5000);