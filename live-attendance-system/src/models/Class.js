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
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

classSchema.index({ teacher: 1 });

export default model("Class", classSchema);