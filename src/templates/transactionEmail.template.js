const formatAmount = (amount, currency) => {
    return `${Number(amount).toFixed(2)} ${currency}`;
};


const getTransactionLabel = (type) => {

    switch (type) {

        case "DEPOSIT":
            return "Deposit";

        case "WITHDRAW":
            return "Withdrawal";

        case "TRANSFER":
            return "Transfer";

        case "REFUND":
            return "Refund";

        case "REVERSAL":
            return "Reversal";

        default:
            return "Transaction";
    }
};


const getTransactionDescription = (
    type,
    status
) => {

    if (status === "COMPLETED") {

        switch (type) {

            case "DEPOSIT":
                return "The amount has been credited to your wallet successfully.";

            case "WITHDRAW":
                return "The amount has been debited from your wallet successfully.";

            case "TRANSFER":
                return "Your transfer has been completed successfully.";

            case "REFUND":
                return "The refund has been credited to your wallet successfully.";

            case "REVERSAL":
                return "The transaction has been reversed successfully.";

            default:
                return "Your transaction has been completed successfully.";
        }
    }


    if (status === "FAILED") {

        switch (type) {

            case "DEPOSIT":
                return "Your deposit could not be completed.";

            case "WITHDRAW":
                return "Your withdrawal could not be completed.";

            case "TRANSFER":
                return "Your transfer could not be completed.";

            case "REFUND":
                return "Your refund could not be completed.";

            case "REVERSAL":
                return "Your transaction reversal could not be completed.";

            default:
                return "Your transaction could not be completed.";
        }
    }


    return "There has been an update to your transaction.";
};


const formatDateTime = (createdAt) => {

    if (!createdAt) {
        return "N/A";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
};


const createTransactionEmailTemplate = ({
    type,
    status,
    amount,
    currency,
    transactionId,
    walletId,
    reason,
    createdAt
}) => {

    const transactionLabel =
        getTransactionLabel(type);

    const description =
        getTransactionDescription(
            type,
            status
        );

    const formattedAmount =
        formatAmount(
            amount,
            currency
        );

    const formattedDateTime =
        formatDateTime(createdAt);

    const statusText =
        status === "COMPLETED"
            ? "COMPLETED"
            : "FAILED";


    const reasonRow =
        status === "FAILED" && reason
            ? `
                <tr>
                    <td style="
                        padding: 10px 0;
                        color: #555555;
                        font-size: 14px;
                        border-top: 1px solid #e5e7eb;
                        vertical-align: top;
                    ">
                        Reason
                    </td>

                    <td style="
                        padding: 10px 0;
                        color: #111827;
                        font-size: 14px;
                        text-align: right;
                        border-top: 1px solid #e5e7eb;
                        vertical-align: top;
                    ">
                        ${reason}
                    </td>
                </tr>
            `
            : "";


    return `
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        FinVault Transaction Alert
    </title>

</head>


<body style="
    margin: 0;
    padding: 0;
    background-color: #ffffff;
    font-family: Arial, Helvetica, sans-serif;
    color: #111827;
">


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>

<tr>

<td align="center">


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        max-width: 620px;
    "
>


<!-- HEADER -->

<tr>

<td style="
    padding: 24px 20px 18px 20px;
    border-bottom: 2px solid #111827;
">

    <div style="
        font-size: 22px;
        font-weight: 700;
        color: #111827;
    ">
        FinVault
    </div>

    <div style="
        margin-top: 5px;
        font-size: 13px;
        color: #6b7280;
    ">
        Transaction Alert
    </div>

</td>

</tr>


<!-- MAIN CONTENT -->

<tr>

<td style="
    padding: 28px 20px;
">


<p style="
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
">

    ${transactionLabel} ${status === "COMPLETED" ? "completed" : "failed"}

</p>


<p style="
    margin: 0 0 24px 0;
    font-size: 14px;
    line-height: 1.6;
    color: #4b5563;
">

    ${description}

</p>


<!-- AMOUNT -->

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        margin-bottom: 25px;
    "
>

<tr>

<td style="
    padding: 15px 0;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
">

    <div style="
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 5px;
    ">
        Transaction Amount
    </div>

    <div style="
        font-size: 24px;
        font-weight: 700;
        color: #111827;
    ">
        ${formattedAmount}
    </div>

</td>

</tr>

</table>


<!-- DETAILS -->

<div style="
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 8px;
">

    Transaction Details

</div>


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>


<tr>

<td style="
    padding: 10px 0;
    color: #555555;
    font-size: 14px;
">

    Transaction Type

</td>

<td style="
    padding: 10px 0;
    color: #111827;
    font-size: 14px;
    font-weight: 600;
    text-align: right;
">

    ${transactionLabel}

</td>

</tr>


<tr>

<td style="
    padding: 10px 0;
    color: #555555;
    font-size: 14px;
    border-top: 1px solid #e5e7eb;
">

    Status

</td>

<td style="
    padding: 10px 0;
    color: #111827;
    font-size: 14px;
    font-weight: 600;
    text-align: right;
    border-top: 1px solid #e5e7eb;
">

    ${statusText}

</td>

</tr>


<tr>

<td style="
    padding: 10px 0;
    color: #555555;
    font-size: 14px;
    border-top: 1px solid #e5e7eb;
">

    Transaction ID

</td>

<td style="
    padding: 10px 0;
    color: #111827;
    font-size: 14px;
    text-align: right;
    border-top: 1px solid #e5e7eb;
">

    #${transactionId}

</td>

</tr>


<tr>

<td style="
    padding: 10px 0;
    color: #555555;
    font-size: 14px;
    border-top: 1px solid #e5e7eb;
">

    Wallet ID

</td>

<td style="
    padding: 10px 0;
    color: #111827;
    font-size: 14px;
    text-align: right;
    border-top: 1px solid #e5e7eb;
">

    #${walletId}

</td>

</tr>


<tr>

<td style="
    padding: 10px 0;
    color: #555555;
    font-size: 14px;
    border-top: 1px solid #e5e7eb;
">

    Date & Time

</td>

<td style="
    padding: 10px 0;
    color: #111827;
    font-size: 14px;
    text-align: right;
    border-top: 1px solid #e5e7eb;
">

    ${formattedDateTime}

</td>

</tr>


${reasonRow}


</table>


<!-- SECURITY / INFORMATION NOTE -->

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        margin-top: 28px;
        border-top: 1px solid #e5e7eb;
    "
>

<tr>

<td style="
    padding-top: 18px;
    font-size: 13px;
    line-height: 1.6;
    color: #6b7280;
">

    This is an automated transaction notification from
    FinVault. If you did not authorize this transaction,
    please review your account immediately.

</td>

</tr>

</table>


</td>

</tr>


<!-- FOOTER -->

<tr>

<td style="
    padding: 18px 20px 25px 20px;
    border-top: 1px solid #e5e7eb;
    font-size: 12px;
    line-height: 1.5;
    color: #9ca3af;
">

    FinVault<br>
    This is an automated email. Please do not reply.

</td>

</tr>


</table>


</td>

</tr>

</table>


</body>

</html>
`;
};


module.exports = {
    createTransactionEmailTemplate
};