import Class from "../models/Class.js";
import ApiError from "../utils/ApiError.js";
import { formatZodError } from "../utils/zodError.js";
import { createClassSchema, updateClassSchema } from "../validations/class.validation.js";

/**
 * @desc    Create a new class
 * @route   POST /api/classes
 * @access  Private (teacher only)
 */
const createClass = async (req, res, next) => {
  try {
    const parsed = createClassSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, formatZodError(parsed.error));
    }

    const { title, description, students } = parsed.data;

    const newClass = await Class.create({
      title,
      description,
      teacher: req.user._id,
      students: students || [],
    });

    console.log(`📚 New class created: "${title}" by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: "Class created successfully.",
      data: { class: newClass },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all classes
 *          - Teachers: only their own classes
 *          - Students: all available classes
 * @route   GET /api/classes
 * @access  Private
 */
const getAllClasses = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "teacher" ? { teacher: req.user._id } : {};

    const classes = await Class.find(filter)
      .populate("teacher", "name email")
      .populate("students", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      data: { classes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single class by ID
 * @route   GET /api/classes/:id
 * @access  Private
 */
const getClassById = async (req, res, next) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate("teacher", "name email")
      .populate("students", "name email");

    if (!classItem) {
      throw new ApiError(404, "Class not found.");
    }

    res.status(200).json({
      success: true,
      data: { class: classItem },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a class
 * @route   PUT /api/classes/:id
 * @access  Private (teacher who owns the class)
 */
const updateClass = async (req, res, next) => {
  try {
    const parsed = updateClassSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, formatZodError(parsed.error));
    }

    // Find class and ensure the requesting teacher owns it
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      throw new ApiError(404, "Class not found.");
    }

    if (classItem.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to update this class.");
    }

    const updated = await Class.findByIdAndUpdate(
      req.params.id,
      parsed.data,
      { new: true, runValidators: true }
    )
      .populate("teacher", "name email")
      .populate("students", "name email");

    console.log(`✏️  Class updated: "${updated.title}"`);

    res.status(200).json({
      success: true,
      message: "Class updated successfully.",
      data: { class: updated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a class
 * @route   DELETE /api/classes/:id
 * @access  Private (teacher who owns the class)
 */
const deleteClass = async (req, res, next) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      throw new ApiError(404, "Class not found.");
    }

    if (classItem.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to delete this class.");
    }

    await classItem.deleteOne();

    console.log(`🗑️  Class deleted: "${classItem.title}"`);

    res.status(200).json({
      success: true,
      message: "Class deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
};
