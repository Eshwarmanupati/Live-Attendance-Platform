import * as classService from "../services/class.service.js";

const createClass = async (req, res, next) => {
  try {
    const newClass = await classService.createClass(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: "Class created successfully.",
      data: { class: newClass },
    });
  } catch (error) {
    next(error);
  }
};

const getAllClasses = async (req, res, next) => {
  try {
    const classes = await classService.getAllClasses(req.user);
    res.status(200).json({
      success: true,
      count: classes.length,
      data: { classes },
    });
  } catch (error) {
    next(error);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const classItem = await classService.getClassById(req.params.id);
    res.status(200).json({
      success: true,
      data: { class: classItem },
    });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const updated = await classService.updateClass(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      message: "Class updated successfully.",
      data: { class: updated },
    });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    await classService.deleteClass(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: "Class deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export default { createClass, getAllClasses, getClassById, updateClass, deleteClass };
