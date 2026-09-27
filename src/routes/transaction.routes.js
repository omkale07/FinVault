const express = require("express");

const {
    apiRateLimiter
} = require("../middleware/rateLimit.middleware");

const router = express.Router();

router.use(apiRateLimiter);

const {
    createTransactionController,
    getWalletTransactions,
    getTransactionById,
    getUserTransactionHistory,
    processTransactionController,
    transferFundsController,
    cancelTransactionController
} = require("../controllers/transaction.controller");

const authMiddleware =
    require("../middleware/auth.middleware");

const {
    walletIdValidator
} = require("../validators/wallet.validator");

const {
    createTransactionValidator,
    transactionIdValidator
} = require("../validators/transaction.validator");

const validate =
    require("../middleware/validation.middleware");


// Create transaction
router.post(
    "/wallets/:walletId/transactions",
    authMiddleware,
    walletIdValidator,
    createTransactionValidator,
    validate,
    createTransactionController
);


// Get wallet transactions
router.get(
    "/wallets/:walletId/transactions",
    authMiddleware,
    walletIdValidator,
    validate,
    getWalletTransactions
);


// Get transaction by ID
router.get(
    "/wallets/:walletId/transaction/:transactionId",
    authMiddleware,
    walletIdValidator,
    transactionIdValidator,
    validate,
    getTransactionById
);


// Get user's transaction history
router.get(
    "/transactions",
    authMiddleware,
    getUserTransactionHistory
);


// Process transaction
router.post(
    "/transactions/:transactionId/process",
    authMiddleware,
    transactionIdValidator,
    validate,
    processTransactionController
);


// Transfer funds
router.post(
    "/wallets/:walletId/transfer",
    authMiddleware,
    walletIdValidator,
    validate,
    transferFundsController
);


// Cancel transaction
router.post(
    "/wallets/:walletId/transactions/:transactionId/cancel",
    authMiddleware,
    walletIdValidator,
    transactionIdValidator,
    validate,
    cancelTransactionController
);


module.exports = router;