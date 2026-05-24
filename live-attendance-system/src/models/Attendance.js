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
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One record per student per class per session
attendanceSchema.index(
  { classId: 1, studentId: 1, sessionDate: 1 },
  { unique: true }
);

export default model("Attendance", attendanceSchema);
