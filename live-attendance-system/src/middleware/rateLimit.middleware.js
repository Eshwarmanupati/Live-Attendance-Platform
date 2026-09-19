import rateLimit from "express-rate-limit";
import config from "../config/env.js";

const shared = {
  standardHeaders: true,
  legacyHeaders: false,
  // Disabled under test so a suite that logs in repeatedly is not throttled.
  skip: () => config.isTest,
  message: { success: false, message: "Too many requests. Please try again shortly." },
};

/** Broad ceiling for the whole API. */
export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, ...shared });

/** Tight limit on credential endpoints so passwords cannot be brute-forced. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  ...shared,
  message: { success: false, message: "Too many sign-in attempts. Please try again in 15 minutes." },
});
