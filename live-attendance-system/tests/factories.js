import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Class from "../src/models/Class.js";
import { generateToken } from "../src/utils/generateToken.js";
import { ROLES } from "../src/utils/constants.js";

let counter = 0;
const uniqueEmail = (prefix) => `${prefix}-${(counter += 1)}-${Date.now()}@test.dev`;

export const PASSWORD = "password123";

export const createUser = async ({ role = ROLES.STUDENT, name, email, password = PASSWORD } = {}) => {
  const user = await User.create({
    name: name ?? (role === ROLES.TEACHER ? "Test Teacher" : "Test Student"),
    email: email ?? uniqueEmail(role),
    password,
    role,
  });
  return { user, token: generateToken(user._id, user.role), password };
};

export const createTeacher = (overrides = {}) => createUser({ ...overrides, role: ROLES.TEACHER });
export const createStudent = (overrides = {}) => createUser({ ...overrides, role: ROLES.STUDENT });

export const createClassFor = async (teacher, { title = "Test Class", students = [] } = {}) =>
  Class.create({
    title,
    description: "A class used by the test suite",
    teacher: teacher._id,
    students: students.map((s) => s._id),
  });

/** A supertest agent with the Authorization header already attached. */
export const asUser = (token) => ({
  get: (url) => request(app).get(url).set("Authorization", `Bearer ${token}`),
  post: (url) => request(app).post(url).set("Authorization", `Bearer ${token}`),
  put: (url) => request(app).put(url).set("Authorization", `Bearer ${token}`),
  delete: (url) => request(app).delete(url).set("Authorization", `Bearer ${token}`),
});

export { app, request };
