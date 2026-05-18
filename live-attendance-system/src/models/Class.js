import { Schema, model } from "mongoose";

const classSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Class title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Reference to the teacher who owns this class
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Students enrolled in this class
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Index teacher for fast "my classes" queries
classSchema.index({ teacher: 1 });

export default model("Class", classSchema);