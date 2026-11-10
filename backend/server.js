const express = require("express");
const cors = require("cors");
require("dotenv").config();


const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const readingsRoutes = require("./routes/readingsRoutes");

const protect = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Sweety Blood Glucose Tracker API is running"
    });
});

app.get("/api/protected", protect, (req, res) => {
    res.status(200).json({
        message: "Protected route accessed successfully",
        user: req.user
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);

app.use("/api/readings", readingsRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();