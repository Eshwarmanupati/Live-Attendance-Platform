import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createStudent, asUser, PASSWORD } from "./factories.js";

describe("POST /api/auth/signup", () => {
  it("creates an account and returns a token", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "Ada Lovelace",
      email: "ada@test.dev",
      password: PASSWORD,
      role: "teacher",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user).toMatchObject({ email: "ada@test.dev", role: "teacher" });
  });

  it("never returns the password hash", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Grace Hopper", email: "grace@test.dev", password: PASSWORD, role: "student" });

    expect(JSON.stringify(res.body)).not.toContain("$2");
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("rejects a duplicate email with 409", async () => {
    const payload = { name: "First", email: "dup@test.dev", password: PASSWORD, role: "student" };
    await request(app).post("/api/auth/signup").send(payload);
    const res = await request(app).post("/api/auth/signup").send({ ...payload, name: "Second" });

    expect(res.status).toBe(409);
  });

  it("normalises the email to lowercase", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Mixed Case", email: "MiXeD@Test.DEV", password: PASSWORD, role: "student" });

    expect(res.body.data.user.email).toBe("mixed@test.dev");
  });

  it("rejects a password under 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Short", email: "short@test.dev", password: "abc123", role: "student" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/i);
  });

  it("explains which roles are valid — the Zod 4 `error` option, not the ignored v3 `errorMap`", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Wrong Role", email: "role@test.dev", password: PASSWORD, role: "admin" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/teacher.*student/i);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    const { user } = await createStudent({ email: "login@test.dev" });
    const res = await request(app).post("/api/auth/login").send({ email: user.email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it("gives the same message for a wrong password and an unknown email, so accounts cannot be enumerated", async () => {
    const { user } = await createStudent();

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "not-the-password" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.dev", password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the signed-in user", async () => {
    const { user, token } = await createStudent({ name: "Me Myself" });
    const res = await asUser(token).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: "Me Myself", email: user.email });
  });

  it("rejects a missing token", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
  });

  it("rejects a malformed token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not.a.jwt");
    expect(res.status).toBe(401);
  });

  it("rejects a token signed for a deleted account", async () => {
    const { user, token } = await createStudent();
    await user.deleteOne();

    const res = await asUser(token).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("infrastructure", () => {
  it("reports health with database state", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.database).toBe("connected");
  });

  it("returns a JSON 404 for an unknown route", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("sets security headers", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
