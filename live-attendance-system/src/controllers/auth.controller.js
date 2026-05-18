import ApiError from "../utils/ApiError.js";
import { formatZodError } from "../utils/zodError.js";
import { signupSchema, loginSchema } from "../validations/auth.validation.js";
import { signupUser, loginUser } from "../services/auth.service.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    // 1. Validate request body with Zod
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, formatZodError(parsed.error));
    }

    const { token, user } = await signupUser(parsed.data);

    console.log(`✅ New user registered: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    // 1. Validate input
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, formatZodError(parsed.error));
    }

    const { token, user } = await loginUser(parsed.data);

    console.log(`✅ User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by authMiddleware
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { signup, login, getMe };
