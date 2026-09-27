const {
    getAllUsers,
    getAllWallets,
    getAllTransactions,
} = require("../repositories/admin.repository");

const {getAllAuditLogs} = require('../repositories/audit.repository')


const getUsers = async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { count, users } = await getAllUsers(limit, offset);

    return res.status(200).json({
        message: "Users fetched successfully",
        success: true,
        page,
        limit,
        count,
        users
    });
};


const getWallets = async (req, res) => {

    const page = Math.max(
    Number(req.query.page) || 1,
    1
);

const limit = Math.min(
    Math.max(Number(req.query.limit) || 10, 1),
    100
);

    const offset = (page - 1) * limit;

    const { count, wallets } = await getAllWallets(limit, offset);

    return res.status(200).json({
        message: "Wallets fetched successfully",
        success: true,
        page,
        limit,
        count,
        wallets
    });
};


const getTransactions = async (req, res) => {

    const page = Math.max(
    Number(req.query.page) || 1, 
    1
);

const limit = Math.min(
    Math.max(Number(req.query.limit) || 10, 1),
    100
);

    const offset = (page - 1) * limit;

    const { count, transactions } =
        await getAllTransactions(limit, offset);

    return res.status(200).json({
        message: "Transactions fetched successfully",
        success: true,
        page,
        limit,
        count,
        transactions
    });
};

const getAuditLogs = async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const action = req.query.action || null;
    const entityType = req.query.entityType || null;

    const logs = await getAllAuditLogs(
        limit,
        offset,
        action,
        entityType
    );

    return res.status(200).json({
        message: "Audit logs fetched successfully",
        success: true,
        page,
        limit,
        logs
    });
};

module.exports = {
    getUsers,
    getWallets,
    getTransactions,
    getAuditLogs
};