const {
    findUserByEmail,
    createUser,
    findUserById,
    updateUserProfile,
    updatePassword: updatePasswordInDB,
    findUserByIDWithPassword,
    revokeAllUserSessions
} = require("../repositories/user.repository");

const {
    createSession,
    findSessionByRefreshTokenHash,
    rotateRefreshToken,
    revokeSession
} = require("../repositories/session.repository");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


const registerUser = async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required",
            success: false
        });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        return res.status(409).json({
            message: "Email already exists",
            success: false
        });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser(
        name,
        email,
        passwordHash
    );

    return res.status(201).json({
        message: "Registration successful",
        success: true,
        user
    });
};


const loginUser = async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password is required",
            success: false
        });
    }

    const existingUser = await findUserByEmail(email);

    if (!existingUser) {
        return res.status(401).json({
            message: "Invalid credentials",
            success: false
        });
    }

    const isMatchedPassword = await bcrypt.compare(
        password,
        existingUser.password_hash
    );

    if (!isMatchedPassword) {
        return res.status(401).json({
            message: "Invalid credentials",
            success: false
        });
    }

    const refreshToken =
        crypto.randomBytes(64).toString("hex");

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    const tokenFamilyId = crypto.randomUUID();

    const expiresAt = new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
    );

    await createSession(
        existingUser.id,
        refreshTokenHash,
        tokenFamilyId,
        req.ip,
        req.headers["user-agent"],
        expiresAt
    );

    res.cookie(
        "refreshToken",
        refreshToken,
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    );

    const token = jwt.sign(
        {
            sub: existingUser.id,
            role: existingUser.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "15m",
            algorithm: "HS256"
        }
    );

    return res.status(200).json({
        message: "Login successful",
        success: true,
        token
    });
};


const refreshAccessToken = async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token is required",
            success: false
        });
    }

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    const session =
        await findSessionByRefreshTokenHash(
            refreshTokenHash
        );

    if (!session) {
        return res.status(401).json({
            message: "Invalid refresh token",
            success: false
        });
    }

    if (session.revoked_at) {
        return res.status(401).json({
            message: "Refresh session has been revoked",
            success: false
        });
    }

    if (new Date(session.expires_at) < new Date()) {
        return res.status(401).json({
            message: "Refresh token has expired",
            success: false
        });
    }

    const newRefreshToken =
        crypto.randomBytes(64).toString("hex");

    const newRefreshTokenHash = crypto
        .createHash("sha256")
        .update(newRefreshToken)
        .digest("hex");

    await rotateRefreshToken(
        session.id,
        newRefreshTokenHash
    );

    const user =
        await findUserById(session.user_id);

    if (!user) {
        return res.status(401).json({
            message: "User account not found",
            success: false
        });
    }

    const newAccessToken = jwt.sign(
        {
            sub: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "15m",
            algorithm: "HS256"
        }
    );

    res.cookie(
        "refreshToken",
        newRefreshToken,
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    );

    return res.status(200).json({
        message: "Token refresh successful",
        success: true,
        token: newAccessToken
    });
};


const logoutUser = async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(200).json({
            message: "Already logged out",
            success: true
        });
    }

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    const session =
        await findSessionByRefreshTokenHash(
            refreshTokenHash
        );

    if (session) {
        await revokeSession(session.id);
    }

    res.clearCookie("refreshToken");

    return res.status(200).json({
        message: "Logout successful",
        success: true
    });
};


const getProfile = async (req, res) => {

    const userId = req.user.sub;

    const user = await findUserById(userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false
        });
    }

    return res.status(200).json({
        message: "Profile fetched successfully",
        success: true,
        user
    });
};


const updateProfile = async (req, res) => {

    const userId = req.user.sub;

    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            message: "Name, email is required",
            success: false
        });
    }

    const existingUser =
        await findUserByEmail(email);

    if (
        existingUser &&
        Number(existingUser.id) !== Number(userId)
    ) {
        return res.status(409).json({
            message: "Email already exists",
            success: false
        });
    }

    const user =
        await updateUserProfile(
            userId,
            name,
            email
        );

    return res.status(200).json({
        message: "Profile update successful",
        success: true,
        user
    });
};


const updatePassword = async (req, res) => {

    const userId = req.user.sub;

    const {
        currentPassword,
        newPassword
    } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "Current / New Password is required",
            success: false
        });
    }

    const user =
        await findUserByIDWithPassword(userId);

    if (!user) {
        return res.status(400).json({
            message: "User not found",
            success: false
        });
    }

    const isMatched =
        await bcrypt.compare(
            currentPassword,
            user.password_hash
        );

    if (!isMatched) {
        return res.status(401).json({
            message: "Current password not matched",
            success: false
        });
    }

    const newPasswordHash =
        await bcrypt.hash(newPassword, 12);

    await updatePasswordInDB(
        userId,
        newPasswordHash
    );

    await revokeAllUserSessions(userId);

    return res.status(200).json({
        message: "Password change successful",
        success: true
    });
};


module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getProfile,
    updateProfile,
    updatePassword
};