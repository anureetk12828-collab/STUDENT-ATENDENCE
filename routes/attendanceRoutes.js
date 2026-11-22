const express = require("express");

const Attendance = require("../models/attendance");
const Student = require("../models/student");

const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);


// DATE VALIDATION
function validDate(value) {

    return typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value);

}


// GET ATTENDANCE BY DATE
router.get("/", async (req, res) => {

    try {

        const { date } = req.query;

        if (!validDate(date)) {

            return res.status(400).json({
                message: "Provide date as YYYY-MM-DD."
            });

        }

        const records = await Attendance.find({ date })

            .populate(
                "student",
                "name rollNumber className"
            )

            .sort({ "student.rollNumber": 1 });

        res.json(records);

    } catch (error) {

        res.status(500).json({
            message: "Could not load attendance."
        });

    }

});


// MARK ATTENDANCE
router.post("/", async (req, res) => {

    try {

        const { studentId, date, status } = req.body;

        if (
            !studentId ||
            !validDate(date) ||
            !["Present", "Absent"].includes(status)
        ) {

            return res.status(400).json({
                message: "Student, valid date and status are required."
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
                $set: {
                    status: status,
                    markedBy: req.userId
                }
            },

            {
                new: true,
                upsert: true,
                runValidators: true
            }

        ).populate(
            "student",
            "name rollNumber className"
        );

        res.json(record);

    } catch (error) {

        res.status(400).json({
            message: "Could not save attendance."
        });

    }

});

module.exports = router;