const amqp = require("amqplib");

let connection;
let channel;

const connectRabbitMQ = async (retries = 10, delay = 2000) => {
    if (channel) return;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            connection = await amqp.connect(process.env.RABBITMQ_URL);
            channel = await connection.createChannel();

            console.log("RabbitMQ connected successfully");
            return;
        } catch (error) {
            console.error(
                `RabbitMQ connection attempt ${attempt}/${retries} failed`
            );

            if (attempt === retries) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};

const getRabbitChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ channel is not initialized");
    }

    return channel;
};

module.exports = {
    connectRabbitMQ,
    getRabbitChannel
};