const Program = require("../models/programModel.js");

// CREATE Program
async function createProgram(data) {
  return await Program.create(data);
}

// GET all Programs
async function getAllPrograms() {
  return await Program.find().populate("user");
}

// GET Programs by User
async function getProgramsByUser(userId) {
  return await Program.find({ user: userId }).populate("user", "name email");
}

// GET Program by id
async function getProgramById(id) {
  return await Program.findById(id).populate("user", "name email");
}

// UPDATE Program
async function updateProgram(id, newData) {
  return await Program.findByIdAndUpdate(id, newData, { new: true });
}

// DELETE Program
async function deleteProgram(id) {
  return await Program.findByIdAndDelete(id);
}

module.exports = {
  createProgram,
  getAllPrograms,
  getProgramsByUser,
  getProgramById,
  updateProgram,
  deleteProgram,
};
