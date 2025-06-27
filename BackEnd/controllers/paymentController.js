// src/controllers/paymentController.js
const crypto = require('crypto');
const qs = require('qs');
const dayjs = require('dayjs');
const axios = require('axios');
const Stripe = require('stripe');

const { vnpay, momo, creditcard } = require('../config');
const stripe = Stripe(creditcard.stripeSecretKey);

exports.createPayment = async (req, res, next) => {
    try {
        const { method, amount, bankCode } = req.body;

        switch (method) {
            case 'vnpay': {
                // --- VNPay ---
                const tmnCode = vnpay.tmnCode;
                const secretKey = vnpay.hashSecret;
                const vnpUrl = vnpay.url;
                const returnUrl = vnpay.returnUrl;
                const createDate = dayjs().format('YYYYMMDDHHmmss');
                const orderId = dayjs().valueOf().toString();
                const vnpAmount = (amount || 0) * 100;

                let params = {
                    vnp_Version: '2.1.0',
                    vnp_Command: 'pay',
                    vnp_TmnCode: tmnCode,
                    vnp_Locale: 'vn',
                    vnp_CurrCode: 'VND',
                    vnp_TxnRef: orderId,
                    vnp_OrderInfo: `Thanh toan don ${orderId}`,
                    vnp_Amount: vnpAmount.toString(),
                    vnp_ReturnUrl: returnUrl,
                    vnp_IpAddr: req.ip,
                    vnp_CreateDate: createDate,
                };
                if (bankCode) params.vnp_BankCode = bankCode;

                // sort & sign
                const sorted = Object.keys(params).sort()
                    .reduce((a, k) => { a[k] = params[k]; return a; }, {});
                const signData = qs.stringify(sorted, { encode: false });
                const signature = crypto.createHmac('sha512', secretKey)
                    .update(signData)
                    .digest('hex');
                params.vnp_SecureHash = signature;

                const paymentUrl = `${vnpUrl}?${qs.stringify(params, { encode: true })}`;
                return res.json({ provider: 'vnpay', paymentUrl });
            }

            case 'momo': {
                // --- MoMo ---
                const {
                    endpoint, partnerCode, accessKey,
                    secretKey, returnUrl, notifyUrl
                } = momo;
                const requestId = partnerCode + Date.now();
                const orderId = requestId;
                const orderInfo = 'Thanh toan Premium';
                const extraData = '';
                const amt = (amount || 0).toString();

                // raw signature
                const rawSig =
                    `accessKey=${accessKey}` +
                    `&amount=${amt}` +
                    `&extraData=${extraData}` +
                    `&ipnUrl=${notifyUrl}` +
                    `&orderId=${orderId}` +
                    `&orderInfo=${orderInfo}` +
                    `&partnerCode=${partnerCode}` +
                    `&redirectUrl=${returnUrl}` +
                    `&requestId=${requestId}` +
                    `&requestType=captureWallet`;
                const signature = crypto.createHmac('sha256', secretKey)
                    .update(rawSig)
                    .digest('hex');

                const body = {
                    partnerCode, accessKey, requestId, amount: amt,
                    orderId, orderInfo, redirectUrl: returnUrl,
                    ipnUrl: notifyUrl, extraData,
                    requestType: 'captureWallet',
                    signature, lang: 'vi'
                };
                const { data } = await axios.post(endpoint, body, {
                    headers: { 'Content-Type': 'application/json' }
                });
                return res.json({ provider: 'momo', paymentUrl: data.payUrl });
            }

            case 'creditcard': {
                // --- Credit Card (Stripe) ---
                const amt = Math.round(amount || 0); // số nguyên
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amt,
                    currency: 'vnd',
                    payment_method_types: ['card'],
                });
                return res.json({
                    provider: 'creditcard',
                    clientSecret: paymentIntent.client_secret
                });
            }

            default:
                return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
        }
    } catch (err) {
        next(err);
    }
};
