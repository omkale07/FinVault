const { body, param } = require("express-validator");

const createWalletValidator = [
    body("currency")
        .isLength({ min: 3, max: 3 })
        .isAlpha()
        .withMessage("Currency must be a 3-letter code")
        .toUpperCase()
];

const walletIdValidator = [
    param("walletId")
        .isInt({ min: 1 })
        .withMessage("Invalid wallet ID")
];

module.exports = {
    createWalletValidator,
    walletIdValidator
};