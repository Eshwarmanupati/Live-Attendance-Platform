import asyncHandler from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";

export const signup = asyncHandler(async (req, res) => {
  const { token, user } = await authService.signupUser(req.body);
  res.status(201).json({ success: true, message: "Account created.", data: { token, user } });
});

export const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.loginUser(req.body);
  res.status(200).json({ success: true, message: "Signed in.", data: { token, user } });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toPublicJSON() } });
});

export default { signup, login, getMe };
