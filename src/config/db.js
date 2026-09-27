const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: Number(
        process.env.DB_IDLE_TIMEOUT || 30000
    ),
    connectionTimeoutMillis: Number(
        process.env.DB_CONNECTION_TIMEOUT || 5000
    )
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error);
});

module.exports = pool;