import { describe, it, expect } from "vitest";
import Session from "../src/models/Session.js";
import Attendance from "../src/models/Attendance.js";
import * as sessionService from "../src/services/session.service.js";
import { createTeacher, createStudent, createClassFor, asUser } from "./factories.js";

describe("starting a session", () => {
  it("creates an active session for the class", async () => {
    const { user: teacher } = await createTeacher();
    const cls = await createClassFor(teacher);

    const { session } = await sessionService.startSession(cls._id, teacher);

    expect(session.status).toBe("active");
    expect(String(session.classId)).toBe(String(cls._id));
  });

  it("refuses a second session for the same class", async () => {
    const { user: teacher } = await createTeacher();
    const cls = await createClassFor(teacher);
    await sessionService.startSession(cls._id, teacher);

    await expect(sessionService.startSession(cls._id, teacher)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("refuses a session on a class the teacher does not own", async () => {
    const { user: owner } = await createTeacher();
    const { user: intruder } = await createTeacher();
    const cls = await createClassFor(owner);

    await expect(sessionService.startSession(cls._id, intruder)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("allows different classes to hold sessions at the same time", async () => {
    // The old implementation kept one session in a module variable, so a second
    // teacher anywhere in the deployment was refused.
    const { user: teacherA } = await createTeacher();
    const { user: teacherB } = await createTeacher();
    const classA = await createClassFor(teacherA, { title: "Class A" });
    const classB = await createClassFor(teacherB, { title: "Class B" });

    await sessionService.startSession(classA._id, teacherA);
    await sessionService.startSession(classB._id, teacherB);

    expect(await Session.countDocuments({ status: "active" })).toBe(2);
  });

  it("only ever creates one session when two requests race", async () => {
    const { user: teacher } = await createTeacher();
    const cls = await createClassFor(teacher);

    const results = await Promise.allSettled([
      sessionService.startSession(cls._id, teacher),
      sessionService.startSession(cls._id, teacher),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await Session.countDocuments({ classId: cls._id, status: "active" })).toBe(1);
  });
});

describe("marking attendance", () => {
  it("records an enrolled student as present", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });
    await sessionService.startSession(cls._id, teacher);

    const { record, counts } = await sessionService.markAttendance({
      classId: cls._id,
      studentId: student._id,
    });

    expect(record.status).toBe("present");
    expect(counts.attended).toBe(1);
  });

  it("records a student who marks in after the grace period as late", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });
    const { session } = await sessionService.startSession(cls._id, teacher);

    // LATE_AFTER_MINUTES is 10 in the test environment.
    session.startedAt = new Date(Date.now() - 15 * 60 * 1000);
    await session.save();

    const { record } = await sessionService.markAttendance({ classId: cls._id, studentId: student._id });

    expect(record.status).toBe("late");
    expect(record.minutesAfterStart).toBeGreaterThanOrEqual(15);
  });

  it("refuses a student who is not enrolled", async () => {
    const { user: teacher } = await createTeacher();
    const { user: outsider } = await createStudent();
    const cls = await createClassFor(teacher);
    await sessionService.startSession(cls._id, teacher);

    await expect(
      sessionService.markAttendance({ classId: cls._id, studentId: outsider._id })
    ).rejects.toMatchObject({ statusCode: 403, code: "NOT_ENROLLED" });
  });

  it("refuses when no session is live", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });

    await expect(
      sessionService.markAttendance({ classId: cls._id, studentId: student._id })
    ).rejects.toMatchObject({ code: "NO_ACTIVE_SESSION" });
  });

  it("refuses a second mark in the same session", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });
    await sessionService.startSession(cls._id, teacher);

    await sessionService.markAttendance({ classId: cls._id, studentId: student._id });

    await expect(
      sessionService.markAttendance({ classId: cls._id, studentId: student._id })
    ).rejects.toMatchObject({ statusCode: 409, code: "ALREADY_MARKED" });
  });

  it("writes only one record when a student double-taps", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });
    await sessionService.startSession(cls._id, teacher);

    await Promise.allSettled([
      sessionService.markAttendance({ classId: cls._id, studentId: student._id }),
      sessionService.markAttendance({ classId: cls._id, studentId: student._id }),
    ]);

    expect(await Attendance.countDocuments({ studentId: student._id })).toBe(1);
  });

  it("lets the same student mark again in a later session of the same class", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });

    await sessionService.startSession(cls._id, teacher);
    await sessionService.markAttendance({ classId: cls._id, studentId: student._id });
    await sessionService.endSession(cls._id, teacher);

    await sessionService.startSession(cls._id, teacher);
    const { record } = await sessionService.markAttendance({ classId: cls._id, studentId: student._id });

    expect(record.status).toBe("present");
    expect(await Attendance.countDocuments({ studentId: student._id, classId: cls._id })).toBe(2);
  });
});

