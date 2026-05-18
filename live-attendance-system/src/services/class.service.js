import Class from "../models/Class.js";
import ApiError from "../utils/ApiError.js";

export const createClass = async ({ title, description, students }, teacherId) =>
  Class.create({ title, description, teacher: teacherId, students: students || [] });

export const getAllClasses = async (user) => {
  const filter = user.role === "teacher" ? { teacher: user._id } : {};
  return Class.find(filter)
    .populate("teacher", "name email")
    .populate("students", "name email")
    .sort({ createdAt: -1 });
};

export const getClassById = async (id) => {
  const cls = await Class.findById(id)
    .populate("teacher", "name email")
    .populate("students", "name email");
  if (!cls) throw new ApiError(404, "Class not found.");
  return cls;
};

export const updateClass = async (id, data, teacherId) => {
  const cls = await Class.findById(id);
  if (!cls) throw new ApiError(404, "Class not found.");
  if (cls.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "Not authorized to update this class.");
  }
  return Class.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate("teacher", "name email")
    .populate("students", "name email");
};

export const deleteClass = async (id, teacherId) => {
  const cls = await Class.findById(id);
  if (!cls) throw new ApiError(404, "Class not found.");
  if (cls.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "Not authorized to delete this class.");
  }
  await cls.deleteOne();
};
