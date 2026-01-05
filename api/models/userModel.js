const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
        unique: true,
    },

    firstName: {
        type: String,
        required: true,
    },

    lastName: {
        type: String,
        required: true,
    },

    gender: {
        type: String,
        enum: ["male", "female"],
        required: true,
    },


    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
    },

    age: {
        type: Number,
        required: true,
    },

    role: {
        type: String,
        enum: ["admin", "customer","supervisor"],
        default: "customer",
    },
  
    photo: {
        type: String,
        required: false,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    
});

module.exports = mongoose.model("User", userSchema);
