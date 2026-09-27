const express = require('express');
const { apiRateLimiter } = require("../middleware/rateLimit.middleware");

const validate =
    require("../middleware/validation.middleware");

const {
    createWalletValidator,
    walletIdValidator
} = require("../validators/wallet.validator");

const router = express.Router();
router.use(apiRateLimiter);

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const {createWalletController, getUserWallets, getWalletByWalletId, updateWalletController, deleteWalletController, getWalletBalanceController} = require('../controllers/wallet.controller');

router.post("/wallets", authMiddleware, createWalletValidator, validate, createWalletController);

router.get("/wallets", authMiddleware, getUserWallets);

router.get("/wallets/:walletId", authMiddleware, walletIdValidator, validate, getWalletByWalletId);

router.patch("/wallets/:walletId", authMiddleware, walletIdValidator, validate, updateWalletController);

router.delete("/wallets/:walletId", authMiddleware, walletIdValidator, validate, deleteWalletController);

router.get("/wallets/:walletId/balance", authMiddleware, walletIdValidator, validate, getWalletBalanceController);



module.exports = router;