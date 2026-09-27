const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
    throw new Error(
        "RESEND_API_KEY is not configured"
    );
}

const resend = new Resend(
    process.env.RESEND_API_KEY
);

const EMAIL_FROM = process.env.EMAIL_FROM;

module.exports = {
    resend,
    EMAIL_FROM
};