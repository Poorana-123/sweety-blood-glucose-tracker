
const request = require("supertest");
const app = require("../app");
const { pool } = require("../config/db");

describe("Glucose Reading API", () => {
    let token;

    // Generate a unique past date for each test run
    const getUniquePastDate = (daysAgo = 10) => {
        const date = new Date();

        date.setDate(
            date.getDate() - daysAgo - Math.floor(Math.random() * 1000)
        );

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const createReading = async (reading) => {
        return await request(app)
            .post("/api/readings")
            .set("Authorization", `Bearer ${token}`)
            .send(reading);
    };

    beforeAll(async () => {
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email: process.env.TEST_USER_EMAIL,
                password: process.env.TEST_USER_PASSWORD,
            });

        expect(loginResponse.statusCode).toBe(200);

        token = loginResponse.body.token;

        expect(token).toBeDefined();
    });

    // ---------------------------------------
    // AUTHENTICATION TESTS
    // ---------------------------------------

    test("should reject request without authentication", async () => {
        const response = await request(app)
            .post("/api/readings")
            .send({
                reading_date: getUniquePastDate(),
                time_slot: "Morning (fasting)",
                glucose_value: 100,
            });

        expect(response.statusCode).toBe(401);
    });

    // ---------------------------------------
    // GLUCOSE VALUE VALIDATION
    // ---------------------------------------

    test("should reject glucose value greater than 600", async () => {
        const response = await createReading({
            reading_date: getUniquePastDate(),
            time_slot: "Morning (fasting)",
            glucose_value: 700,
        });

        expect(response.statusCode).toBe(400);

        expect(response.body.message).toBe(
            "Glucose value must be an integer between 40 and 600"
        );
    });

    test("should reject glucose value less than 40", async () => {
        const response = await createReading({
            reading_date: getUniquePastDate(),
            time_slot: "Morning (fasting)",
            glucose_value: 20,
        });

        expect(response.statusCode).toBe(400);
    });

    test("should reject decimal glucose values", async () => {
        const response = await createReading({
            reading_date: getUniquePastDate(),
            time_slot: "Morning (fasting)",
            glucose_value: 100.5,
        });

        expect(response.statusCode).toBe(400);
    });

    test("should reject missing glucose value", async () => {
        const response = await createReading({
            reading_date: getUniquePastDate(),
            time_slot: "Morning (fasting)",
        });

        expect(response.statusCode).toBe(400);
    });

    test("should accept minimum glucose value 40", async () => {
        const response = await createReading({
            reading_date: getUniquePastDate(12),
            time_slot: "Morning (fasting)",
            glucose_value: 40,
        });

        expect(response.statusCode).toBe(201);
    });

    test("should accept maximum glucose value 600", async () => {
        const response = await createReading({
            reading_date: getUniquePastDate(13),
            time_slot: "Morning (fasting)",
            glucose_value: 600,
        });

        expect(response.statusCode).toBe(201);
    });

    // ---------------------------------------
    // DATE VALIDATION
    // ---------------------------------------

    test("should reject future reading date", async () => {
        const futureDate = new Date();

        futureDate.setDate(futureDate.getDate() + 1);

        const year = futureDate.getFullYear();
        const month = String(futureDate.getMonth() + 1).padStart(2, "0");
        const day = String(futureDate.getDate()).padStart(2, "0");

        const response = await createReading({
            reading_date: `${year}-${month}-${day}`,
            time_slot: "Morning (fasting)",
            glucose_value: 100,
        });

        expect(response.statusCode).toBe(400);
    });

    test("should reject missing reading date", async () => {
        const response = await createReading({
            time_slot: "Morning (fasting)",
            glucose_value: 100,
        });

        expect(response.statusCode).toBe(400);
    });

    test("should reject invalid calendar date", async () => {
        const response = await createReading({
            reading_date: "2026-02-30",
            time_slot: "Morning (fasting)",
            glucose_value: 100,
        });

        expect(response.statusCode).toBe(400);
    });

    // ---------------------------------------
    // TIME SLOT VALIDATION
    // ---------------------------------------

    test("should reject invalid time slot", async () => {
        const response = await createReading({
            reading_date: getUniquePastDate(14),
            time_slot: "Afternoon",
            glucose_value: 100,
        });

        expect(response.statusCode).toBe(400);
    });

    // ---------------------------------------
    // DUPLICATE READING VALIDATION
    // ---------------------------------------

    test("should reject duplicate reading for same date and time slot", async () => {
        const reading = {
            reading_date: getUniquePastDate(15),
            time_slot: "Morning (fasting)",
            glucose_value: 100,
        };

        const firstResponse = await createReading(reading);

        expect(firstResponse.statusCode).toBe(201);

        const secondResponse = await createReading({
            ...reading,
            glucose_value: 120,
        });

        expect(secondResponse.statusCode).toBe(409);

        expect(secondResponse.body.message).toBe(
            "A reading already exists for this date and time slot"
        );
    });

    // ---------------------------------------
    // GET READINGS
    // ---------------------------------------

    test("should retrieve readings for authenticated user", async () => {
        const response = await request(app)
            .get("/api/readings")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        // Accept either an array or an object containing readings
        const readings = Array.isArray(response.body)
            ? response.body
            : response.body.readings;

        expect(Array.isArray(readings)).toBe(true);
    });
});

afterAll(async () => {
    await pool.end();
});
