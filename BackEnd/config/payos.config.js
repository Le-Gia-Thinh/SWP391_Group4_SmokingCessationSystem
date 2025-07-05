require('dotenv').config();

module.exports = {

    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    partnerCode: process.env.PAYOS_PARTNER_CODE,
    returnUrl: process.env.PAYOS_RETURN_URL || `${process.env.CLIENT_URL}/payment/success`,
    cancelUrl: process.env.PAYOS_CANCEL_URL || `${process.env.CLIENT_URL}/payment/cancel`
};