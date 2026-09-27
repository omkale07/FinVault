const request = require("supertest");
const pool = require("../config/db");
const app = require("../app");

const TEST_EMAIL = `jest_${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPassword123";
const TEST_NAME = "Jest Test User";

describe("Authentication API", () => {

    test("should register a new user", async () => {

        const response = await request(app)
            .post("/api/users/register")
            .send({
                name: TEST_NAME,
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });

        expect(response.statusCode).toBe(201);

        expect(response.body.success).toBe(true);

        expect(response.body.user).toHaveProperty("id");
        expect(response.body.user.email).toBe(TEST_EMAIL);

    });


    test("should reject registration with invalid email", async () => {

        const response = await request(app)
            .post("/api/users/register")
            .send({
                name: TEST_NAME,
                email: "invalid-email",
                password: TEST_PASSWORD
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Validation failed");

    });


    test("should login with valid credentials", async () => {

        const response = await request(app)
            .post("/api/users/login")
            .send({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.token).toBeDefined();

        expect(response.headers["set-cookie"])
            .toBeDefined();

    });


    test("should reject incorrect password", async () => {

        const response = await request(app)
            .post("/api/users/login")
            .send({
                email: TEST_EMAIL,
                password: "WrongPassword123"
            });

        expect(response.statusCode).toBe(401);

        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Invalid credentials");

    });


    test("should reject invalid email during login", async () => {

        const response = await request(app)
            .post("/api/users/login")
            .send({
                email: "not-an-email",
                password: TEST_PASSWORD
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Validation failed");

    });

    test("should reject profile request without token", async () => {

    const response = await request(app)
        .get("/api/users/profile");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);

    expect(response.body.message)
        .toBe("Authorization token is required");
});


test("should reject profile request with invalid token", async () => {

    const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", "Bearer invalid-token");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);

    expect(response.body.message)
        .toBe("Invalid or expired token");
});


test("should access profile with valid token", async () => {

    const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

    expect(loginResponse.statusCode).toBe(200);

    const token = loginResponse.body.token;

    const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.user).toHaveProperty("id");

    expect(response.body.user.email)
        .toBe(TEST_EMAIL);
});

test("should refresh access token using refresh cookie", async () => {

    const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

    expect(loginResponse.statusCode).toBe(200);

    const cookies = loginResponse.headers["set-cookie"];

    expect(cookies).toBeDefined();

    const refreshResponse = await request(app)
        .post("/api/users/refresh")
        .set("Cookie", cookies);

    expect(refreshResponse.statusCode).toBe(200);

    expect(refreshResponse.body.success).toBe(true);

    expect(refreshResponse.body.token).toBeDefined();
    expect(typeof refreshResponse.body.token).toBe("string");

    expect(refreshResponse.headers["set-cookie"])
        .toBeDefined();
});


test("should logout successfully using refresh cookie", async () => {

    const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

    expect(loginResponse.statusCode).toBe(200);

    const cookies = loginResponse.headers["set-cookie"];

    const logoutResponse = await request(app)
        .post("/api/users/logout")
        .set("Cookie", cookies);

    expect(logoutResponse.statusCode).toBe(200);

    expect(logoutResponse.body.success).toBe(true);
});


test("should reject refresh after logout", async () => {

    const loginResponse = await request(app)
        .post("/api/users/login")
        .send({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

    expect(loginResponse.statusCode).toBe(200);

    const cookies = loginResponse.headers["set-cookie"];

    const logoutResponse = await request(app)
        .post("/api/users/logout")
        .set("Cookie", cookies);

    expect(logoutResponse.statusCode).toBe(200);

    const refreshResponse = await request(app)
        .post("/api/users/refresh")
        .set("Cookie", cookies);

    expect(refreshResponse.statusCode).toBe(401);

    expect(refreshResponse.body.success).toBe(false);
});

    afterAll(async () => {
    await pool.end();
});

});