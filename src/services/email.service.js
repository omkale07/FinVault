const {
    resend,
    EMAIL_FROM
} = require("../config/email");

const sendEmail = async (
    to,
    subject,
    html,
    idempotencyKey
) => {

    const { data, error } =
        await resend.emails.send(
            {
                from: EMAIL_FROM,
                to: [to],
                subject,
                html
            },
            {
                idempotencyKey
            }
        );

    if (error) {

        throw new Error(
            `Email sending failed: ${error.message}`
        );
    }

    console.log(
        `Email sent successfully: ${data.id}`
    );

    return data;
};


module.exports = {
    sendEmail
};