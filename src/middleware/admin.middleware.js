const adminMiddleware = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required",
            success: false
        });
    }

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            message: "Admin access required",
            success: false
        });
    }

    next();
};

module.exports = adminMiddleware;