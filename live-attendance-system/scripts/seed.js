/**
 * Seeds demo data so a reviewer can sign in and see a populated app without
 * creating anything first.
 *
 *   npm run seed          # add/refresh demo accounts and their data
 *   npm run seed -- --fresh   # delete demo data first, then reseed
 *
 * Only documents belonging to the demo accounts are touched; real accounts in
 * the same database are left alone.
 */
import config from "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import User from "../src/models/User.js";
import Class from "../src/models/Class.js";
import Session from "../src/models/Session.js";
import Attendance from "../src/models/Attendance.js";
import { ROLES, ATTENDANCE_STATUS, SESSION_STATUS } from "../src/utils/constants.js";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demopass123";

const DEMO_TEACHER = { name: "Dr. Priya Rao", email: "teacher@demo.dev", role: ROLES.TEACHER };
const DEMO_STUDENT = { name: "Alex Chen", email: "student@demo.dev", role: ROLES.STUDENT };
const EXTRA_STUDENTS = [
  { name: "Maya Iyer", email: "maya@demo.dev" },
  { name: "Tom Becker", email: "tom@demo.dev" },
  { name: "Sara Khan", email: "sara@demo.dev" },
  { name: "Liam Osei", email: "liam@demo.dev" },
];

const CLASSES = [
  { title: "Distributed Systems", description: "Consensus, replication and fault tolerance.", joinCode: "DSYS01" },
  { title: "Applied Machine Learning", description: "From linear models to transformers.", joinCode: "MLRN02" },
  { title: "Database Internals", description: "Storage engines, indexing and query planning.", joinCode: "DBIN03" },
];

const upsertUser = async (spec) => {
  const existing = await User.findOne({ email: spec.email });
  if (existing) {
    existing.name = spec.name;
    existing.password = DEMO_PASSWORD; // re-hashed by the pre-save hook
    existing.isDemo = true;
    await existing.save();
    return existing;
  }
  return User.create({ ...spec, password: DEMO_PASSWORD, isDemo: true });
};

const run = async () => {
  const fresh = process.argv.includes("--fresh");

  await connectDB();
  console.log(`Seeding ${config.NODE_ENV} database…`);

  const demoEmails = [DEMO_TEACHER.email, DEMO_STUDENT.email, ...EXTRA_STUDENTS.map((s) => s.email)];

  if (fresh) {
    const existingDemo = await User.find({ email: { $in: demoEmails } }).select("_id").lean();
    const ids = existingDemo.map((u) => u._id);
    const demoClasses = await Class.find({ teacher: { $in: ids } }).select("_id").lean();
    const classIds = demoClasses.map((c) => c._id);

    await Promise.all([
      Attendance.deleteMany({ classId: { $in: classIds } }),
      Session.deleteMany({ classId: { $in: classIds } }),
      Class.deleteMany({ _id: { $in: classIds } }),
    ]);
    console.log(`  cleared ${classIds.length} demo class(es) and their records`);
  }

  const teacher = await upsertUser(DEMO_TEACHER);
  const primaryStudent = await upsertUser(DEMO_STUDENT);
  const others = await Promise.all(
    EXTRA_STUDENTS.map((s) => upsertUser({ ...s, role: ROLES.STUDENT }))
  );
  const students = [primaryStudent, ...others];
  console.log(`  ${students.length + 1} demo account(s) ready`);

  const classes = [];
  for (const spec of CLASSES) {
    // eslint-disable-next-line no-await-in-loop
    let cls = await Class.findOne({ joinCode: spec.joinCode });
    if (!cls) {
      // eslint-disable-next-line no-await-in-loop
      cls = await Class.create({ ...spec, teacher: teacher._id, students: students.map((s) => s._id) });
    } else {
      cls.title = spec.title;
      cls.description = spec.description;
      cls.teacher = teacher._id;
      cls.students = students.map((s) => s._id);
      // eslint-disable-next-line no-await-in-loop
      await cls.save();
    }
    classes.push(cls);
  }
  console.log(`  ${classes.length} class(es) ready`);

  // Past sessions, so the history and stats views have something real to show.
  let sessionCount = 0;
  let recordCount = 0;

  for (const [index, cls] of classes.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const alreadySeeded = await Session.countDocuments({ classId: cls._id });
    if (alreadySeeded > 0) continue;

    for (let week = 4; week >= 1; week -= 1) {
      const startedAt = new Date(Date.now() - (week * 7 + index) * 24 * 60 * 60 * 1000);
      // eslint-disable-next-line no-await-in-loop
      const session = await Session.create({
        classId: cls._id,
        teacher: teacher._id,
        status: SESSION_STATUS.ENDED,
        startedAt,
        endedAt: new Date(startedAt.getTime() + 55 * 60 * 1000),
      });

      const rows = students.map((student, i) => {
        // A deterministic pattern, so the seeded numbers look plausible and
        // stay the same between runs.
        const roll = (week * 7 + i * 3 + index) % 10;
        const status =
          roll === 0
            ? ATTENDANCE_STATUS.ABSENT
            : roll === 1
              ? ATTENDANCE_STATUS.LATE
              : ATTENDANCE_STATUS.PRESENT;
        const minutesAfterStart = status === ATTENDANCE_STATUS.LATE ? 14 : roll;
        return {
          sessionId: session._id,
          classId: cls._id,
          studentId: student._id,
          status,
          markedAt: new Date(startedAt.getTime() + minutesAfterStart * 60 * 1000),
          minutesAfterStart: status === ATTENDANCE_STATUS.ABSENT ? 0 : minutesAfterStart,
        };
      });

      // eslint-disable-next-line no-await-in-loop
      await Attendance.insertMany(rows);

      const present = rows.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length;
      const late = rows.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length;
      session.summary = { present, late, absent: rows.length - present - late, enrolled: students.length };
      // eslint-disable-next-line no-await-in-loop
      await session.save();

      sessionCount += 1;
      recordCount += rows.length;
    }
  }

  console.log(`  ${sessionCount} historical session(s), ${recordCount} attendance record(s)`);

  console.log("\nDemo credentials");
  console.log(`  teacher  ${DEMO_TEACHER.email} / ${DEMO_PASSWORD}`);
  console.log(`  student  ${DEMO_STUDENT.email} / ${DEMO_PASSWORD}`);
  console.log(`  join codes: ${CLASSES.map((c) => c.joinCode).join(", ")}`);

  await disconnectDB();
};

run().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
