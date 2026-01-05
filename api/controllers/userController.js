const User = require("../models/userModel.js");

// create User
async function createUser(data) {
    return await User.create(data);
}

// get all Users
async function getAllUsers() {
    return await User.find();
}

// get User by id
async function getUserById(id) {
    return await User.findById(id);
}

// get User by email
async function getUserByEmail(email) {
    return await User.findOne({ email });
}

// update User
async function updateUser(id, newData) {
    return await User.findByIdAndUpdate(id, newData, { new: true });
}

// delete User
async function deleteUser(id) {
    return await User.findByIdAndDelete(id);
}

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    getUserByEmail,
    updateUser,
    deleteUser,
};
