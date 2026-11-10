
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addReading,
    getReadings,
    updateReading,
    deleteReading,
    getDailyReport,
    getMTDReport,
    getPreviousMonthReport
} = require("../controllers/readingsController");

// Create reading
router.post("/", protect, addReading);

// Get all readings
router.get("/", protect, getReadings);

// Update reading
router.put("/:id", protect, updateReading);

// Delete reading
router.delete("/:id", protect, deleteReading);

router.get("/daily-report", protect, getDailyReport);

router.get("/mtd-report", protect, getMTDReport);

router.get("/previous-month-report", protect, getPreviousMonthReport);

module.exports = router;
