const { body, param } = require("express-validator");

const createTransactionValidator = [
    body("type")
        .isIn([
            "DEPOSIT",
            "WITHDRAW",
            "REFUND",
            "REVERSAL"
        ])
        .withMessage("Invalid transaction type"),

    body("amount")
        .isDecimal({ decimal_digits: "0,4" })
        .withMessage("Amount must be a valid decimal number")
        .custom(value => Number(value) > 0)
        .withMessage("Amount must be greater than 0"),

    body("currency")
        .isLength({ min: 3, max: 3 })
        .isAlpha()
        .withMessage("Currency must be a 3-letter code")
        .toUpperCase()
];

const transactionIdValidator = [
    param("transactionId")
        .isInt({ min: 1 })
        .withMessage("Invalid transaction ID")
];

module.exports = {
    createTransactionValidator,
    transactionIdValidator
};