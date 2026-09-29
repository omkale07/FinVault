const {
    connectRabbitMQ,
    getRabbitChannel
} = require("../config/rabbitmq");

const {
    markEventProcessed
} = require("../repositories/processedEvent.repository");

const {
    createNotification
} = require("../repositories/notification.repository");

const {
    sendEmail
} = require("../services/email.service");

const pool = require("../config/db");

const {
    createTransactionEmailTemplate
} = require("../templates/transactionEmail.template");


const EXCHANGE_NAME =
    "finvault_transaction_events";

const QUEUE_NAME =
    "finvault_transaction_notification_queue";


const startNotificationWorker = async () => {

    // Connect to RabbitMQ
    await connectRabbitMQ();

    const channel = getRabbitChannel();

    // Make sure exchange exists
    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    // Make sure notification queue exists
    await channel.assertQueue(
        QUEUE_NAME,
        {
            durable: true
        }
    );

    // Bind queue to transaction events
    await channel.bindQueue(
        QUEUE_NAME,
        EXCHANGE_NAME,
        "transaction.#"
    );

    console.log(
        "FinVault Notification Worker started..."
    );

    // Start consuming messages
    channel.consume(
        QUEUE_NAME,
        async (message) => {

            if (!message) {
                return;
            }

            let event;

            try {

                // Parse RabbitMQ message first
                event = JSON.parse(
                    message.content.toString()
                );

            } catch (error) {

                console.error(
                    "Invalid RabbitMQ message:",
                    error.message
                );

                // Invalid messages cannot be processed
                channel.nack(
                    message,
                    false,
                    false
                );

                return;
            }

            console.log(
                "\n🔔 Notification Worker received:"
            );

            console.log(event);

            // Only handle supported notification types
            if (
                event.eventType !==
                    "TRANSACTION_COMPLETED" &&
                event.eventType !==
                    "TRANSACTION_FAILED"
            ) {

                console.log(
                    `Event ${event.eventId} does not require a notification. Skipping.`
                );

                channel.ack(message);

                return;
            }

            const client = await pool.connect();

            try {

                // -----------------------------------------
                // 1. Get user's email
                // -----------------------------------------

                const userResult =
                    await client.query(
                        `SELECT email
                         FROM users
                         WHERE id = $1`,
                        [event.userId]
                    );

                if (
                    userResult.rows.length === 0
                ) {
                    throw new Error(
                        `User ${event.userId} not found`
                    );
                }

                const userEmail =
                    userResult.rows[0].email;

                // -----------------------------------------
                // 2. Start PostgreSQL transaction
                // -----------------------------------------

                await client.query("BEGIN");

                // -----------------------------------------
                // 3. Check if event was already processed
                // -----------------------------------------

                const processedEvent =
                    await markEventProcessed(
                        event.eventId,
                        client
                    );

                if (!processedEvent) {

                    console.log(
                        `Event ${event.eventId} already processed. Skipping.`
                    );

                    await client.query("ROLLBACK");

                    channel.ack(message);

                    return;
                }

                // -----------------------------------------
                // 4. Prepare notification content
                // -----------------------------------------

                let title;
                let notificationMessage;

                switch (event.eventType) {

                    case "TRANSACTION_COMPLETED":

                        title =
                            `${event.type} Completed`;

                        notificationMessage =
                            `Your ${event.type.toLowerCase()} of ${event.amount} ${event.currency} was completed successfully.`;

                        break;

                    case "TRANSACTION_FAILED":

                        title =
                            `${event.type} Failed`;

                        notificationMessage =
                            `Your ${event.type.toLowerCase()} of ${event.amount} ${event.currency} failed. Reason: ${event.reason}`;

                        break;
                }

                const transactionLabel =
                    event.type === "DEPOSIT"
                        ? "Deposit"
                        : event.type === "WITHDRAW"
                            ? "Withdrawal"
                            : event.type === "TRANSFER"
                                ? "Transfer"
                                : event.type === "REFUND"
                                    ? "Refund"
                                    : event.type === "REVERSAL"
                                        ? "Reversal"
                                        : "Transaction";

                const emailSubject =
                    `FinVault - ${transactionLabel} ${
                        event.eventType ===
                        "TRANSACTION_COMPLETED"
                            ? "Completed"
                            : "Failed"
                    }`;

                const emailHtml =
                    createTransactionEmailTemplate({
                        type: event.type,
                        status:
                            event.eventType ===
                            "TRANSACTION_COMPLETED"
                                ? "COMPLETED"
                                : "FAILED",
                        amount: event.amount,
                        currency: event.currency,
                        transactionId:
                            event.transactionId,
                        walletId:
                            event.walletId,
                        reason:
                            event.reason,
                        createdAt:
                            event.createdAt
                    });

                // -----------------------------------------
                // 5. Create in-app notification
                // -----------------------------------------

                await createNotification(
                    event.userId,
                    event.eventType,
                    title,
                    notificationMessage,
                    event.transactionId || null,
                    client
                );

                console.log(
                    `Notification created for transaction ${event.transactionId}`
                );

                // -----------------------------------------
                // 6. Send email
                // -----------------------------------------

                const emailIdempotencyKey =
                    `transaction-notification-${event.eventId}`;

                await sendEmail(
                    userEmail,
                    emailSubject,
                    emailHtml,
                    emailIdempotencyKey
                );

                console.log(
                    `Email notification sent to ${userEmail}`
                );

                // -----------------------------------------
                // 7. Commit database transaction
                // -----------------------------------------

                await client.query("COMMIT");

                console.log(
                    `Database transaction committed for event ${event.eventId}`
                );

                // -----------------------------------------
                // 8. ACK RabbitMQ message
                // -----------------------------------------

                channel.ack(message);

                console.log(
                    `Notification event ${event.eventId} processed successfully`
                );

            } catch (error) {

                try {

                    await client.query("ROLLBACK");

                } catch (rollbackError) {

                    console.error(
                        "Rollback failed:",
                        rollbackError.message
                    );
                }

                console.error(
                    "Notification processing failed:",
                    error.message
                );

                // Requeue message for retry
                channel.nack(
                    message,
                    false,
                    true
                );

            } finally {

                client.release();
            }
        }
    );
};


module.exports = {
    startNotificationWorker
};