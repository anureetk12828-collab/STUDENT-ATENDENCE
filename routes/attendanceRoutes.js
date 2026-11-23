const express = require("express");

const Student = require("../models/student");
const Attendance = require("../models/attendance");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

// GET ATTENDANCE
// Daily records when date is provided.
// Full history when no date is provided.
router.get("/", async (req, res) => {
    try {
        const { date } = req.query;

        let records;

        if (date) {
            records = await Attendance.find({ date })
                .populate("student")
                .sort({ createdAt: 1 });
        } else {
            records = await Attendance.find()
                .populate("student")
                .sort({ date: 1 });
        }

        res.json(records);

    } catch (error) {
        res.status(500).json({
            message: "Could not load attendance."
        });
    }
});


// SAVE / UPDATE ATTENDANCE
router.post("/", async (req, res) => {
    try {
        const { studentId, date, status } = req.body;

        if (!studentId || !date || !status) {
            return res.status(400).json({
                message: "Student, date and status are required."
            });
        }

        if (!["Present", "Absent"].includes(status)) {
            return res.status(400).json({
                message: "Invalid attendance status."
            });
        }

        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        const record = await Attendance.findOneAndUpdate(
            {
                student: studentId,
                date: date
            },
            {
                student: studentId,
                date: date,
                status: status
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.json(record);

    } catch (error) {
        res.status(500).json({
            message: "Could not save attendance."
        });
    }
});

module.exports = router;