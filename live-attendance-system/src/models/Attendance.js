import { Schema, model } from "mongoose";

const attendanceSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present",
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    // Explicit timestamp for the moment attendance was marked
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/**
 * Compound unique index: one attendance record per student per class session.
 * This is the DB-level guard against duplicate attendance entries.
 */
attendanceSchema.index(
  { classId: 1, studentId: 1, sessionDate: 1 },
  { unique: true }
);

export default model("Attendance", attendanceSchema);
