const app = require("./app");

const { connectRedis } = require("./config/redis");
const { connectRabbitMQ } = require("./config/rabbitmq");

const {
    startOutboxWorker
} = require("./workers/outbox.worker");

const {
    startNotificationWorker
} = require("./workers/notification.worker");

const {
    startTransactionExpirationWorker
} = require("./workers/transactionExpiration.worker");

const PORT = process.env.PORT;

const startServer = async () => {

    await connectRedis();

    await connectRabbitMQ();

    app.listen(PORT, () => {
        console.log(
            `FinVault server running on port ${PORT}`
        );
    });

    // Start background workers
    startOutboxWorker().catch(error => {
        console.error(
            "Outbox worker failed:",
            error.message
        );
    });

    startNotificationWorker().catch(error => {
        console.error(
            "Notification worker failed:",
            error.message
        );
    });

    startTransactionExpirationWorker().catch(error => {
        console.error(
            "Transaction expiration worker failed:",
            error.message
        );
    });
};

startServer();