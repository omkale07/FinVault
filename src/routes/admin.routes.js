const express = require("express");
const { apiRateLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();

router.use(apiRateLimiter);

const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const {
    getUsers, getWallets, getTransactions, getAuditLogs
} = require("../controllers/admin.controller");


router.get("/users", authMiddleware, adminMiddleware, getUsers);
router.get("/wallets", authMiddleware, adminMiddleware, getWallets);
router.get("/transactions", authMiddleware, adminMiddleware, getTransactions);
router.get("/audit-logs", authMiddleware, adminMiddleware, getAuditLogs);


module.exports = router;