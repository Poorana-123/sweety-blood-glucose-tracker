const request = require("supertest");
const app = require("../app");
const { pool } = require("../config/db");

describe("Glucose Report API", () => {
    let token;

    // Test user credentials should be stored in backend/.env
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    // Login before running tests
    beforeAll(async () => {
        if (!testEmail || !testPassword) {
            throw new Error(
                "Please add TEST_USER_EMAIL and TEST_USER_PASSWORD to your .env file"
            );
        }

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testEmail,
                password: testPassword
            });

        expect(response.statusCode).toBe(200);

        token =
            response.body.token ||
            response.body.accessToken;
        
        expect(token).toBeDefined();
    });

    afterAll(async () => {
        await pool.end();
    });

    // -----------------------------------
    // DAILY REPORT TESTS
    // -----------------------------------

    describe("Daily Report", () => {

        test("should reject daily report without date", async () => {
            const response = await request(app)
                .get("/api/readings/daily-report")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(400);

            expect(response.body.message).toBe(
                "Date is required. Use YYYY-MM-DD format"
            );
        });

        test("should return daily report for valid date", async () => {
            const today = new Date();

            const date = `${today.getFullYear()}-${String(
                today.getMonth() + 1
            ).padStart(2, "0")}-${String(
                today.getDate()
            ).padStart(2, "0")}`;

            const response = await request(app)
                .get(`/api/readings/daily-report?date=${date}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);

            expect(response.body.message).toBe(
                "Daily report fetched successfully"
            );

            expect(response.body.date).toBe(date);

            expect(response.body.report).toHaveProperty(
                "total_readings"
            );

            expect(response.body.report).toHaveProperty(
                "average_glucose"
            );

            expect(response.body.report).toHaveProperty(
                "minimum_glucose"
            );

            expect(response.body.report).toHaveProperty(
                "maximum_glucose"
            );
        });

        test("should return empty report when no readings exist", async () => {
            // Choose a date far in the past
            const emptyDate = "2000-01-01";

            const response = await request(app)
                .get(
                    `/api/readings/daily-report?date=${emptyDate}`
                )
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);

            expect(
                Number(response.body.report.total_readings)
            ).toBe(0);

            expect(response.body.report.average_glucose).toBeNull();

            expect(response.body.report.minimum_glucose).toBeNull();

            expect(response.body.report.maximum_glucose).toBeNull();
        });

    });

    // -----------------------------------
    // MTD REPORT TESTS
    // -----------------------------------

    describe("MTD Report", () => {

        test("should return month-to-date report", async () => {
            const response = await request(app)
                .get("/api/readings/mtd-report")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);

            expect(response.body.message).toBe(
                "Month-to-Date report fetched successfully"
            );

            expect(response.body.period).toHaveProperty("from");

            expect(response.body.period).toHaveProperty("to");

            expect(response.body.report).toHaveProperty(
                "total_readings"
            );

            expect(response.body.report).toHaveProperty(
                "average_glucose"
            );

            expect(response.body.report).toHaveProperty(
                "minimum_glucose"
            );

            expect(response.body.report).toHaveProperty(
                "maximum_glucose"
            );
        });

        test("should use the first day of the current month as start date", async () => {
            const response = await request(app)
                .get("/api/readings/mtd-report")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);

            const today = new Date();

            const expectedStartDate = `${today.getFullYear()}-${String(
                today.getMonth() + 1
            ).padStart(2, "0")}-01`;

            expect(response.body.period.from).toBe(
                expectedStartDate
            );
        });

    });

    // -----------------------------------
    // PREVIOUS MONTH REPORT TESTS
    // -----------------------------------

    describe("Previous Month Report", () => {

        test("should return previous month report", async () => {
            const response = await request(app)
                .get("/api/readings/previous-month-report")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);

            expect(response.body.message).toBe(
                "Previous Month report fetched successfully"
            );

            expect(response.body.period).toHaveProperty("from");

            expect(response.body.period).toHaveProperty("to");

            expect(response.body.report).toHaveProperty(
                "total_readings"
            );

            expect(response.body.report).toHaveProperty(
                "average_glucose"
            );

            expect(response.body.report).toHaveProperty(
                "minimum_glucose"
            );

            expect(response.body.report).toHaveProperty(
                "maximum_glucose"
            );
        });

        test("should return correct previous month date range", async () => {
            const response = await request(app)
                .get("/api/readings/previous-month-report")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);

            const today = new Date();

            const previousMonthStart = new Date(
                today.getFullYear(),
                today.getMonth() - 1,
                1
            );

            const previousMonthEnd = new Date(
                today.getFullYear(),
                today.getMonth(),
                0
            );

            const formatDate = (date) => {
                return `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}-${String(
                    date.getDate()
                ).padStart(2, "0")}`;
            };

            expect(response.body.period.from).toBe(
                formatDate(previousMonthStart)
            );

            expect(response.body.period.to).toBe(
                formatDate(previousMonthEnd)
            );
        });

    });

    // -----------------------------------
    // AUTHENTICATION TEST
    // -----------------------------------

    describe("Report Authentication", () => {

        test("should reject report request without authentication", async () => {
            const response = await request(app)
                .get("/api/readings/mtd-report");

            expect(response.statusCode).toBe(401);
        });

    });

});
