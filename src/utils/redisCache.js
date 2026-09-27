const { redisClient } = require("../config/redis");


const getCache = async (key) => {

    const value = await redisClient.get(key);

    return value;
};


const setCache = async (
    key,
    value,
    ttlSeconds = 30
) => {

    await redisClient.set(
        key,
        JSON.stringify(value),
        {
            EX: ttlSeconds
        }
    );
};


const deleteCache = async (key) => {

    await redisClient.del(key);
};


module.exports = {
    getCache,
    setCache,
    deleteCache
};