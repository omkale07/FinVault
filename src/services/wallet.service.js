const {
    findWalletByWalletId
} = require("../repositories/wallet.repository");

const {
    getWalletBalance
} = require("../repositories/ledger.repository");

const {
    getCache,
    setCache,
} = require("../utils/redisCache");


const getWalletBalanceService = async (walletId, userId) => {

    const wallet = await findWalletByWalletId(walletId, userId);

    if (!wallet) {
        throw new Error("Wallet not found");
    }

    const cacheKey = `wallet:${walletId}:balance`;

    // Check Redis first
    const cachedBalance = await getCache(cacheKey);

    if (cachedBalance) {

        console.log("Cache HIT:", cacheKey);

        return JSON.parse(cachedBalance);
    }

    console.log("Cache MISS:", cacheKey);

    // Cache miss → get balance from PostgreSQL
    const balance = await getWalletBalance(walletId);

    const response = {
        walletId: wallet.id,
        walletName: wallet.name,
        balance: balance.balance,
        currency: wallet.currency
    };

    // Store result in Redis for 30 seconds
    await setCache(
        cacheKey,
        response,
        30
    );

    return response;
};



module.exports = {
    getWalletBalanceService
};