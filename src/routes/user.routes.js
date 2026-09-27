const express = require('express');

const router = express.Router();

const { registerUser, loginUser, refreshAccessToken, logoutUser, getProfile, updateProfile, updatePassword } = require("../controllers/user.controller");
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const {authRateLimiter, 
       registerRateLimiter,
       refreshRateLimiter
} = require('../middleware/rateLimit.middleware');

const {
    loginValidator, registerValidator, changePasswordValidator
} = require("../validators/auth.validator");

const validate =
    require("../middleware/validation.middleware");


router.post("/register", registerValidator, validate, registerRateLimiter, registerUser);
router.post("/login", loginValidator, validate, authRateLimiter, loginUser);
router.post("/refresh", refreshRateLimiter, refreshAccessToken);  
router.post("/logout", logoutUser);
router.get("/profile", authMiddleware, getProfile);
router.patch("/profile", authMiddleware, updateProfile);
router.patch("/password", authMiddleware, changePasswordValidator, validate, updatePassword);


router.get("/admin-test", authMiddleware, authorize('ADMIN', 'MANAGER'), (req, res) =>{
    return res.status(200).json({
        message : "Welcome Admin & Manager",
        success : true
    });
});


module.exports = router;