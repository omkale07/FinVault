const request = require("supertest");
const app = require("../app");

const {
    connectRedis,
    redisClient
} = require("../config/redis");

const TEST_EMAIL = `wallet_jest_${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPassword123";
const TEST_NAME = "Wallet Jest User";

let token;
let walletId;

describe("Wallet API", () => {

    beforeAll(async () => {

        // Connect Redis because balance service uses Redis
        await connectRedis();

        // Create test user
        await request(app)
            .post("/api/users/register")
            .send({
                name: TEST_NAME,
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });

        // Login and get access token
        const loginResponse = await request(app)
            .post("/api/users/login")
            .send({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });

        expect(loginResponse.statusCode).toBe(200);

        token = loginResponse.body.token;
    });


    test("should create a new wallet", async () => {

        const response = await request(app)
            .post("/api/wallets")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Jest Wallet",
                currency: "INR"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);

        expect(response.body.wallet).toHaveProperty("id");
        expect(response.body.wallet.name).toBe("Jest Wallet");
        expect(response.body.wallet.currency).toBe("INR");

        walletId = response.body.wallet.id;
    });


    test("should reject wallet creation with invalid currency", async () => {

        const response = await request(app)
            .post("/api/wallets")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Invalid Wallet",
                currency: "INVALID"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation failed");
    });


    test("should reject wallet creation without name", async () => {

        const response = await request(app)
            .post("/api/wallets")
            .set("Authorization", `Bearer ${token}`)
            .send({
                currency: "INR"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message)
            .toBe("Name and Currency are required");
    });


    test("should get user's wallets", async () => {

        const response = await request(app)
            .get("/api/wallets")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(Array.isArray(response.body.wallets)).toBe(true);
        expect(response.body.wallets.length).toBeGreaterThan(0);
    });


    test("should get wallet by ID", async () => {

        const response = await request(app)
            .get(`/api/wallets/${walletId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.wallet).toHaveProperty("id");

        expect(Number(response.body.wallet.id))
            .toBe(Number(walletId));
    });


    test("should reject invalid wallet ID", async () => {

        const response = await request(app)
            .get("/api/wallets/invalid")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation failed");
    });


    test("should return wallet balance", async () => {

        const response = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.wallet).toBeDefined();
    });


    test("should update wallet", async () => {

        const response = await request(app)
            .patch(`/api/wallets/${walletId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Updated Jest Wallet",
                currency: "INR"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.wallet.name)
            .toBe("Updated Jest Wallet");

        expect(response.body.wallet.currency)
            .toBe("INR");
    });


    test("should reject wallet access without authentication", async () => {

        const response = await request(app)
            .get(`/api/wallets/${walletId}`);

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
    });


    afterAll(async () => {

        if (redisClient.isOpen) {
            await redisClient.quit();
        }

    });

});