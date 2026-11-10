
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addReading,
    getReadings,
    updateReading,
    deleteReading
} = require("../controllers/readingsController");

// Create reading
router.post("/", protect, addReading);

// Get all readings
router.get("/", protect, getReadings);

// Update reading
router.put("/:id", protect, updateReading);

// Delete reading
router.delete("/:id", protect, deleteReading);

module.exports = router;
