// controllers/chatController.js
const { sql, dbConfig } = require('../config/database');
const upload = require('../utils/chatUpload');

// Gửi tin nhắn
exports.sendMessage = (req, res) => {
  upload(req, res, async function (err) {
    if (err) return res.status(400).json({ message: 'Lỗi khi upload tệp' });

    try {
      const senderId = req.user.id;
      const sessionId = req.params.session_id;
      const message = req.body.message?.trim() || '';
      const fileUrl = req.file ? `/uploads/chat/${req.file.filename}` : null;

      if (!message && !fileUrl) {
        return res.status(400).json({ message: 'Phải có tin nhắn hoặc tệp đính kèm' });
      }

      const pool = await sql.connect(dbConfig);

      const sessionQuery = await pool.request()
        .input('session_id', sql.Int, sessionId)
        .input('senderId', sql.Int, senderId)
        .query(`
          SELECT * FROM COACHING_SESSION
          WHERE session_id = @session_id AND session_status = 'accepted'
            AND (user_id = @senderId OR coach_id IN (SELECT coach_id FROM COACH WHERE user_id = @senderId))
        `);

      if (!sessionQuery.recordset.length) {
        return res.status(403).json({ message: 'Không được phép gửi tin nhắn' });
      }

      // Giới hạn thời gian chat
      const session = sessionQuery.recordset[0];
      const now = new Date();
      const start = new Date(session.scheduled_time);
      const end = new Date(start.getTime() + session.duration_minutes * 60000);
      const allowedStart = new Date(start.getTime() - 15 * 60000);
      const allowedEnd = new Date(end.getTime() + 15 * 60000);

      if (now < allowedStart || now > allowedEnd) {
        return res.status(403).json({ message: 'Chỉ được chat trong khung giờ tư vấn' });
      }

      await pool.request()
        .input('session_id', sql.Int, sessionId)
        .input('sender_id', sql.Int, senderId)
        .input('sender_role', sql.VarChar, req.user.role)
        .input('message', sql.NVarChar, message)
        .input('file_url', sql.NVarChar, fileUrl)
        .input('is_read', sql.Bit, 0)
        .query(`
          INSERT INTO DIRECT_MESSAGE (session_id, sender_id, sender_role, message, file_url, is_read)
          VALUES (@session_id, @sender_id, @sender_role, @message, @file_url, @is_read)
        `);

      // Nếu dùng socket.io:
      if (req.io) {
        req.io.to(sessionId).emit('receiveMessage', {
          session_id: sessionId,
          sender_id: senderId,
          message,
          file_url: fileUrl,
          sent_at: new Date().toISOString()
        });
      }

      res.json({ success: true, message: 'Đã gửi tin nhắn' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi gửi tin nhắn' });
    }
  });
};

// Lấy tin nhắn theo session_id, hỗ trợ phân trang
exports.getMessages = async (req, res) => {
  try {
    const sessionId = req.params.session_id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const before = req.query.before;

    const pool = await sql.connect(dbConfig);
    const request = pool.request()
      .input('session_id', sql.Int, sessionId)
      .input('limit', sql.Int, limit)
      .input('offset', sql.Int, offset);

    let query = `
      SELECT message_id, session_id, sender_id, sender_role, message, file_url, sent_at, is_read
      FROM DIRECT_MESSAGE
      WHERE session_id = @session_id
    `;

    if (before) {
      request.input('before', sql.DateTime, new Date(before));
      query += ` AND sent_at < @before`;
    }

    query += ` ORDER BY sent_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    const result = await request.query(query);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('❌ Lỗi khi lấy tin nhắn:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi truy xuất tin nhắn' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const sessionId = req.params.session_id;
    const userId = req.user.id;

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('session_id', sql.Int, sessionId)
      .input('user_id', sql.Int, userId)
      .query(`
        UPDATE DIRECT_MESSAGE
        SET is_read = 1
        WHERE session_id = @session_id
          AND sender_id <> @user_id
          AND is_read = 0
      `);

    res.json({ success: true, message: 'Đã đánh dấu là đã đọc' });
  } catch (err) {
    console.error('❌ Lỗi khi đánh dấu đã đọc:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi đánh dấu đã đọc' });
  }
};