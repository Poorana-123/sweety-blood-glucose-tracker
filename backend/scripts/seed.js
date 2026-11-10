require("dotenv").config();

const bcrypt = require("bcrypt");
const { pool } = require("../config/db");

// Sample user details
const seedUser = {
    name: "Sweety Demo",
    email: "demo@sweety.com",
    password: "Demo@123"
};

// Get local date in YYYY-MM-DD format
const getLocalDate = (date) => {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
};

// Get previous month date
const getPreviousMonthDate = (day) => {
    const date = new Date();

    date.setDate(1);
    date.setMonth(date.getMonth() - 1);
    date.setDate(day);

    return getLocalDate(date);
};

// Sample glucose readings
const getSeedReadings = () => {
    const today = getLocalDate(new Date());

    return [
        // Today's readings
        {
            reading_date: today,
            time_slot: "Morning (fasting)",
            glucose_value: 110
        },
        {
            reading_date: today,
            time_slot: "After breakfast",
            glucose_value: 125
        },
        {
            reading_date: today,
            time_slot: "After lunch",
            glucose_value: 140
        },
        {
            reading_date: today,
            time_slot: "After dinner",
            glucose_value: 120
        },

        // Previous month readings
        {
            reading_date: getPreviousMonthDate(5),
            time_slot: "Morning (fasting)",
            glucose_value: 105
        },
        {
            reading_date: getPreviousMonthDate(10),
            time_slot: "After breakfast",
            glucose_value: 130
        },
        {
            reading_date: getPreviousMonthDate(15),
            time_slot: "After lunch",
            glucose_value: 145
        },
        {
            reading_date: getPreviousMonthDate(20),
            time_slot: "After dinner",
            glucose_value: 115
        }
    ];
};

// Seed database
const seedDatabase = async () => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        console.log("Starting database seeding...");

        // Hash password
        const hashedPassword = await bcrypt.hash(
            seedUser.password,
            10
        );

        // Create or update demo user
        const userResult = await client.query(
            `
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            ON CONFLICT (email)
            DO UPDATE SET
                name = EXCLUDED.name
            RETURNING id
            `,
            [
                seedUser.name,
                seedUser.email,
                hashedPassword
            ]
        );

        const userId = userResult.rows[0].id;

        console.log("Demo user created or already exists.");

        // Insert sample readings
        const readings = getSeedReadings();

        let insertedCount = 0;

        for (const reading of readings) {
            await client.query(
                `
                INSERT INTO readings (
                    user_id,
                    reading_date,
                    time_slot,
                    glucose_value
                )
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id, reading_date, time_slot)
                DO UPDATE SET
                    glucose_value = EXCLUDED.glucose_value
                `,
                [
                    userId,
                    reading.reading_date,
                    reading.time_slot,
                    reading.glucose_value
                ]
            );

            insertedCount++;
        }

        await client.query("COMMIT");

        console.log("Sample readings seeded successfully!");
        console.log(`User ID: ${userId}`);
        console.log(`Total sample readings: ${insertedCount}`);

        console.log("\nDemo Login Details:");
        console.log(`Email: ${seedUser.email}`);
        console.log(`Password: ${seedUser.password}`);

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Database seeding failed:", error.message);

    } finally {
        client.release();
        await pool.end();
    }
};

// Execute seed script
seedDatabase();