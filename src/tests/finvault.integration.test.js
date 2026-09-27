const request = require("supertest");
const app = require("../app");

const {
    connectRedis,
    redisClient
} = require("../config/redis");

const TEST_EMAIL = `integration_${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPassword123";

let token;

let walletId;
let destinationWalletId;

let depositTransactionId;


describe("FinVault Financial Integration Tests", () => {

    // =========================================================
    // SETUP
    // =========================================================

    beforeAll(async () => {

        await connectRedis();

        // Create test user
        const registerResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: "Integration User",
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


        // Create source wallet
        const walletResponse = await request(app)
            .post("/api/wallets")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Integration Source Wallet",
                currency: "INR"
            });

        expect(walletResponse.statusCode).toBe(201);

        walletId = walletResponse.body.wallet.id;


        // Create destination wallet
        const destinationResponse = await request(app)
            .post("/api/wallets")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Integration Destination Wallet",
                currency: "INR"
            });

        expect(destinationResponse.statusCode).toBe(201);

        destinationWalletId =
            destinationResponse.body.wallet.id;
    });


    // =========================================================
    // 1. DEPOSIT FINANCIAL CORRECTNESS
    // =========================================================

    test("deposit should increase wallet balance correctly", async () => {

        const balanceBefore = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        expect(balanceBefore.statusCode).toBe(200);

        const before =
            Number(balanceBefore.body.wallet.balance);


        const createResponse = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "1000",
                currency: "INR"
            });

        expect(createResponse.statusCode).toBe(201);

        depositTransactionId =
            createResponse.body.transaction.id;


        const processResponse = await request(app)
            .post(
                `/api/transactions/${depositTransactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set(
                "Idempotency-Key",
                `integration-deposit-${Date.now()}`
            );

        expect(processResponse.statusCode).toBe(200);


        const balanceAfter = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        expect(balanceAfter.statusCode).toBe(200);

        const after =
            Number(balanceAfter.body.wallet.balance);


        expect(after).toBe(before + 1000);


        // Ledger must be CREDIT
        expect(processResponse.body.ledgerEntry.entry_type)
            .toBe("CREDIT");

        expect(
            Number(processResponse.body.ledgerEntry.amount)
        ).toBe(1000);
    });


    // =========================================================
    // 2. WITHDRAWAL FINANCIAL CORRECTNESS
    // =========================================================

    test("withdrawal should decrease wallet balance correctly", async () => {

        const balanceBefore = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const before =
            Number(balanceBefore.body.wallet.balance);


        const createResponse = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "WITHDRAW",
                amount: "200",
                currency: "INR"
            });

        expect(createResponse.statusCode).toBe(201);

        const transactionId =
            createResponse.body.transaction.id;


        const processResponse = await request(app)
            .post(
                `/api/transactions/${transactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set(
                "Idempotency-Key",
                `integration-withdraw-${Date.now()}`
            );

        expect(processResponse.statusCode).toBe(200);


        const balanceAfter = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const after =
            Number(balanceAfter.body.wallet.balance);


        expect(after).toBe(before - 200);


        expect(processResponse.body.ledgerEntry.entry_type)
            .toBe("DEBIT");

        expect(
            Number(processResponse.body.ledgerEntry.amount)
        ).toBe(200);
    });


    // =========================================================
    // 3. IDEMPOTENCY
    // =========================================================

    test("idempotent processing should not change balance twice", async () => {

        const createResponse = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "300",
                currency: "INR"
            });

        expect(createResponse.statusCode).toBe(201);

        const transactionId =
            createResponse.body.transaction.id;

        const idempotencyKey =
            `integration-idempotent-${Date.now()}`;


        const balanceBefore = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const before =
            Number(balanceBefore.body.wallet.balance);


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


        const balanceAfter = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const after =
            Number(balanceAfter.body.wallet.balance);


        // Exactly one deposit of 300
        expect(after).toBe(before + 300);

        expect(secondResponse.body.ledgerEntry)
            .toEqual(firstResponse.body.ledgerEntry);
    });


    // =========================================================
    // 4. TRANSFER FINANCIAL CORRECTNESS
    // =========================================================

    test("transfer should debit source and credit destination", async () => {

        const sourceBeforeResponse = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const destinationBeforeResponse = await request(app)
            .get(
                `/api/wallets/${destinationWalletId}/balance`
            )
            .set("Authorization", `Bearer ${token}`);


        const sourceBefore =
            Number(sourceBeforeResponse.body.wallet.balance);

        const destinationBefore =
            Number(destinationBeforeResponse.body.wallet.balance);


        const response = await request(app)
            .post(`/api/wallets/${walletId}/transfer`)
            .set("Authorization", `Bearer ${token}`)
            .set(
                "Idempotency-Key",
                `integration-transfer-${Date.now()}`
            )
            .send({
                destinationWalletId,
                amount: "100",
                currency: "INR"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);


        const sourceAfterResponse = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const destinationAfterResponse = await request(app)
            .get(
                `/api/wallets/${destinationWalletId}/balance`
            )
            .set("Authorization", `Bearer ${token}`);


        const sourceAfter =
            Number(sourceAfterResponse.body.wallet.balance);

        const destinationAfter =
            Number(destinationAfterResponse.body.wallet.balance);


        expect(sourceAfter)
            .toBe(sourceBefore - 100);

        expect(destinationAfter)
            .toBe(destinationBefore + 100);


        expect(response.body.transfer.debitEntry.entry_type)
            .toBe("DEBIT");

        expect(response.body.transfer.creditEntry.entry_type)
            .toBe("CREDIT");
    });


    // =========================================================
    // 5. TRANSFER ATOMICITY
    // =========================================================

    test("failed transfer should not change either wallet balance", async () => {

        const sourceBeforeResponse = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const destinationBeforeResponse = await request(app)
            .get(
                `/api/wallets/${destinationWalletId}/balance`
            )
            .set("Authorization", `Bearer ${token}`);


        const sourceBefore =
            Number(sourceBeforeResponse.body.wallet.balance);

        const destinationBefore =
            Number(destinationBeforeResponse.body.wallet.balance);


        const response = await request(app)
            .post(`/api/wallets/${walletId}/transfer`)
            .set("Authorization", `Bearer ${token}`)
            .set(
                "Idempotency-Key",
                `integration-failed-transfer-${Date.now()}`
            )
            .send({
                destinationWalletId,
                amount: "999999999",
                currency: "INR"
            });


        expect(response.statusCode).toBe(400);

        expect(response.body.message)
            .toBe("Insufficient wallet balance");


        const sourceAfterResponse = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const destinationAfterResponse = await request(app)
            .get(
                `/api/wallets/${destinationWalletId}/balance`
            )
            .set("Authorization", `Bearer ${token}`);


        const sourceAfter =
            Number(sourceAfterResponse.body.wallet.balance);

        const destinationAfter =
            Number(destinationAfterResponse.body.wallet.balance);


        expect(sourceAfter).toBe(sourceBefore);
        expect(destinationAfter).toBe(destinationBefore);
    });


    // =========================================================
    // 6. WALLET OWNERSHIP
    // =========================================================

    test("user should not access another user's wallet", async () => {

        const otherEmail =
            `other_${Date.now()}@example.com`;


        const registerResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: "Other User",
                email: otherEmail,
                password: TEST_PASSWORD
            });

        expect(registerResponse.statusCode).toBe(201);


        const loginResponse = await request(app)
            .post("/api/users/login")
            .send({
                email: otherEmail,
                password: TEST_PASSWORD
            });

        expect(loginResponse.statusCode).toBe(200);

        const otherToken =
            loginResponse.body.token;


        const response = await request(app)
            .get(`/api/wallets/${walletId}`)
            .set(
                "Authorization",
                `Bearer ${otherToken}`
            );


        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Wallet not found");
    });


    // =========================================================
    // 7. TRANSACTION OWNERSHIP
    // =========================================================

    test("user should not process another user's pending transaction", async () => {

        // Create a fresh PENDING transaction owned by User A
        const createResponse = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "DEPOSIT",
                amount: "100",
                currency: "INR"
            });

        expect(createResponse.statusCode).toBe(201);

        const pendingTransactionId =
            createResponse.body.transaction.id;

        expect(createResponse.body.transaction.status)
            .toBe("PENDING");


        // Create User B
        const otherEmail =
            `transaction_other_${Date.now()}@example.com`;


        const registerResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: "Transaction Other User",
                email: otherEmail,
                password: TEST_PASSWORD
            });

        expect(registerResponse.statusCode).toBe(201);


        // Login User B
        const loginResponse = await request(app)
            .post("/api/users/login")
            .send({
                email: otherEmail,
                password: TEST_PASSWORD
            });

        expect(loginResponse.statusCode).toBe(200);

        const otherToken =
            loginResponse.body.token;


        // User B attempts to process User A's transaction
        const response = await request(app)
            .post(
                `/api/transactions/${pendingTransactionId}/process`
            )
            .set(
                "Authorization",
                `Bearer ${otherToken}`
            )
            .set(
                "Idempotency-Key",
                `ownership-${Date.now()}`
            );


        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Transaction access denied");
    });


    // =========================================================
    // 8. CONCURRENT WITHDRAWALS
    // =========================================================

    test("concurrent withdrawals should not overspend wallet", async () => {

        const balanceResponse = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const balance =
            Number(balanceResponse.body.wallet.balance);


        // Make sure there is enough money
        if (balance < 200) {

            const createDeposit = await request(app)
                .post(
                    `/api/wallets/${walletId}/transactions`
                )
                .set(
                    "Authorization",
                    `Bearer ${token}`
                )
                .send({
                    type: "DEPOSIT",
                    amount: "500",
                    currency: "INR"
                });

            expect(createDeposit.statusCode).toBe(201);

            const depositId =
                createDeposit.body.transaction.id;


            const depositProcess = await request(app)
                .post(
                    `/api/transactions/${depositId}/process`
                )
                .set(
                    "Authorization",
                    `Bearer ${token}`
                )
                .set(
                    "Idempotency-Key",
                    `concurrency-deposit-${Date.now()}`
                );

            expect(depositProcess.statusCode).toBe(200);
        }


        const beforeResponse = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);

        const before =
            Number(beforeResponse.body.wallet.balance);


        // Create withdrawal A
        const withdrawalA = await request(app)
            .post(
                `/api/wallets/${walletId}/transactions`
            )
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "WITHDRAW",
                amount: "150",
                currency: "INR"
            });

        expect(withdrawalA.statusCode).toBe(201);


        // Create withdrawal B
        const withdrawalB = await request(app)
            .post(
                `/api/wallets/${walletId}/transactions`
            )
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "WITHDRAW",
                amount: "150",
                currency: "INR"
            });

        expect(withdrawalB.statusCode).toBe(201);


        const transactionA =
            withdrawalA.body.transaction.id;

        const transactionB =
            withdrawalB.body.transaction.id;


        // Process both simultaneously
        const [responseA, responseB] =
            await Promise.all([

                request(app)
                    .post(
                        `/api/transactions/${transactionA}/process`
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`
                    )
                    .set(
                        "Idempotency-Key",
                        `concurrent-A-${Date.now()}`
                    ),

                request(app)
                    .post(
                        `/api/transactions/${transactionB}/process`
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`
                    )
                    .set(
                        "Idempotency-Key",
                        `concurrent-B-${Date.now()}`
                    )
            ]);


        const statuses = [
            responseA.statusCode,
            responseB.statusCode
        ];


        // Valid results are successful processing or
        // insufficient balance.
        expect(
            statuses.every(
                status => status === 200 || status === 400
            )
        ).toBe(true);


        const afterResponse = await request(app)
            .get(`/api/wallets/${walletId}/balance`)
            .set("Authorization", `Bearer ${token}`);


        const after =
            Number(afterResponse.body.wallet.balance);


        // Financial invariant:
        // balance must never become negative.
        expect(after).toBeGreaterThanOrEqual(0);


        // One withdrawal succeeded
        if (
            responseA.statusCode === 200 &&
            responseB.statusCode === 400
        ) {
            expect(after).toBe(before - 150);
        }


        if (
            responseA.statusCode === 400 &&
            responseB.statusCode === 200
        ) {
            expect(after).toBe(before - 150);
        }


        // Both withdrawals succeeded
        if (
            responseA.statusCode === 200 &&
            responseB.statusCode === 200
        ) {
            expect(after).toBe(before - 300);
        }
    });


    // =========================================================
    // 9. FAILED TRANSACTION STATUS
    // =========================================================

    test("insufficient withdrawal should become FAILED", async () => {

        const createResponse = await request(app)
            .post(`/api/wallets/${walletId}/transactions`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "WITHDRAW",
                amount: "999999999",
                currency: "INR"
            });

        expect(createResponse.statusCode).toBe(201);

        const transactionId =
            createResponse.body.transaction.id;


        const processResponse = await request(app)
            .post(
                `/api/transactions/${transactionId}/process`
            )
            .set("Authorization", `Bearer ${token}`)
            .set(
                "Idempotency-Key",
                `failed-status-${Date.now()}`
            );


        expect(processResponse.statusCode).toBe(400);


        const transactionResponse = await request(app)
            .get(
                `/api/wallets/${walletId}/transaction/${transactionId}`
            )
            .set("Authorization", `Bearer ${token}`);


        expect(transactionResponse.statusCode).toBe(200);

        expect(transactionResponse.body.transaction.status)
            .toBe("FAILED");
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