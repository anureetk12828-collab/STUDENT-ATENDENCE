const express = require("express");

const Student = require("../models/student");
const Attendance = require("../models/attendance");

const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);


// GET ALL STUDENTS
router.get("/", async (req, res) => {

    try {

        const students = await Student.find()
            .sort({ rollNumber: 1 });

        res.json(students);

    } catch (error) {

        res.status(500).json({
            message: "Could not load students."
        });

    }

});


// ADD STUDENT
router.post("/", async (req, res) => {

    try {

        const { name, rollNumber, className, email } = req.body;

        if (!name || !rollNumber || !className) {

            return res.status(400).json({
                message: "Name, roll number and class are required."
            });

        }

        const student = await Student.create({

            name,
            rollNumber,
            className,
            email: email || ""

        });

        res.status(201).json(student);

    } catch (error) {

        if (error.code === 11000) {

            return res.status(409).json({
                message: "That roll number already exists."
            });

        }

        res.status(500).json({
            message: "Could not add student."
        });

    }

});


// UPDATE STUDENT
router.patch("/:id", async (req, res) => {

    try {

        const allowed = [
            "name",
            "rollNumber",
            "className",
            "email"
        ];

        const updates = {};

        allowed.forEach((key) => {

            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }

        });

        const student = await Student.findByIdAndUpdate(

            req.params.id,

            updates,

            {
                new: true,
                runValidators: true
            }

        );

        if (!student) {

            return res.status(404).json({
                message: "Student not found."
            });

        }

        res.json(student);

    } catch (error) {

        res.status(400).json({
            message: "Could not update student."
        });

    }

});


// DELETE STUDENT
router.delete("/:id", async (req, res) => {

    try {

        const student = await Student.findByIdAndDelete(
            req.params.id
        );

        if (!student) {

            return res.status(404).json({
                message: "Student not found."
            });

        }

        await Attendance.deleteMany({
            student: student._id
        });

        res.json({
            message: "Student and attendance history deleted."
        });

    } catch (error) {

        res.status(400).json({
            message: "Could not delete student."
        });

    }

});

module.exports = router;