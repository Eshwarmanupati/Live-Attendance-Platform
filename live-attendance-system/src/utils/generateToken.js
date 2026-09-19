import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const generateToken = (userId, role) =>
  jwt.sign({ id: String(userId), role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

export const verifyToken = (token) => jwt.verify(token, config.JWT_SECRET);

export default generateToken;
