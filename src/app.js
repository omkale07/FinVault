const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");

const userRoutes = require("./routes/user.routes");
const walletRoutes = require("./routes/wallet.routes");
const transactionRoutes = require("./routes/transaction.routes");
const auditRoutes = require("./routes/audit.routes");
const adminRoutes = require("./routes/admin.routes");
const notificationRoutes = require("./routes/notification.routes");

const errorMiddleware = require("./middleware/error.middleware");

const app = express();


// =====================================================
// SECURITY
// =====================================================

app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);


// =====================================================
// BODY PARSING
// =====================================================

app.use(
    express.json({
        limit: "10kb"
    })
);

app.use(cookieParser());


// =====================================================
// HEALTH / ROOT
// =====================================================

app.get("/", (req, res) => {
    res.json({
        message: "FinVault API is running"
    });
});


// =====================================================
// API ROUTES
// =====================================================

app.use("/api/users", userRoutes);
app.use("/api", walletRoutes);
app.use("/api", transactionRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(errorMiddleware);


module.exports = app;