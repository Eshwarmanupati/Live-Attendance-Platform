import { describe, it, expect } from "vitest";
import * as sessionService from "../src/services/session.service.js";
import { createTeacher, createStudent, createClassFor, asUser } from "./factories.js";

const heldSession = async ({ marks = [], students = [] } = {}) => {
  const { user: teacher, token: teacherToken } = await createTeacher();
  const cls = await createClassFor(teacher, { students });
  await sessionService.startSession(cls._id, teacher);
  for (const student of marks) {
     
    await sessionService.markAttendance({ classId: cls._id, studentId: student._id });
  }
  return { teacher, teacherToken, cls };
};

describe("GET /api/attendance/class/:classId", () => {
  it("returns the roster grouped by session for the owning teacher", async () => {
    const { user: student } = await createStudent({ name: "Marked Student" });
    const { teacherToken, cls } = await heldSession({ students: [student], marks: [student] });

    const res = await asUser(teacherToken).get(`/api/attendance/class/${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(1);
    expect(res.body.data.sessions[0].records[0].studentId.name).toBe("Marked Student");
  });

  it("forbids a student — the old endpoint let any signed-in user read any class's roster", async () => {
    const { user: student, token: studentToken } = await createStudent();
    const { cls } = await heldSession({ students: [student], marks: [student] });

    const res = await asUser(studentToken).get(`/api/attendance/class/${cls._id}`);

    expect(res.status).toBe(403);
  });

  it("forbids a teacher who does not own the class", async () => {
    const { token: otherTeacherToken } = await createTeacher();
    const { cls } = await heldSession();

    expect((await asUser(otherTeacherToken).get(`/api/attendance/class/${cls._id}`)).status).toBe(403);
  });
});

describe("GET /api/attendance/session/:sessionId", () => {
  it("lets an enrolled student see the live roster", async () => {
    const { user: student, token: studentToken } = await createStudent();
    const { cls } = await heldSession({ students: [student], marks: [student] });
    const session = await sessionService.getActiveSession(cls._id);

    const res = await asUser(studentToken).get(`/api/attendance/session/${session._id}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it("forbids a student who is not enrolled", async () => {
    const { token: outsiderToken } = await createStudent();
    const { cls } = await heldSession();
    const session = await sessionService.getActiveSession(cls._id);

    expect((await asUser(outsiderToken).get(`/api/attendance/session/${session._id}`)).status).toBe(403);
  });
});

describe("GET /api/attendance/me", () => {
  it("summarises the student's own attendance across enrolled classes in one request", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    const cls = await createClassFor(teacher, { title: "Attended Class", students: [student] });

    // Two sessions held; the student attends one and misses the other.
    await sessionService.startSession(cls._id, teacher);
    await sessionService.markAttendance({ classId: cls._id, studentId: student._id });
    await sessionService.endSession(cls._id, teacher);

    await sessionService.startSession(cls._id, teacher);
    await sessionService.endSession(cls._id, teacher);

    const res = await asUser(token).get("/api/attendance/me");

    expect(res.status).toBe(200);
    expect(res.body.data.totals).toMatchObject({ sessions: 2, attended: 1, present: 1, absent: 1, rate: 50 });
    expect(res.body.data.classes[0]).toMatchObject({ sessions: 2, attended: 1, rate: 50 });
  });

  it("reports an empty summary for a student with no classes", async () => {
    const { token } = await createStudent();
    const res = await asUser(token).get("/api/attendance/me");

    expect(res.body.data.totals.sessions).toBe(0);
    expect(res.body.data.classes).toHaveLength(0);
  });

  it("never includes another student's records", async () => {
    const { user: teacher } = await createTeacher();
    const { user: mine, token } = await createStudent({ name: "Me" });
    const { user: theirs } = await createStudent({ name: "Somebody Else" });
    const cls = await createClassFor(teacher, { students: [mine, theirs] });

    await sessionService.startSession(cls._id, teacher);
    await sessionService.markAttendance({ classId: cls._id, studentId: mine._id });
    await sessionService.markAttendance({ classId: cls._id, studentId: theirs._id });

    const res = await asUser(token).get("/api/attendance/me");

    expect(res.body.data.totals.attended).toBe(1);
    expect(JSON.stringify(res.body)).not.toContain(String(theirs._id));
  });

  it("is closed to teachers", async () => {
    const { token } = await createTeacher();
    expect((await asUser(token).get("/api/attendance/me")).status).toBe(403);
  });
});

describe("GET /api/attendance/stats", () => {
  it("returns dashboard totals for the teacher", async () => {
    const { user: student } = await createStudent();
    const { teacherToken, cls, teacher } = await heldSession({ students: [student], marks: [student] });
    await sessionService.endSession(cls._id, teacher);

    const res = await asUser(teacherToken).get("/api/attendance/stats");

    expect(res.status).toBe(200);
    expect(res.body.data.stats).toMatchObject({ classes: 1, students: 1, sessions: 1, present: 1 });
    expect(res.body.data.stats.attendanceRate).toBe(100);
  });

  it("is closed to students", async () => {
    const { token } = await createStudent();
    expect((await asUser(token).get("/api/attendance/stats")).status).toBe(403);
  });
});

describe("GET /api/attendance/class/:classId/export", () => {
  it("returns CSV with a filename for the owning teacher", async () => {
    const { user: student } = await createStudent({ name: "Exported Student" });
    const { teacherToken, cls } = await heldSession({ students: [student], marks: [student] });

    const res = await asUser(teacherToken).get(`/api/attendance/class/${cls._id}/export`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toMatch(/attendance\.csv/);
    expect(res.text).toContain("Exported Student");
    expect(res.text.split("\r\n")[0]).toBe("Student,Email,Status,Marked At,Minutes After Start,Session");
  });

  it("quotes a field containing a comma so the CSV cannot be broken by a name", async () => {
    const { user: student } = await createStudent({ name: 'Doe, John "Jack"' });
    const { teacherToken, cls } = await heldSession({ students: [student], marks: [student] });

    const res = await asUser(teacherToken).get(`/api/attendance/class/${cls._id}/export`);

    expect(res.text).toContain('"Doe, John ""Jack"""');
  });

  it("forbids a student", async () => {
    const { user: student, token } = await createStudent();
    const { cls } = await heldSession({ students: [student] });

    expect((await asUser(token).get(`/api/attendance/class/${cls._id}/export`)).status).toBe(403);
  });
});
