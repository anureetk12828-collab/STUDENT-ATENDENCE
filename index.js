require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/authRoutes");

const studentRoutes = require("./routes/studentRoutes");

const attendanceRoutes = require("./routes/attendanceRoutes");

const app = express();

const PORT = process.env.PORT || 3000;


// MIDDLEWARE
app.use(express.json());


// FRONTEND
app.use(express.static(path.join(__dirname, "public")));


// API ROUTES
app.use("/api/auth", authRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/attendance", attendanceRoutes);


// DATABASE CONNECTION
async function startServer() {

    try {

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB.");

        app.listen(PORT, () => {

            console.log(
                `Server running at http://localhost:${PORT}`
            );

        });

    } catch (error) {

        console.error(
            "Startup failed. Check MONGODB_URI and database access."
        );

        console.error(error.message);

        process.exit(1);

    }

}

startServer();