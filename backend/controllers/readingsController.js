const { pool } = require("../config/db");
const { validateReading } = require("../utils/readingValidation");
// Add a new glucose reading


const addReading = async (req, res) => {
    try {
        const { reading_date, time_slot, glucose_value } = req.body;

        // Validate input
        const validationError = validateReading(
            reading_date,
            time_slot,
            glucose_value
        );

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        // Insert reading
        const result = await pool.query(
            `INSERT INTO readings
            (user_id, reading_date, time_slot, glucose_value)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                req.user.id,
                reading_date,
                time_slot,
                Number(glucose_value)
            ]
        );

        res.status(201).json({
            message: "Glucose reading added successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Add reading error:", error);

        // Duplicate time slot
        if (error.code === "23505") {
            return res.status(409).json({
                message: "A reading already exists for this date and time slot"
            });
        }

        res.status(500).json({
            message: "Server error while adding reading"
        });
    }
};


// Get all glucose readings for the logged-in user
const getReadings = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM readings
             WHERE user_id = $1
             ORDER BY reading_date DESC, created_at DESC`,
            [req.user.id]
        );

        res.status(200).json({
            message: "Glucose readings fetched successfully",
            total: result.rows.length,
            readings: result.rows
        });

    } catch (error) {
        console.error("Get readings error:", error);

        res.status(500).json({
            message: "Server error while fetching readings"
        });
    }
};



// Update glucose reading
const updateReading = async (req, res) => {
    try {
        const { id } = req.params;
        const { reading_date, time_slot, glucose_value } = req.body;

        // Reusable validation
        const validationError = validateReading(
            reading_date,
            time_slot,
            glucose_value
        );

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `UPDATE readings
             SET reading_date = $1,
                 time_slot = $2,
                 glucose_value = $3
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [
                reading_date,
                time_slot,
                Number(glucose_value),
                id,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found"
            });
        }

        res.status(200).json({
            message: "Glucose reading updated successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Update reading error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A reading already exists for this date and time slot"
            });
        }

        res.status(500).json({
            message: "Server error while updating reading"
        });
    }
};



// Delete glucose reading
const deleteReading = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.id]
        );

        // Check whether the reading exists
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found"
            });
        }

        res.status(200).json({
            message: "Glucose reading deleted successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Delete reading error:", error);

        res.status(500).json({
            message: "Server error while deleting reading"
        });
    }
};


// Get daily glucose report
const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                message: "Date is required. Use YYYY-MM-DD format"
            });
        }

        const result = await pool.query(
            `SELECT
                COUNT(*) AS total_readings,
                ROUND(AVG(glucose_value)::numeric, 1) AS average_glucose,
                MIN(glucose_value) AS minimum_glucose,
                MAX(glucose_value) AS maximum_glucose
             FROM readings
             WHERE user_id = $1
             AND reading_date = $2`,
            [req.user.id, date]
        );

        res.status(200).json({
            message: "Daily report fetched successfully",
            date: date,
            report: result.rows[0]
        });

    } catch (error) {
        console.error("Daily report error:", error);

        res.status(500).json({
            message: "Server error while generating daily report"
        });
    }
};


// Get Month-to-Date glucose report
const getMTDReport = async (req, res) => {
    try {
        // Get today's date
        const today = new Date();

        // First day of the current month
        const startDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

        // Format dates as YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const fromDate = formatDate(startDate);
        const toDate = formatDate(today);

        // Fetch MTD glucose statistics
        const result = await pool.query(
            `SELECT
                COUNT(*) AS total_readings,
                ROUND(AVG(glucose_value)::numeric, 1) AS average_glucose,
                MIN(glucose_value) AS minimum_glucose,
                MAX(glucose_value) AS maximum_glucose
             FROM readings
             WHERE user_id = $1
             AND reading_date BETWEEN $2 AND $3`,
            [req.user.id, fromDate, toDate]
        );

        res.status(200).json({
            message: "Month-to-Date report fetched successfully",
            period: {
                from: fromDate,
                to: toDate
            },
            report: result.rows[0]
        });

    } catch (error) {
        console.error("MTD report error:", error);

        res.status(500).json({
            message: "Server error while generating MTD report"
        });
    }
};


// Get Previous Month glucose report
const getPreviousMonthReport = async (req, res) => {
    try {
        const today = new Date();

        // First day of the previous month
        const startDate = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
        );

        // Last day of the previous month
        const endDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            0
        );

        // Format date as YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const fromDate = formatDate(startDate);
        const toDate = formatDate(endDate);

        // Get previous month statistics
        const result = await pool.query(
            `SELECT
                COUNT(*) AS total_readings,
                ROUND(AVG(glucose_value)::numeric, 1) AS average_glucose,
                MIN(glucose_value) AS minimum_glucose,
                MAX(glucose_value) AS maximum_glucose
             FROM readings
             WHERE user_id = $1
             AND reading_date BETWEEN $2 AND $3`,
            [req.user.id, fromDate, toDate]
        );

        res.status(200).json({
            message: "Previous Month report fetched successfully",
            period: {
                from: fromDate,
                to: toDate
            },
            report: result.rows[0]
        });

    } catch (error) {
        console.error("Previous Month report error:", error);

        res.status(500).json({
            message: "Server error while generating Previous Month report"
        });
    }
};


module.exports = {
    addReading,
    getReadings,
    updateReading,
    deleteReading,
    getDailyReport,
    getMTDReport,
    getPreviousMonthReport
};


