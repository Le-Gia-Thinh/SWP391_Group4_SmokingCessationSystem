const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sendResetEmail = require('../utils/mailer');


const { sql, dbConfig } = require('../config/database');

// ✅ Hàm kiểm tra user có tồn tại theo email
const checkUserExists = async (email) => {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query('SELECT * FROM CUSTOMER WHERE email = @email');
  return result.recordset[0]; // trả về user hoặc undefined
};


// ✅ Bạn phải khai báo hàm trước khi export
const requestResetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('📩 Email gửi reset:', email);

    const token = crypto.randomBytes(32).toString('hex');
    const resetLink = `http://localhost:5173/reset-password/${token}`;

    // ✅ Lưu token vào DB
    await saveResetToken(token, email);

    // ✅ Gửi email thật nếu bạn muốn (nếu chưa có thì log ra)
    await sendResetEmail(email, resetLink);
    console.log('🔗 Reset link:', resetLink);

    return res.json({ message: 'Đã gửi link reset (tạm thời)', resetLink });

  } catch (err) {
    console.error('❌ Lỗi trong requestResetPassword:', err);
    res.status(500).json({ message: 'Lỗi server trong reset password' });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const tokenData = await getTokenInfo(token);
  if (!tokenData || tokenData.used || tokenData.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  await updatePassword(tokenData.email, newPassword);
  await markTokenUsed(token);

  res.json({ message: 'Đặt lại mật khẩu thành công' });
};

// Lưu token reset vào bảng RESET_TOKENS
const saveResetToken = async (token, email) => {
  const pool = await sql.connect(dbConfig);
  const user = await checkUserExists(email);
  if (!user) {
  console.error(`❌ Email không thuộc tài khoản local: ${email}`);
  throw new Error('Không hỗ trợ reset password cho tài khoản Google');
}

  const expiresAt = new Date(Date.now() + 3600000); // 1h
  await pool.request()
    .input('user_id', sql.Int, user.user_id)
    .input('token', sql.VarChar, token)
    .input('expires_at', sql.DateTime, expiresAt)
    .query(`INSERT INTO RESET_TOKENS (user_id, token, expires_at) VALUES (@user_id, @token, @expires_at)`);
};

const getTokenInfo = async (token) => {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('token', sql.VarChar, token)
    .query(`SELECT t.*, c.email FROM RESET_TOKENS t JOIN CUSTOMER c ON t.user_id = c.user_id WHERE t.token = @token`);
  return result.recordset[0];
};

const markTokenUsed = async (token) => {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input('token', sql.VarChar, token)
    .query(`UPDATE RESET_TOKENS SET used = 1 WHERE token = @token`);
};

const updatePassword = async (email, newPassword) => {
  const hashed = await bcrypt.hash(newPassword, 10);
  const pool = await sql.connect(dbConfig);

  // Check tài khoản local có tồn tại không
  const check = await pool.request()
    .input('email', sql.VarChar, email)
    .query(`SELECT * FROM CUSTOMER
            WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = @email)
              AND login_provider = 'local'`);

  if (check.recordset.length === 0) {
    console.error("❌ Không tìm thấy tài khoản local để cập nhật mật khẩu");
    throw new Error("Không thể cập nhật mật khẩu – tài khoản không phải local");
  }

  // Update password
  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .input('hashed', sql.VarChar, hashed)
    .query(`UPDATE CUSTOMER 
      SET password_hash = @hashed
      WHERE user_id = (SELECT user_id FROM CUSTOMER WHERE email = @email)
        AND login_provider = 'local'`);

  console.log("✅ UPDATE thành công, rowsAffected =", result.rowsAffected);
};

// ✅ Export đúng cách
module.exports = {
  requestResetPassword,
  resetPassword
};
