const app = require("./app");

const { connectRedis } = require("./config/redis");
const { connectRabbitMQ } = require("./config/rabbitmq");

const PORT = process.env.PORT;


const startServer = async () => {

    await connectRedis();

    await connectRabbitMQ();

    app.listen(PORT, () => {
        console.log(`FinVault server running on port ${PORT}`);
    });

};


startServer();