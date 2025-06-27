require('dotenv').config();

module.exports = {
    vnpay: {
        url: process.env.VNPAY_URL,
        tmnCode: process.env.VNPAY_TMNCODE,
        hashSecret: process.env.VNPAY_HASHSECRET,
        returnUrl: process.env.VNPAY_RETURNURL,
    },

    momo: {
        endpoint: process.env.MOMO_ENDPOINT,
        partnerCode: process.env.MOMO_PARTNER_CODE,
        accessKey: process.env.MOMO_ACCESS_KEY,
        secretKey: process.env.MOMO_SECRET_KEY,
        returnUrl: process.env.MOMO_RETURN_URL,
        notifyUrl: process.env.MOMO_NOTIFY_URL,
    },

    creditcard: {
        stripeSecretKey: process.env.STRIPE_SECRET_KEY,
        stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    }
};