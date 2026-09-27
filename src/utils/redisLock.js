const crypto = require("crypto");

const { redisClient } = require("../config/redis");

const acquireLock = async (key, ttlSeconds = 10) => {

    const token = crypto.randomUUID();

    const result = await redisClient.set(
        key,
        token,
        {
            NX: true,
            EX: ttlSeconds
        }
    );

    if (result !== "OK") {
        return null;
    }

    return token;
};

const releaseLock = async (key, token) => {

    const script = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        else
            return 0
        end
    `;

    return await redisClient.eval(script, {
        keys: [key],
        arguments: [token]
    });
};

module.exports = {
    acquireLock,
    releaseLock
};