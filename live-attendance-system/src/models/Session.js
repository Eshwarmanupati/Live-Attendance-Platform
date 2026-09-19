import { Schema, model } from "mongoose";
import { SESSION_STATUS } from "../utils/constants.js";

/**
 * A single live attendance session for one class.
 *
 * Session state used to live in a module-level variable, which meant (a) only
 * one teacher in the entire deployment could hold a session at a time, (b) all
 * state vanished on restart, and (c) it could never run on more than one
 * instance. Persisting it fixes all three: sessions are per-class, survive a
 * redeploy, and any instance can serve them.
 */
const sessionSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.ACTIVE,
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    // Snapshot written when the session ends, so history reads never recount.
    summary: {
      present: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      enrolled: { type: Number, default: 0 },
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

/**
 * At most one active session per class, enforced by the database rather than by
 * an application-level check that two concurrent requests could both pass.
 */
sessionSchema.index(
  { classId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: SESSION_STATUS.ACTIVE },
    name: "one_active_session_per_class",
  }
);

sessionSchema.index({ classId: 1, startedAt: -1 });

sessionSchema.virtual("isActive").get(function isActive() {
  return this.status === SESSION_STATUS.ACTIVE;
});

export default model("Session", sessionSchema);
