import asyncHandler from "../utils/asyncHandler.js";
import * as classService from "../services/class.service.js";

export const createClass = asyncHandler(async (req, res) => {
  const created = await classService.createClass(req.body, req.user._id);
  res.status(201).json({ success: true, message: "Class created.", data: { class: created } });
});

export const getAllClasses = asyncHandler(async (req, res) => {
  const classes = await classService.listClasses(req.user, { scope: req.query.scope });
  res.status(200).json({ success: true, count: classes.length, data: { classes } });
});

export const getClassById = asyncHandler(async (req, res) => {
  const found = await classService.getClassForUser(req.params.id, req.user);
  res.status(200).json({ success: true, data: { class: found } });
});

export const updateClass = asyncHandler(async (req, res) => {
  const updated = await classService.updateClass(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: "Class updated.", data: { class: updated } });
});

export const deleteClass = asyncHandler(async (req, res) => {
  await classService.deleteClass(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: "Class deleted." });
});

export const joinClass = asyncHandler(async (req, res) => {
  const joined = await classService.enrollByJoinCode(req.body.joinCode, req.user._id);
  res.status(200).json({ success: true, message: `You joined ${joined.title}.`, data: { class: joined } });
});

export const enrollInClass = asyncHandler(async (req, res) => {
  const joined = await classService.enrollById(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: `You joined ${joined.title}.`, data: { class: joined } });
});

export const leaveClass = asyncHandler(async (req, res) => {
  await classService.unenroll(req.params.id, req.user._id);
  res.status(200).json({ success: true, message: "You left the class." });
});

export default {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  joinClass,
  enrollInClass,
  leaveClass,
};
