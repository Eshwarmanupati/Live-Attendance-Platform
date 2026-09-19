import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import ApiError from "../utils/ApiError.js";

export const signupUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("That email is already registered.");

  const user = await User.create({ name, email, password, role });
  return { token: generateToken(user._id, user.role), user: user.toPublicJSON() };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  // Same message either way, so the response cannot be used to enumerate accounts.
  if (!user) throw ApiError.unauthorized("Invalid email or password.");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized("Invalid email or password.");

  return { token: generateToken(user._id, user.role), user: user.toPublicJSON() };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found.");
  return user.toPublicJSON();
};
