import { describe, it, expect } from "vitest";
import Class from "../src/models/Class.js";
import { createTeacher, createStudent, createClassFor, asUser } from "./factories.js";

describe("POST /api/classes", () => {
  it("lets a teacher create a class and assigns a join code", async () => {
    const { token } = await createTeacher();
    const res = await asUser(token).post("/api/classes").send({ title: "Operating Systems" });

    expect(res.status).toBe(201);
    expect(res.body.data.class.title).toBe("Operating Systems");
    expect(res.body.data.class.joinCode).toMatch(/^[A-Z2-9]{6}$/);
  });

  it("forbids a student from creating a class", async () => {
    const { token } = await createStudent();
    const res = await asUser(token).post("/api/classes").send({ title: "Not Allowed" });

    expect(res.status).toBe(403);
  });

  it("rejects a title under 3 characters", async () => {
    const { token } = await createTeacher();
    expect((await asUser(token).post("/api/classes").send({ title: "OS" })).status).toBe(400);
  });

  it("issues distinct join codes", async () => {
    const { token } = await createTeacher();
    const codes = new Set();
    for (let i = 0; i < 5; i += 1) {
       
      const res = await asUser(token).post("/api/classes").send({ title: `Class number ${i}` });
      codes.add(res.body.data.class.joinCode);
    }
    expect(codes.size).toBe(5);
  });
});

describe("GET /api/classes", () => {
  it("returns only the classes a teacher owns", async () => {
    const { user: mine, token } = await createTeacher();
    const { user: other } = await createTeacher();
    await createClassFor(mine, { title: "Mine" });
    await createClassFor(other, { title: "Theirs" });

    const res = await asUser(token).get("/api/classes");

    expect(res.body.data.classes).toHaveLength(1);
    expect(res.body.data.classes[0].title).toBe("Mine");
  });

  it("returns only the classes a student is enrolled in, not every class in the database", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    await createClassFor(teacher, { title: "Enrolled", students: [student] });
    await createClassFor(teacher, { title: "Somebody else's class" });

    const res = await asUser(token).get("/api/classes");

    expect(res.body.data.classes).toHaveLength(1);
    expect(res.body.data.classes[0].title).toBe("Enrolled");
  });

  it("lists joinable classes under scope=available", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    await createClassFor(teacher, { title: "Already in", students: [student] });
    await createClassFor(teacher, { title: "Could join" });

    const res = await asUser(token).get("/api/classes?scope=available");

    expect(res.body.data.classes.map((c) => c.title)).toEqual(["Could join"]);
  });
});

describe("GET /api/classes/:id", () => {
  it("lets the owning teacher read it", async () => {
    const { user: teacher, token } = await createTeacher();
    const cls = await createClassFor(teacher);
    expect((await asUser(token).get(`/api/classes/${cls._id}`)).status).toBe(200);
  });

  it("lets an enrolled student read it", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });
    expect((await asUser(token).get(`/api/classes/${cls._id}`)).status).toBe(200);
  });

  it("forbids a student who is not enrolled", async () => {
    const { user: teacher } = await createTeacher();
    const { token } = await createStudent();
    const cls = await createClassFor(teacher);
    expect((await asUser(token).get(`/api/classes/${cls._id}`)).status).toBe(403);
  });

  it("forbids a different teacher", async () => {
    const { user: owner } = await createTeacher();
    const { token } = await createTeacher();
    const cls = await createClassFor(owner);
    expect((await asUser(token).get(`/api/classes/${cls._id}`)).status).toBe(403);
  });

  it("rejects a malformed id with 400 rather than a cast error", async () => {
    const { token } = await createTeacher();
    const res = await asUser(token).get("/api/classes/not-an-id");
    expect(res.status).toBe(400);
  });
});

