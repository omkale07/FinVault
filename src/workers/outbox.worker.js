const {
    connectRabbitMQ,
    getRabbitChannel
} = require("../config/rabbitmq");

const {
    getPendingOutboxEvents,
    markOutboxEventPublished
} = require("../repositories/outbox.repository");

const pool = require("../config/db");


const EXCHANGE_NAME =
    "finvault_transaction_events";


const sleep = (milliseconds) => {
    return new Promise(resolve =>
        setTimeout(resolve, milliseconds)
    );
};


const startOutboxWorker = async () => {

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

    console.log(
        "FinVault Outbox Worker started..."
    );

    while (true) {

        const client = await pool.connect();

        try {

            // Start database transaction
            await client.query("BEGIN");

            // Get pending events and lock them
            const events =
                await getPendingOutboxEvents(
                    client,
                    100
                );

            if (events.length === 0) {

                await client.query("ROLLBACK");

                await sleep(2000);

                continue;
            }

            for (const event of events) {

                console.log(
                    `Publishing outbox event ${event.id}`
                );

                // Create RabbitMQ message
                const message = Buffer.from(
                    JSON.stringify({
                        eventId: event.id,
                        eventType: event.event_type,
                        ...event.payload
                    })
                );

                // Publish event
                channel.publish(
                    EXCHANGE_NAME,
                    event.routing_key,
                    message,
                    {
                        persistent: true,
                        contentType:
                            "application/json"
                    }
                );

                // Mark as published in the
                // same PostgreSQL transaction
                await markOutboxEventPublished(
                    event.id,
                    client
                );

                console.log(
                    `Outbox event ${event.id} published successfully`
                );
            }

            // Commit database changes
            await client.query("COMMIT");

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
                "Outbox worker error:",
                error.message
            );

            await sleep(2000);

        } finally {

            client.release();
        }
    }
};


module.exports = {
    startOutboxWorker
};