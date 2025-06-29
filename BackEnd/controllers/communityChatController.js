const { sql, dbConfig } = require('../config/database');

// Gửi tin nhắn
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;

    const pool = await sql.connect(dbConfig);

    // Lấy thông tin user để emit
    const userQuery = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('SELECT full_name FROM CUSTOMER WHERE user_id = @user_id');

    const userName = userQuery.recordset[0]?.full_name || 'Ẩn danh';

    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('content', sql.NVarChar, content)
      .query(`INSERT INTO COMMUNITY_CHAT (user_id, content) VALUES (@user_id, @content)`);

    // Emit real-time message
    if (req.io) {
      req.io.emit('communityMessage', {
        user_id: userId,
        full_name: userName,
        content: content,
        sent_at: new Date().toISOString()
      });
    }

    res.status(201).json({ success: true, message: 'Đã gửi tin nhắn' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi gửi tin nhắn' });
  }
};

// Xem tin nhắn
exports.getMessages = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT c.*, u.full_name FROM COMMUNITY_CHAT c
      JOIN CUSTOMER u ON c.user_id = u.user_id
      ORDER BY sent_at ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy tin nhắn' });
  }
};
