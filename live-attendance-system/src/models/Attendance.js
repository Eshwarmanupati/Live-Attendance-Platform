import { Schema, model } from "mongoose";
import { ATTENDANCE_STATUS } from "../utils/constants.js";

/**
 * One record per student per session.
 *
 * The old unique index used an exact `sessionDate` timestamp, which made the
 * "one record per session" guarantee depend on two writes happening to carry a
 * byte-identical Date. Keying on the session document makes it exact.
 */
const attendanceSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT,
    },
    markedAt: { type: Date, default: Date.now },
    // Minutes after the session started, kept for the "late" badge and reporting.
    minutesAfterStart: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true, name: "one_record_per_student_per_session" });
attendanceSchema.index({ studentId: 1, classId: 1 });

export default model("Attendance", attendanceSchema);
