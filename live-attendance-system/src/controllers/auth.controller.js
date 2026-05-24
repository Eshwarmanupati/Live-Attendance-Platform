import { signupUser, loginUser } from "../services/auth.service.js";

const signup = async (req, res, next) => {
  try {
    const { token, user } = await signupUser(req.body);
    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { token, user } = await loginUser(req.body);
    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
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
};

export default { signup, login, getMe };
