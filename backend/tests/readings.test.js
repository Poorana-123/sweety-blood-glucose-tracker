
const request = require("supertest");
const app = require("../app");
const { pool } = require("../config/db");

describe("Glucose Reading API", () => {
    let token;

    beforeAll(async () => {
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email: "calmpoorana@gmail.com",
                password: "Poorana@123"
            });

        expect(loginResponse.statusCode).toBe(200);

        token = loginResponse.body.token;
    });

    test("should reject glucose value greater than 600", async () => {
        const response = await request(app)
            .post("/api/readings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                reading_date: "2026-11-10",
                time_slot: "Morning (fasting)",
                glucose_value: 700
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.message).toBe(
    "Glucose value must be an integer between 40 and 600"
);
    });
});
afterAll(async () => {
    await pool.end();
});
