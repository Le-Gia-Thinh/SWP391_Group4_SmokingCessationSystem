// routes/ftnd.js
const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/database');

// Kiểm tra xem người dùng đã có ftnd_level chưa
router.get('/exists/:userId', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input('user_id', sql.Int, req.params.userId)
      .query('SELECT ftnd_level FROM CUSTOMER WHERE user_id = @user_id');

    const level = result.recordset[0]?.ftnd_level;
    res.json({ exists: level !== null });
  } catch (err) {
    console.error('Lỗi khi kiểm tra FTND:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/result', async (req, res) => {
  const { user_id, level } = req.body;

  if (!user_id || !level) {
    return res.status(400).json({ message: 'Thiếu user_id hoặc level' });
  }

  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input('user_id', sql.Int, user_id)
      .input('level', sql.NVarChar, level)
      .query('UPDATE CUSTOMER SET ftnd_level = @level WHERE user_id = @user_id');

    res.json({ success: true, message: 'Đã cập nhật ftnd_level' });
  } catch (err) {
    console.error('Lỗi cập nhật FTND:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
module.exports = router;