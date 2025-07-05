require('dotenv').config();

module.exports = {
  bin: process.env.VIETQR_BIN,              // ví dụ "970415"
  accountNo: process.env.VIETQR_ACCOUNT_NO, // ví dụ "0903672620"
  accountName: process.env.VIETQR_ACCOUNT_NAME, // "LE GIA THINH"
  templateId: process.env.VIETQR_TEMPLATE_ID    // "6O4ZJrg"
};