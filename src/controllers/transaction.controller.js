const { createTransaction, getTransactionsByWalletId, findTransactionById, findUserTransactionHistory, cancelTransaction } = require("../repositories/transaction.repository");
const { findWalletByWalletId } = require("../repositories/wallet.repository");
const {
    processTransaction,
    transferFunds
} = require("../services/transaction.service");

const createTransactionController = async (req, res) => {

    const userId = req.user.sub;
    const walletId = req.params.walletId;

    const { type, amount, currency, referenceTransactionId } = req.body;

    if (!type || !amount || !currency) {
        return res.status(400).json({
            message: "Type, amount and currency are required",
            success: false
        });
    }

const numericAmount = Number(amount);

if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
        message: "Amount must be a positive number",
        success: false
    });
}

    const allowedTypes = [
    "DEPOSIT",
    "WITHDRAW",
    "TRANSFER",
    "REFUND",
    "REVERSAL"
];

const normalizedType = type.toUpperCase();

if (
    (normalizedType === "REFUND" ||
     normalizedType === "REVERSAL") &&
    !referenceTransactionId
) {
    return res.status(400).json({
        message: "Reference transaction is required for refund or reversal",
        success: false
    });
}

if (!allowedTypes.includes(normalizedType)) {
    return res.status(400).json({
        message: "Invalid transaction type",
        success: false
    });
}

    const wallet = await findWalletByWalletId(walletId, userId);

    if (!wallet) {
        return res.status(404).json({
            message: "Wallet not found",
            success: false
        });
    }

    if (wallet.status !== "ACTIVE") {
    return res.status(400).json({
        message: "Wallet is not active",
        success: false
    });
}

    const normalizedCurrency = currency.toUpperCase();

    if (normalizedCurrency !== wallet.currency) {
    return res.status(400).json({
        message: "Transaction currency must match wallet currency",
        success: false
    });
}

let referenceId = null;

if (
    normalizedType === "REFUND" ||
    normalizedType === "REVERSAL"
) {
    referenceId = Number(referenceTransactionId);

    if (!Number.isInteger(referenceId) || referenceId <= 0) {
        return res.status(400).json({
            message: "Invalid reference transaction ID",
            success: false
        });
    }
}

    const transaction = await createTransaction(
        walletId,
        normalizedType,
        numericAmount,
        normalizedCurrency,
        "PENDING",
        referenceId
    );

    return res.status(201).json({
        message: "Transaction created successfully",
        success: true,
        transaction
    });
};

const getWalletTransactions = async (req, res) => {

    const userId = req.user.sub;
    const walletId = req.params.walletId;

const page = Math.max(Number(req.query.page) || 1, 1);

const limit = Math.min(
    Math.max(Number(req.query.limit) || 10, 1),
    100
);

const offset = (page - 1) * limit;

    const wallet = await findWalletByWalletId(walletId, userId);

    if (!wallet) {
        return res.status(404).json({
            message: "Wallet not found",
            success: false
        });
    }

    const transactions = await getTransactionsByWalletId(walletId, limit, offset);

    return res.status(200).json({
        message: "Transactions fetched successfully",
        success: true,
        page,
        limit,
        transactions
    });
};


const getTransactionById = async (req, res) => {

    const userId = req.user.sub;
    const walletId = req.params.walletId;
    const transactionId = req.params.transactionId;

    const wallet = await findWalletByWalletId(walletId, userId);

    if (!wallet) {
        return res.status(404).json({
            message: "Wallet not found",
            success: false
        });
    }

    const transaction = await findTransactionById(
        transactionId,
        walletId
    );

    if (!transaction) {
        return res.status(404).json({
            message: "Transaction not found",
            success: false
        });
    }

    return res.status(200).json({
        message: "Transaction fetched successfully",
        success: true,
        transaction
    });
};

const getUserTransactionHistory = async (req, res) => {

    const userId = req.user.sub;

const page = Math.max(Number(req.query.page) || 1, 1);
const limit = Math.min(
    Math.max(Number(req.query.limit) || 10, 1),
    100
);

const offset = (page - 1) * limit;

    const type = req.query.type;
    const status = req.query.status;

    const sort = req.query.sort || "created_at";
    const order = req.query.order || "desc";

    const allowedTypes = [
        "DEPOSIT",
        "WITHDRAW",
        "TRANSFER",
        "REFUND",
        "REVERSAL"
    ];

    if (type && !allowedTypes.includes(type)) {
        return res.status(400).json({
            message: "Invalid transaction type",
            success: false
        });
    }

    const allowedStatuses = [
        "PENDING",
        "COMPLETED",
        "FAILED"
    ];

    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid transaction status",
            success: false
        });
    }

    const allowedSortFields = [
    "created_at",
    "amount"
    ];

    if (!allowedSortFields.includes(sort)) {
        return res.status(400).json({
            message: "Invalid sort field",
            success: false
        });
    }

    const allowedOrders = [
        "asc",
        "desc"
    ];

    if (!allowedOrders.includes(order)) {
        return res.status(400).json({
            message: "Invalid sort order",
            success: false
        });
    }

    const transactions = await findUserTransactionHistory(
        userId,
        limit,
        offset,
        type,
        status,
        sort,
        order
    );

    return res.status(200).json({
        message: "Transaction history fetched successfully",
        success: true,
        page,
        limit,
        sort,
        order,
        transactions
    });
};

