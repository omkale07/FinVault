const rateLimit = require("express-rate-limit");

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,

    message: {
        message: "Too many requests. Please try again later.",
        success: false
    },

    standardHeaders: true,
    legacyHeaders: false
});

const registerRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,

    message: {
        message: "Too many registration attempts. Please try again later.",
        success: false
    },

    standardHeaders: true,
    legacyHeaders: false
});


const refreshRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,

    message: {
        message: "Too many token refresh requests. Please try again later.",
        success: false
    },

    standardHeaders: true,
    legacyHeaders: false
});


const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,

    message: {
        message: "Too many requests. Please try again later.",
        success: false
    },

    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    authRateLimiter,
    registerRateLimiter,
    refreshRateLimiter,
    apiRateLimiter
};