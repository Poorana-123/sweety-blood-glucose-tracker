const { pool } = require("../config/db");

// Add a new glucose reading
const addReading = async (req, res) => {
    try {
        const { reading_date, time_slot, glucose_value } = req.body;

        // Validate required fields
        if (!reading_date || !time_slot || !glucose_value) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Validate glucose value
        if (glucose_value < 40 || glucose_value > 600) {
            return res.status(400).json({
                message: "Glucose value must be between 40 and 600"
            });
        }

        // Insert reading into PostgreSQL
        const result = await pool.query(
            `INSERT INTO readings
            (user_id, reading_date, time_slot, glucose_value)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                req.user.id,
                reading_date,
                time_slot,
                glucose_value
            ]
        );

        res.status(201).json({
            message: "Glucose reading added successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Add reading error:", error);

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


module.exports = { addReading, getReadings };