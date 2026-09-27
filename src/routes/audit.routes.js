const express = require('express');
const { apiRateLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();
router.use(apiRateLimiter);

const authMiddleware = require('../middleware/auth.middleware');

const {getAuditLogsController} = require('../controllers/audit.controller');

router.get("/", authMiddleware, getAuditLogsController)


module.exports = router;