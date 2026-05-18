import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import ApiError from "../utils/ApiError.js";

export const signupUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email already registered.");

  const user = await User.create({ name, email, password, role });
  const token = generateToken(user._id);
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new ApiError(401, "Invalid email or password.");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password.");

  const token = generateToken(user._id);
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new ApiError(404, "User not found.");
  return user;
};
