import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["teacher", "student"],
      required: [true, "Role is required"],
    },
  },
  { timestamps: true }
);

/**
 * Hash the password before saving.
 * Only runs if the password field was modified (prevents re-hashing on other updates).
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

/**
 * Instance method to compare a plain-text password with the stored hash.
 * Used during login.
 *
 * @param {string} candidatePassword - Plain-text password from request
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default model("User", userSchema);
