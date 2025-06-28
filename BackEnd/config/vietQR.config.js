require('dotenv').config();
module.exports = {
    bin: process.env.VIETQR_BIN,
    accountNo: process.env.VIETQR_ACCOUNT_NO,
    accountName: process.env.VIETQR_ACCOUNT_NAME,
    templateId: process.env.VIETQR_TEMPLATE_ID    // ← thêm key này
};
