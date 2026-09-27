const request = require("supertest");
const app = require("../app");

const {
    connectRedis,
    redisClient
} = require("../config/redis");

const TEST_EMAIL = `transaction_jest_${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPassword123";
const TEST_NAME = "Transaction Jest User";

let token;

let walletId;
let secondWalletId;

let depositTransactionId;
let withdrawalTransactionId;
let pendingTransactionId;

describe("Transaction API", () => {

    beforeAll(async () => {

        await connectRedis();

        // Create test user
        const registerResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: TEST_NAME,
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });

        expect(registerResponse.statusCode).toBe(201);

        // Login
        const loginResponse = await request(app)
            .post("/api/users/login")
            .send({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });

        expect(loginResponse.statusCode).toBe(200);

        token = loginResponse.body.token;

        // Create first wallet
        const walletResponse = await request(app)
            .post("/api/wallets")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Transaction Wallet",
                currency: "INR"
            });

        expect(walletResponse.statusCode).toBe(201);

        walletId = walletResponse.body.wallet.id;

        // Create second wallet for transfer tests
        const secondWalletResponse = await request(app)
            .post("/api/wallets")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Destination Wallet",
                currency: "INR"
            });

        expect(secondWalletResponse.statusCode).toBe(201);

        secondWalletId = secondWalletResponse.body.wallet.id;
    });


    // =========================================================
    // CREATE TRANSACTION
    // =========================================================

    test("should create a deposit transaction", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "1000",
                currency: "INR"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);

        expect(response.body.transaction)
            .toHaveProperty("id");

        expect(response.body.transaction.type)
            .toBe("DEPOSIT");

        expect(Number(response.body.transaction.amount))
            .toBe(1000);

        expect(response.body.transaction.currency)
            .toBe("INR");

        expect(response.body.transaction.status)
            .toBe("PENDING");

        depositTransactionId =
            response.body.transaction.id;
    });


    test("should reject transaction with invalid type", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "INVALID",
                amount: "100",
                currency: "INR"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation failed");
    });


    test("should reject transaction with invalid amount", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "-100",
                currency: "INR"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation failed");
    });


    test("should reject transaction with invalid currency", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "100",
                currency: "INVALID"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation failed");
    });


    test("should reject transaction when currency does not match wallet", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "100",
                currency: "USD"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Transaction currency must match wallet currency");
    });


    // =========================================================
    // GET TRANSACTIONS
    // =========================================================

    test("should get wallet transactions", async () => {

        const response = await request(app)
            .get(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(Array.isArray(response.body.transactions))
            .toBe(true);

        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(10);
    });


    test("should get transaction by ID", async () => {

        const response = await request(app)
            .get(
                `/api/wallets/${walletId}/transaction/${depositTransactionId}`
            )
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(Number(response.body.transaction.id))
            .toBe(Number(depositTransactionId));
    });


    test("should reject invalid transaction ID", async () => {

        const response = await request(app)
            .get(`/api/wallets/${walletId}/transaction/invalid`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation failed");
    });


    test("should get user transaction history", async () => {

        const response = await request(app)
            .get("/api/transactions")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(Array.isArray(response.body.transactions))
            .toBe(true);

        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(10);
    });


    test("should filter transaction history by type", async () => {

        const response = await request(app)
            .get("/api/transactions")
            .query({
                type: "DEPOSIT"
            })
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.type === undefined).toBe(true);

        for (const transaction of response.body.transactions) {
            expect(transaction.type).toBe("DEPOSIT");
        }
    });


    test("should reject invalid transaction history type", async () => {

        const response = await request(app)
            .get("/api/transactions")
            .query({
                type: "INVALID"
            })
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message)
            .toBe("Invalid transaction type");
    });


    test("should reject invalid transaction history status", async () => {

        const response = await request(app)
            .get("/api/transactions")
            .query({
                status: "INVALID"
            })
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message)
            .toBe("Invalid transaction status");
    });


    test("should reject invalid transaction sort field", async () => {

        const response = await request(app)
            .get("/api/transactions")
            .query({
                sort: "password"
            })
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message)
            .toBe("Invalid sort field");
    });


    test("should reject invalid transaction sort order", async () => {

        const response = await request(app)
            .get("/api/transactions")
            .query({
                order: "random"
            })
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message)
            .toBe("Invalid sort order");
    });


    // =========================================================
    // PROCESS DEPOSIT
    // =========================================================

    test("should reject processing without idempotency key", async () => {

        const response = await request(app)
            .post(
                `/api/transactions/${depositTransactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Idempotency-Key header is required");
    });


    test("should process deposit transaction successfully", async () => {

        const response = await request(app)
            .post(
                `/api/transactions/${depositTransactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", `deposit-${Date.now()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.ledgerEntry)
            .toBeDefined();

        expect(response.body.ledgerEntry.entry_type)
            .toBe("CREDIT");
    });


    test("should reject processing the same transaction again", async () => {

        const response = await request(app)
            .post(
                `/api/transactions/${depositTransactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", `second-${Date.now()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Transaction has already been processed");
    });


    // =========================================================
    // WITHDRAWAL
    // =========================================================

    test("should create a withdrawal transaction", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "WITHDRAW",
                amount: "200",
                currency: "INR"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);

        withdrawalTransactionId =
            response.body.transaction.id;
    });


    test("should process withdrawal successfully", async () => {

        const response = await request(app)
            .post(
                `/api/transactions/${withdrawalTransactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set(
                "Idempotency-Key",
                `withdraw-${Date.now()}`
            );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.ledgerEntry.entry_type)
            .toBe("DEBIT");
    });


    test("should fail withdrawal when balance is insufficient", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "WITHDRAW",
                amount: "999999",
                currency: "INR"
            });

        expect(response.statusCode).toBe(201);

        const transactionId =
            response.body.transaction.id;

        const processResponse = await request(app)
            .post(
                `/api/transactions/${transactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set(
                "Idempotency-Key",
                `insufficient-${Date.now()}`
            );

        expect(processResponse.statusCode).toBe(400);
        expect(processResponse.body.success).toBe(false);

        expect(processResponse.body.message)
            .toBe("Insufficient wallet balance");
    });


    // =========================================================
    // CANCEL TRANSACTION
    // =========================================================

    test("should create a pending transaction for cancellation", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "500",
                currency: "INR"
            });

        expect(response.statusCode).toBe(201);

        pendingTransactionId =
            response.body.transaction.id;

        expect(response.body.transaction.status)
            .toBe("PENDING");
    });


    test("should cancel pending transaction", async () => {

        const response = await request(app)
            .post(
                `/api/wallets/${walletId}/transactions/${pendingTransactionId}/cancel`
            )
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.transaction.status)
            .toBe("CANCELLED");
    });


    test("should reject cancelling an already processed transaction", async () => {

        const response = await request(app)
            .post(
                `/api/wallets/${walletId}/transactions/${depositTransactionId}/cancel`
            )
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Transaction cannot be cancelled");
    });


    // =========================================================
    // TRANSFER
    // =========================================================

    test("should reject transfer without idempotency key", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transfer`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                destinationWalletId: secondWalletId,
                amount: "100",
                currency: "INR"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Idempotency-Key header is required");
    });


    test("should reject transfer to the same wallet", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transfer`)
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", `same-wallet-${Date.now()}`)
            .send({
                destinationWalletId: walletId,
                amount: "100",
                currency: "INR"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Cannot transfer to the same wallet");
    });


    test("should complete transfer successfully", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transfer`)
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", `transfer-${Date.now()}`)
            .send({
                destinationWalletId: secondWalletId,
                amount: "100",
                currency: "INR"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.transfer)
            .toBeDefined();

        expect(response.body.transfer.sourceTransaction)
            .toBeDefined();

        expect(response.body.transfer.destinationTransaction)
            .toBeDefined();

        expect(response.body.transfer.debitEntry)
            .toBeDefined();

        expect(response.body.transfer.creditEntry)
            .toBeDefined();

        expect(response.body.transfer.debitEntry.entry_type)
            .toBe("DEBIT");

        expect(response.body.transfer.creditEntry.entry_type)
            .toBe("CREDIT");
    });


    test("should reject transfer with insufficient balance", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transfer`)
            .set("Authorization", `Bearer ${token}`)
            .set(
                "Idempotency-Key",
                `transfer-insufficient-${Date.now()}`
            )
            .send({
                destinationWalletId: secondWalletId,
                amount: "999999",
                currency: "INR"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Insufficient wallet balance");
    });


    test("should reject transfer with currency mismatch", async () => {

        const response = await request(app)
            .post(`/api/wallets/${walletId}/transfer`)
            .set("Authorization", `Bearer ${token}`)
            .set(
                "Idempotency-Key",
                `transfer-currency-${Date.now()}`
            )
            .send({
                destinationWalletId: secondWalletId,
                amount: "50",
                currency: "USD"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Source wallet currency mismatch");
    });


    // =========================================================
    // IDEMPOTENCY
    // =========================================================

    test("should return the same result for repeated idempotent request", async () => {

        const idempotencyKey =
            `idempotent-${Date.now()}`;

        // Create a new deposit
        const createResponse = await request(app)
            .post(`/api/wallets/${secondWalletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "50",
                currency: "INR"
            });

        expect(createResponse.statusCode).toBe(201);

        const transactionId =
            createResponse.body.transaction.id;

        const firstResponse = await request(app)
            .post(
                `/api/transactions/${transactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", idempotencyKey);

        expect(firstResponse.statusCode).toBe(200);

        const secondResponse = await request(app)
            .post(
                `/api/transactions/${transactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", idempotencyKey);

        expect(secondResponse.statusCode).toBe(200);
        expect(secondResponse.body.success).toBe(true);

        expect(secondResponse.body.ledgerEntry)
            .toEqual(firstResponse.body.ledgerEntry);
    });


    test("should reject reusing idempotency key for another transaction", async () => {

        const idempotencyKey =
            `duplicate-key-${Date.now()}`;

        // Transaction 1
        const firstCreate = await request(app)
            .post(`/api/wallets/${secondWalletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "25",
                currency: "INR"
            });

        const firstTransactionId =
            firstCreate.body.transaction.id;

        const firstProcess = await request(app)
            .post(
                `/api/transactions/${firstTransactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", idempotencyKey);

        expect(firstProcess.statusCode).toBe(200);

        // Transaction 2
        const secondCreate = await request(app)
            .post(`/api/wallets/${secondWalletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "30",
                currency: "INR"
            });

        const secondTransactionId =
            secondCreate.body.transaction.id;

        const secondProcess = await request(app)
            .post(
                `/api/transactions/${secondTransactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", idempotencyKey);

        expect(secondProcess.statusCode).toBe(409);
        expect(secondProcess.body.success).toBe(false);

        expect(secondProcess.body.message)
            .toBe(
                "Idempotency key already used for another transaction"
            );
    });


    // =========================================================
    // CLEANUP
    // =========================================================

    afterAll(async () => {

        if (redisClient.isOpen) {
            await redisClient.quit();
        }

    });

});