describe("class updates and deletion", () => {
  it("lets the owner rename a class", async () => {
    const { user: teacher, token } = await createTeacher();
    const cls = await createClassFor(teacher);
    const res = await asUser(token).put(`/api/classes/${cls._id}`).send({ title: "Renamed Class" });

    expect(res.status).toBe(200);
    expect(res.body.data.class.title).toBe("Renamed Class");
  });

  it("stops a different teacher from renaming it", async () => {
    const { user: owner } = await createTeacher();
    const { token } = await createTeacher();
    const cls = await createClassFor(owner);

    const res = await asUser(token).put(`/api/classes/${cls._id}`).send({ title: "Hijacked" });
    expect(res.status).toBe(403);
  });

  it("ignores attempts to reassign the teacher or the roster through an update", async () => {
    const { user: teacher, token } = await createTeacher();
    const { user: attacker } = await createTeacher();
    const { user: student } = await createStudent();
    const cls = await createClassFor(teacher);

    await asUser(token)
      .put(`/api/classes/${cls._id}`)
      .send({ title: "Still mine", teacher: attacker._id, students: [student._id], joinCode: "HACKED" });

    const reloaded = await Class.findById(cls._id);
    expect(String(reloaded.teacher)).toBe(String(teacher._id));
    expect(reloaded.students).toHaveLength(0);
    expect(reloaded.joinCode).toBe(cls.joinCode);
  });

  it("stops a different teacher from deleting it", async () => {
    const { user: owner } = await createTeacher();
    const { token } = await createTeacher();
    const cls = await createClassFor(owner);

    expect((await asUser(token).delete(`/api/classes/${cls._id}`)).status).toBe(403);
    expect(await Class.exists({ _id: cls._id })).toBeTruthy();
  });
});

describe("enrolment", () => {
  it("lets a student join with a join code", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    const cls = await createClassFor(teacher);

    const res = await asUser(token).post("/api/classes/join").send({ joinCode: cls.joinCode });

    expect(res.status).toBe(200);
    const reloaded = await Class.findById(cls._id);
    expect(reloaded.hasStudent(student._id)).toBe(true);
  });

  it("accepts a lowercase join code", async () => {
    const { user: teacher } = await createTeacher();
    const { token } = await createStudent();
    const cls = await createClassFor(teacher);

    const res = await asUser(token).post("/api/classes/join").send({ joinCode: cls.joinCode.toLowerCase() });
    expect(res.status).toBe(200);
  });

  it("rejects an unknown join code with 404", async () => {
    const { token } = await createStudent();
    expect((await asUser(token).post("/api/classes/join").send({ joinCode: "ZZZZZZ" })).status).toBe(404);
  });

  it("rejects joining twice", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });

    expect((await asUser(token).post("/api/classes/join").send({ joinCode: cls.joinCode })).status).toBe(409);
  });

  it("does not duplicate the roster entry when two joins race", async () => {
    const { user: teacher } = await createTeacher();
    const { token } = await createStudent();
    const cls = await createClassFor(teacher);

    await Promise.all([
      asUser(token).post("/api/classes/join").send({ joinCode: cls.joinCode }),
      asUser(token).post("/api/classes/join").send({ joinCode: cls.joinCode }),
    ]);

    const reloaded = await Class.findById(cls._id);
    expect(reloaded.students).toHaveLength(1);
  });

  it("lets a student leave", async () => {
    const { user: teacher } = await createTeacher();
    const { user: student, token } = await createStudent();
    const cls = await createClassFor(teacher, { students: [student] });

    expect((await asUser(token).delete(`/api/classes/${cls._id}/enroll`)).status).toBe(200);
    const reloaded = await Class.findById(cls._id);
    expect(reloaded.hasStudent(student._id)).toBe(false);
  });

  it("forbids a teacher from using the student join flow", async () => {
    const { user: owner } = await createTeacher();
    const { token } = await createTeacher();
    const cls = await createClassFor(owner);

    expect((await asUser(token).post("/api/classes/join").send({ joinCode: cls.joinCode })).status).toBe(403);
  });
});
