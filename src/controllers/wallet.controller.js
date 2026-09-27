const {
    createWallet,
    findWalletByUserId,
    findWalletByWalletId,
    updateWallet,
    deleteWallet
    } = require('../repositories/wallet.repository');

const {
    getWalletBalanceService
} = require("../services/wallet.service");


const createWalletController = async(req, res) =>{

    const userId = req.user.sub;

    const {name, currency} = req.body;

    if(!name || !currency){
        return res.status(400).json({
            message : "Name and Currency are required",
            success : false
        });
    };

    const wallet = await createWallet(userId, name, currency);

    return res.status(201).json({
        message : "Wallet created Successfully",
        success : true,
        wallet
    });
};

const getUserWallets = async(req, res) =>{

    const userId = req.user.sub;

    const wallets = await findWalletByUserId(userId);

    if(wallets.length === 0){
    return res.status(200).json({
        message : "No wallets found",
        success : true,
        wallets : []
    });
}

    return res.status(200).json({
        message : "Wallets fetched successfully",
        success : true,
        wallets
    });
};

const getWalletByWalletId = async(req, res) =>{

    const userId = req.user.sub;
    const walletId = req.params.walletId;

    const wallet = await findWalletByWalletId(walletId, userId);

     if (!wallet) {
        return res.status(404).json({
            message: "Wallet not found",
            success: false
        });
    }

    return res.status(200).json({
        message: "Wallet fetched successfully",
        success: true,
        wallet
    });
}

const updateWalletController = async(req, res) =>{

    const userId = req.user.sub;
    const walletId = req.params.walletId;

    const {name, currency} = req.body;

     if (!name || !currency) {
        return res.status(400).json({
            message: "Name and Currency are required",
            success: false
        });
    }

    const wallet = await updateWallet(walletId, userId, name, currency);

     if (!wallet) {
        return res.status(404).json({
            message: "Wallet not found",
            success: false
        });
    }

    return res.status(200).json({
        message: "Wallet updated successfully",
        success: true,
        wallet
    });

}

const deleteWalletController = async (req, res) => {

    const userId = req.user.sub;
    const walletId = req.params.walletId;

    try {

        const wallet = await deleteWallet(walletId, userId);

        if (!wallet) {
            return res.status(404).json({
                message: "Wallet not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Wallet deleted successfully",
            success: true,
            wallet
        });

    } catch (error) {

        // Wallet has transactions / ledger entries
        if (error.code === "23503") {
            return res.status(409).json({
                message: "Cannot delete wallet because it has financial records",
                success: false
            });
        }

        throw error;
    }
};


const getWalletBalanceController = async (req, res) => {

    const userId = req.user.sub;
    const walletId = req.params.walletId;

    try {

        const balance = await getWalletBalanceService(
            walletId,
            userId
        );

        return res.status(200).json({
            message: "Wallet balance fetched successfully",
            success: true,
            wallet: balance
        });

    } catch (error) {

        if (error.message === "Wallet not found") {
            return res.status(404).json({
                message: error.message,
                success: false
            });
        }

        throw error;
    }
};

module.exports = {
    createWalletController,
    getUserWallets,
    getWalletByWalletId,
    updateWalletController,
    deleteWalletController,
    getWalletBalanceController
};