describe("ending a session", () => {
  it("records absences for enrolled students who never marked in", async () => {
    const { user: teacher } = await createTeacher();
    const { user: attended } = await createStudent();
    const { user: skipped } = await createStudent();
    const cls = await createClassFor(teacher, { students: [attended, skipped] });

    await sessionService.startSession(cls._id, teacher);
    await sessionService.markAttendance({ classId: cls._id, studentId: attended._id });
    const { session, counts } = await sessionService.endSession(cls._id, teacher);

    expect(counts).toMatchObject({ present: 1, absent: 1 });
    expect(session.summary).toMatchObject({ present: 1, absent: 1, enrolled: 2 });
    expect(await Attendance.countDocuments({ studentId: skipped._id, status: "absent" })).toBe(1);
  });

  it("frees the class so a new session can start", async () => {
    const { user: teacher } = await createTeacher();
    const cls = await createClassFor(teacher);

    await sessionService.startSession(cls._id, teacher);
    await sessionService.endSession(cls._id, teacher);

    await expect(sessionService.startSession(cls._id, teacher)).resolves.toBeTruthy();
  });

  it("refuses a teacher who does not own the class", async () => {
    const { user: owner } = await createTeacher();
    const { user: intruder } = await createTeacher();
    const cls = await createClassFor(owner);
    await sessionService.startSession(cls._id, owner);

    await expect(sessionService.endSession(cls._id, intruder)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("refuses when nothing is live", async () => {
    const { user: teacher } = await createTeacher();
    const cls = await createClassFor(teacher);

    await expect(sessionService.endSession(cls._id, teacher)).rejects.toMatchObject({
      code: "NO_ACTIVE_SESSION",
    });
  });
});

describe("recovery after a restart", () => {
  it("closes sessions left active by a crash, so the class is not locked forever", async () => {
    const { user: teacher } = await createTeacher();
    const cls = await createClassFor(teacher);
    const { session } = await sessionService.startSession(cls._id, teacher);

    session.startedAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await session.save();

    const closed = await sessionService.closeStaleSessions(12);

    expect(closed).toBe(1);
    expect((await Session.findById(session._id)).status).toBe("ended");
    await expect(sessionService.startSession(cls._id, teacher)).resolves.toBeTruthy();
  });

  it("leaves a genuinely recent session alone", async () => {
    const { user: teacher } = await createTeacher();
    const cls = await createClassFor(teacher);
    await sessionService.startSession(cls._id, teacher);

    expect(await sessionService.closeStaleSessions(12)).toBe(0);
  });
});

describe("GET /api/sessions/active", () => {
  it("lets a student restore live state after a refresh", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    const cls = await createClassFor(teacher, { title: "Live Class", students: [student] });
    await sessionService.startSession(cls._id, teacher);

    const res = await asUser(token).get("/api/sessions/active");

    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(1);
    expect(res.body.data.sessions[0]).toMatchObject({ classTitle: "Live Class", enrolled: 1 });
  });

  it("names its fields exactly as the SESSION_STARTED event does", async () => {
    // A client restoring after a refresh reads this payload as if it had
    // arrived live. When this returned `id` instead of `sessionId`, the live
    // roster came back empty after a reload.
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });
    const { session } = await sessionService.startSession(cls._id, teacher);

    const res = await asUser(token).get("/api/sessions/active");
    const [restored] = res.body.data.sessions;

    expect(restored.sessionId).toBe(String(session._id));
    expect(restored.classId).toBe(String(cls._id));
    expect(restored.startedAt).toBeTruthy();
    expect(restored.id).toBeUndefined();
  });

  it("does not leak sessions from classes the student is not in", async () => {
    const { user: teacher } = await createTeacher();
    const { token } = await createStudent();
    const cls = await createClassFor(teacher, { title: "Someone else's class" });
    await sessionService.startSession(cls._id, teacher);

    const res = await asUser(token).get("/api/sessions/active");
    expect(res.body.data.sessions).toHaveLength(0);
  });
});
