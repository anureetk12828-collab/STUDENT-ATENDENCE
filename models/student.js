const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },

    rollNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },

    className: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ""
    }

}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);