import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "http";
import { WebSocket } from "ws";
import app from "../src/app.js";
import { setupWebSocketServer } from "../src/websocket/wsServer.js";
import Attendance from "../src/models/Attendance.js";
import { createTeacher, createStudent, createClassFor } from "./factories.js";

let httpServer;
let wss;
let port;

beforeAll(async () => {
  httpServer = createServer(app);
  wss = setupWebSocketServer(httpServer);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  port = httpServer.address().port;
});

afterAll(async () => {
  wss.clients.forEach((client) => client.terminate());
  wss.close();
  await new Promise((resolve) => httpServer.close(resolve));
});

/** Opens a socket and collects every message it receives. */
const connect = (token) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}?token=${token ?? ""}`);
    const received = [];

    ws.messages = received;
    ws.on("message", (raw) => received.push(JSON.parse(raw.toString())));
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });

const send = (ws, type, payload = {}) => ws.send(JSON.stringify({ type, ...payload }));

/** Waits for a message of the given type, or fails the test on timeout. */
const waitFor = (ws, type, timeoutMs = 3000) =>
  new Promise((resolve, reject) => {
    const existing = ws.messages.find((m) => m.type === type);
    if (existing) return resolve(existing);

    const timer = setTimeout(() => {
      ws.off("message", onMessage);
      reject(new Error(`Timed out waiting for ${type}. Got: ${ws.messages.map((m) => m.type).join(", ") || "nothing"}`));
    }, timeoutMs);

    function onMessage(raw) {
      const message = JSON.parse(raw.toString());
      if (message.type !== type) return;
      clearTimeout(timer);
      ws.off("message", onMessage);
      resolve(message);
    }
    ws.on("message", onMessage);
  });

/** Gives the server time to deliver (or not deliver) a broadcast. */
const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const received = (ws, type) => ws.messages.some((m) => m.type === type);

describe("WebSocket authentication", () => {
  it("rejects a connection with no token and closes with 4001", async () => {
    const ws = await connect("");
    const close = await new Promise((resolve) => ws.on("close", (code) => resolve(code)));

    expect(close).toBe(4001);
  });

  it("rejects a forged token", async () => {
    const ws = await connect("clearly.not.valid");
    const close = await new Promise((resolve) => ws.on("close", (code) => resolve(code)));

    expect(close).toBe(4001);
  });

  it("greets an authenticated client and subscribes it without a second round trip", async () => {
    const { user: teacher, token } = await createTeacher();
    await createClassFor(teacher);

    const ws = await connect(token);
    const connected = await waitFor(ws, "CONNECTED");
    const subscribed = await waitFor(ws, "SUBSCRIBED");

    expect(connected.user).toMatchObject({ name: teacher.name, role: "teacher" });
    expect(subscribed.classIds).toHaveLength(1);
    ws.close();
  });
});

describe("live session flow", () => {
  it("delivers the session and each mark to the class the event belongs to", async () => {
    const { user: teacher, token: teacherToken } = await createTeacher();
    const { user: student, token: studentToken } = await createStudent({ name: "Live Student" });
    const cls = await createClassFor(teacher, { title: "Live Class", students: [student] });

    const teacherWs = await connect(teacherToken);
    const studentWs = await connect(studentToken);
    await Promise.all([waitFor(teacherWs, "SUBSCRIBED"), waitFor(studentWs, "SUBSCRIBED")]);

    send(teacherWs, "START_SESSION", { classId: String(cls._id) });
    const started = await waitFor(studentWs, "SESSION_STARTED");
    expect(started).toMatchObject({ classTitle: "Live Class", enrolled: 1 });

    send(studentWs, "MARK_ATTENDANCE", { classId: String(cls._id) });

    const confirmed = await waitFor(studentWs, "ATTENDANCE_CONFIRMED");
    expect(confirmed.status).toBe("present");

    const update = await waitFor(teacherWs, "ATTENDANCE_UPDATED");
    expect(update.student.name).toBe("Live Student");
    expect(update.counts.attended).toBe(1);

    send(teacherWs, "END_SESSION", { classId: String(cls._id) });
    const ended = await waitFor(studentWs, "SESSION_ENDED");
    expect(ended.summary).toMatchObject({ present: 1, enrolled: 1 });

    teacherWs.close();
    studentWs.close();
  });

  it("does not deliver a class's events to students outside it", async () => {
    // Every event used to be broadcast to every connected client, so a student
    // saw live banners for classes they had nothing to do with.
    const { user: teacher, token: teacherToken } = await createTeacher();
    const { user: enrolled, token: enrolledToken } = await createStudent();
    const { user: outsiderUser, token: outsiderToken } = await createStudent();

    const cls = await createClassFor(teacher, { title: "Private Class", students: [enrolled] });
    await createClassFor(teacher, { title: "Outsider's own class", students: [outsiderUser] });

    const teacherWs = await connect(teacherToken);
    const enrolledWs = await connect(enrolledToken);
    const outsiderWs = await connect(outsiderToken);
    await Promise.all([
      waitFor(teacherWs, "SUBSCRIBED"),
      waitFor(enrolledWs, "SUBSCRIBED"),
      waitFor(outsiderWs, "SUBSCRIBED"),
    ]);

    send(teacherWs, "START_SESSION", { classId: String(cls._id) });
    await waitFor(enrolledWs, "SESSION_STARTED");
    await settle();

    expect(received(outsiderWs, "SESSION_STARTED")).toBe(false);

    teacherWs.close();
    enrolledWs.close();
    outsiderWs.close();
  });

  it("ignores a client-supplied studentId and credits the authenticated account", async () => {
    // The old handler took studentId from the payload, so a student could mark
    // attendance on a classmate's behalf.
    const { user: teacher, token: teacherToken } = await createTeacher();
    const { user: attacker, token: attackerToken } = await createStudent({ name: "Attacker" });
    const { user: victim } = await createStudent({ name: "Victim" });
    const cls = await createClassFor(teacher, { students: [attacker, victim] });

    const teacherWs = await connect(teacherToken);
    const attackerWs = await connect(attackerToken);
    await Promise.all([waitFor(teacherWs, "SUBSCRIBED"), waitFor(attackerWs, "SUBSCRIBED")]);

    send(teacherWs, "START_SESSION", { classId: String(cls._id) });
    await waitFor(attackerWs, "SESSION_STARTED");

    send(attackerWs, "MARK_ATTENDANCE", { classId: String(cls._id), studentId: String(victim._id) });
    await waitFor(attackerWs, "ATTENDANCE_CONFIRMED");

    expect(await Attendance.countDocuments({ studentId: victim._id })).toBe(0);
    expect(await Attendance.countDocuments({ studentId: attacker._id })).toBe(1);

    teacherWs.close();
    attackerWs.close();
  });

  it("refuses a student trying to start a session", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });

    const ws = await connect(token);
    await waitFor(ws, "SUBSCRIBED");

    send(ws, "START_SESSION", { classId: String(cls._id) });
    const error = await waitFor(ws, "ERROR");

    expect(error.message).toMatch(/only teachers/i);
    ws.close();
  });

  it("refuses a teacher starting a session on someone else's class", async () => {
    const { user: owner } = await createTeacher();
    const { token: intruderToken } = await createTeacher();
    const cls = await createClassFor(owner);

    const ws = await connect(intruderToken);
    await waitFor(ws, "SUBSCRIBED");

    send(ws, "START_SESSION", { classId: String(cls._id) });
    const error = await waitFor(ws, "ERROR");

    expect(error.code).toBe("NOT_CLASS_OWNER");
    ws.close();
  });

  it("tells a student who marks twice that they are already counted", async () => {
    const { user: teacher, token: teacherToken } = await createTeacher();
    const { user: student, token: studentToken } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });

    const teacherWs = await connect(teacherToken);
    const studentWs = await connect(studentToken);
    await Promise.all([waitFor(teacherWs, "SUBSCRIBED"), waitFor(studentWs, "SUBSCRIBED")]);

    send(teacherWs, "START_SESSION", { classId: String(cls._id) });
    await waitFor(studentWs, "SESSION_STARTED");

    send(studentWs, "MARK_ATTENDANCE", { classId: String(cls._id) });
    await waitFor(studentWs, "ATTENDANCE_CONFIRMED");

    send(studentWs, "MARK_ATTENDANCE", { classId: String(cls._id) });
    const error = await waitFor(studentWs, "ERROR");

    expect(error.code).toBe("ALREADY_MARKED");
    teacherWs.close();
    studentWs.close();
  });

  it("refuses to mark attendance when no session is live", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });

    const ws = await connect(token);
    await waitFor(ws, "SUBSCRIBED");

    send(ws, "MARK_ATTENDANCE", { classId: String(cls._id) });
    const error = await waitFor(ws, "ERROR");

    expect(error.code).toBe("NO_ACTIVE_SESSION");
    ws.close();
  });
});

describe("protocol robustness", () => {
  it("reports malformed JSON instead of dropping the connection", async () => {
    const { token } = await createTeacher();
    const ws = await connect(token);
    await waitFor(ws, "SUBSCRIBED");

    ws.send("{not json");
    const error = await waitFor(ws, "ERROR");

    expect(error.message).toMatch(/invalid json/i);
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it("reports an unknown event type", async () => {
    const { token } = await createTeacher();
    const ws = await connect(token);
    await waitFor(ws, "SUBSCRIBED");

    send(ws, "DROP_TABLES", {});
    const error = await waitFor(ws, "ERROR");

    expect(error.message).toMatch(/unknown event type/i);
    ws.close();
  });

  it("rejects a classId that is not an object id", async () => {
    const { token } = await createTeacher();
    const ws = await connect(token);
    await waitFor(ws, "SUBSCRIBED");

    send(ws, "START_SESSION", { classId: "../../etc/passwd" });
    const error = await waitFor(ws, "ERROR");

    expect(error.code).toBe("VALIDATION_ERROR");
    ws.close();
  });

  it("will not subscribe a client to a class it does not belong to", async () => {
    const { user: teacher } = await createTeacher();
    const { token } = await createStudent();
    const foreign = await createClassFor(teacher);

    const ws = await connect(token);
    await waitFor(ws, "SUBSCRIBED");

    send(ws, "SUBSCRIBE", { classIds: [String(foreign._id)] });
    await settle();

    const subscriptions = ws.messages.filter((m) => m.type === "SUBSCRIBED").at(-1);
    expect(subscriptions.classIds).toHaveLength(0);
    ws.close();
  });
});
