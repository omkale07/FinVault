const { body } = require("express-validator");

const loginValidator = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),

    body("password")
        .isString()
        .withMessage("Password must be a string")
        .notEmpty()
        .withMessage("Password is required")
];

const registerValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),

    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),

    body("password")
        .isString()
        .withMessage("Password must be a string")
        .isLength({ min: 8, max: 128 })
        .withMessage("Password must be between 8 and 128 characters")
];

const changePasswordValidator = [
    body("currentPassword")
        .isString()
        .withMessage("Current password must be a string")
        .notEmpty()
        .withMessage("Current password is required"),

    body("newPassword")
        .isString()
        .withMessage("New password must be a string")
        .isLength({ min: 8, max: 128 })
        .withMessage("New password must be between 8 and 128 characters")
];

module.exports = {
    loginValidator,
    registerValidator,
    changePasswordValidator
};