import { beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db.js";

beforeAll(async () => {
  await connectDB();
});

/**
 * Each test starts from an empty database. Collections are emptied rather than
 * dropped so the indexes (which enforce one-active-session-per-class and
 * one-record-per-student-per-session) stay in place — dropping them would make
 * the tests pass for the wrong reason.
 */
beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await disconnectDB();
});
