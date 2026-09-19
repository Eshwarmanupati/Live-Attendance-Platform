import { Schema, model } from "mongoose";
import { generateJoinCode } from "../utils/joinCode.js";

const classSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Class title is required"],
      trim: true,
      maxlength: [120, "Title must be 120 characters or fewer"],
    },
    description: { type: String, trim: true, default: "", maxlength: 500 },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // Students join with this code instead of browsing every class in the database.
    joinCode: { type: String, unique: true, uppercase: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

classSchema.virtual("studentCount").get(function studentCount() {
  return this.students?.length ?? 0;
});

/**
 * Join codes are short, so a collision is possible. Retry a few times rather
 * than surfacing a duplicate-key error for something the user did not control.
 */
classSchema.pre("validate", async function assignJoinCode() {
  if (this.joinCode) return;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateJoinCode();
    // eslint-disable-next-line no-await-in-loop
    const taken = await this.constructor.exists({ joinCode: candidate });
    if (!taken) {
      this.joinCode = candidate;
      return;
    }
  }
  throw new Error("Could not allocate a unique join code. Please try again.");
});

classSchema.methods.isTaughtBy = function isTaughtBy(userId) {
  return String(this.teacher?._id ?? this.teacher) === String(userId);
};

classSchema.methods.hasStudent = function hasStudent(userId) {
  return this.students.some((s) => String(s?._id ?? s) === String(userId));
};

export default model("Class", classSchema);
