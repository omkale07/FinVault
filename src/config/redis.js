const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on("error", (error) => {
    console.error("Redis Error:", error);
});

const connectRedis = async () => {

    if (redisClient.isOpen) {
        return;
    }

    await redisClient.connect();

    console.log("Redis connected successfully");
};

module.exports = {
    redisClient,
    connectRedis
};