const processTransactionController = async (req, res) => {

    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
    return res.status(400).json({
        message: "Idempotency-Key header is required",
        success: false
    });
}

    const userId = Number(req.user.sub);    
    const transactionId = req.params.transactionId;

    try {

        const ledgerEntry = await processTransaction(
            transactionId,
            userId,
            idempotencyKey
        );

        return res.status(200).json({
            message: "Transaction processed successfully",
            success: true,
            ledgerEntry
        });

    } catch (error) {

        if (error.message === "Wallet is currently being processed") {
            return res.status(409).json({
                message: error.message,
                success: false
            });
        }

        if (error.message === "Insufficient wallet balance") {
            return res.status(400).json({
                message: error.message,
                success: false
            });
        }

        if (error.message === "Transaction has already been processed") {
            return res.status(400).json({
                message: error.message,
                success: false
            });
        }
        
        if (error.message === "Transaction not found") {
            return res.status(404).json({
                message: error.message,
                success: false
            });
        }

        if (error.message === "Transaction access denied") {
            return res.status(403).json({
                message: error.message,
                success: false
            });
        }

        if (error.message === "Transaction is already processed") {
            return res.status(409).json({
                message: error.message,
                success: false
            });
        }

        if (error.message === "Unsupported transaction type") {
            return res.status(400).json({
                message: error.message,
                success: false
            });
        }

        if (error.message === "Idempotency key already used for another transaction") {
            return res.status(409).json({
                message: error.message,
                success: false
            });
        }

        if (
        error.message === "Reference transaction is required" ||
        error.message === "Reference transaction not found" ||
        error.message === "Reference transaction must be completed" ||
        error.message === "Reference transaction belongs to another wallet" ||
        error.message === "Reference transaction currency mismatch" ||
        error.message === "Refund or reversal amount must match reference transaction" ||
        error.message === "Reference transaction type cannot be refunded or reversed" ||
        error.message === "Transfers must be processed using transfer endpoint"
    ) {
        return res.status(400).json({
            message: error.message,
            success: false
        });
    }

        throw error;
    }
};

const transferFundsController = async (req, res) => {

    const userId = req.user.sub;
    const sourceWalletId = req.params.walletId;

    const {
        destinationWalletId,
        amount,
        currency
    } = req.body;

    const idempotencyKey = req.headers["idempotency-key"];

if (!idempotencyKey) {
    return res.status(400).json({
        message: "Idempotency-Key header is required",
        success: false
    });
}

if (!destinationWalletId || !amount || !currency) {
    return res.status(400).json({
        message: "Destination wallet, amount and currency are required",
        success: false
    });
}

const numericAmount = Number(amount);

if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
        message: "Amount must be a positive number",
        success: false
    });
}

const normalizedCurrency = currency.toUpperCase();

if (Number(sourceWalletId) === Number(destinationWalletId)) {
    return res.status(400).json({
        message: "Cannot transfer to the same wallet",
        success: false
    });
}

try {

    const transfer = await transferFunds(
        sourceWalletId,
        destinationWalletId,
        Number(amount),
        normalizedCurrency,
        userId,
        idempotencyKey
    );

    return res.status(200).json({
        message: "Transfer completed successfully",
        success: true,
        transfer
    });

} catch (error) {

    if (error.message === "Wallet is currently being processed") {
    return res.status(409).json({
        message: error.message,
        success: false
    });
}

   if (error.message === "Insufficient wallet balance") {
    return res.status(400).json({
        message: error.message,
        success: false
    });
}

if (error.message === "Transaction access denied") {
    return res.status(403).json({
        message: error.message,
        success: false
    });
}

if (error.message === "Wallet not found") {
    return res.status(404).json({
        message: error.message,
        success: false
    });
}

if (error.message === "Source wallet is not active" ||
    error.message === "Destination wallet is not active") {
    return res.status(400).json({
        message: error.message,
        success: false
    });
}

if (error.message === "Source wallet currency mismatch" ||
    error.message === "Destination wallet currency mismatch") {
    return res.status(400).json({
        message: error.message,
        success: false
    });
}

if (error.message === "Cannot transfer to the same wallet") {
    return res.status(400).json({
        message: error.message,
        success: false
    });
}

throw error;

}

};

const cancelTransactionController = async (req, res) => {

    const userId = req.user.sub;
    const walletId = req.params.walletId;
    const transactionId = req.params.transactionId;

    const wallet = await findWalletByWalletId(walletId, userId);

    if (!wallet) {
        return res.status(404).json({
            message: "Wallet not found",
            success: false
        });
    }

    const transaction = await cancelTransaction(
        transactionId,
        walletId
    );

    if (!transaction) {
        return res.status(400).json({
            message: "Transaction cannot be cancelled",
            success: false
        });
    }

    return res.status(200).json({
        message: "Transaction cancelled successfully",
        success: true,
        transaction
    });
};

module.exports = {
    createTransactionController,
    getWalletTransactions,
    getTransactionById,
    getUserTransactionHistory,
    processTransactionController,
    transferFundsController,
    cancelTransactionController
};