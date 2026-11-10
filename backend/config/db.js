const { Pool, types } = require("pg");
require("dotenv").config();

// PostgreSQL DATE type (OID 1082)
// Keep date as YYYY-MM-DD string to avoid timezone conversion
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const connectDB = async () => {
    try {
        const result = await pool.query("SELECT NOW()");

        console.log("PostgreSQL connected successfully");
        console.log("Database time:", result.rows[0].now);

    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = {
    pool,
    connectDB,
};