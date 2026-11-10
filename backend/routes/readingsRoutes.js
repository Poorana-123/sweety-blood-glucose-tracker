
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addReading,
    getReadings
} = require("../controllers/readingsController");

router.post("/", protect, addReading);

router.get("/", protect, getReadings);

module.exports = router;
