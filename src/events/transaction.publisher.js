const {
    getRabbitChannel
} = require("../config/rabbitmq");

const EXCHANGE_NAME = "finvault_transaction_events";

const publishTransactionEvent = async (
    routingKey,
    event
) => {

    const channel = getRabbitChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    const message = Buffer.from(
        JSON.stringify(event)
    );

    channel.publish(
        EXCHANGE_NAME,
        routingKey,
        message,
        {
            persistent: true,
            contentType: "application/json"
        }
    );

    console.log(
        `RabbitMQ event published: ${routingKey}`
    );
};

module.exports = {
    publishTransactionEvent
};