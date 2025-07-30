// controllers/chatController.js
const { sql, dbConfig } = require('../config/database');
const upload = require('../utils/chatUpload');

// Lấy tin nhắn theo thread_id
exports.getMessagesByThreadId = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const threadId = parseInt(req.params.thread_id);

    if (!threadId) {
      return res.status(400).json({ message: 'Thiếu thread_id' });
    }

    const pool = await sql.connect(dbConfig);

    // Kiểm tra quyền truy cập vào thread
    let accessCheckQuery = '';
    if (role === 'coach') {
      const coachRes = await pool.request()
        .input('user_id', sql.Int, userId)
        .query('SELECT coach_id FROM COACH WHERE user_id = @user_id');
      const coachId = coachRes.recordset[0]?.coach_id;

      accessCheckQuery = `
        SELECT thread_id FROM DIRECT_CHAT_THREAD 
        WHERE thread_id = @thread_id AND coach_id = ${coachId}
      `;
    } else if (role === 'member') {
      accessCheckQuery = `
        SELECT thread_id FROM DIRECT_CHAT_THREAD 
        WHERE thread_id = @thread_id AND member_id = @user_id
      `;
    } else {
      return res.status(403).json({ message: 'Vai trò không hợp lệ' });
    }

    const accessCheck = await pool.request()
      .input('thread_id', sql.Int, threadId)
      .input('user_id', sql.Int, userId)
      .query(accessCheckQuery);

    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xem tin nhắn trong thread này' });
    }

    // Lấy tin nhắn theo thread_id
    const result = await pool.request()
      .input('thread_id', sql.Int, threadId)
      .query(`
        SELECT message_id, thread_id, sender_id, sender_role, message, file_url, sent_at, is_read
        FROM DIRECT_MESSAGE
        WHERE thread_id = @thread_id
        ORDER BY sent_at ASC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('❌ Lỗi khi lấy tin nhắn theo thread_id:', err);
    res.status(500).json({ message: 'Lỗi server khi truy xuất tin nhắn' });
  }
};

// Gửi tin nhắn hỗ trợ liên tục (Guided Support)
exports.sendGuidedMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const message = req.body.message?.trim() || '';
    const fileUrl = req.file ? `/uploads/chat/${req.file.filename}` : null;

    // Có thể nhận thread_id trực tiếp từ frontend
    let threadId = req.body.thread_id ? parseInt(req.body.thread_id) : null;
    // Vẫn giữ recipientId để tương thích ngược
    const recipientId = req.body.recipient_id ? parseInt(req.body.recipient_id) : null;

    if (!message && !fileUrl) {
      return res.status(400).json({ message: 'Phải có tin nhắn hoặc tệp đính kèm' });
    }

    if (!threadId && !recipientId) {
      return res.status(400).json({ message: 'Phải có thread_id hoặc recipient_id' });
    }

    const pool = await sql.connect(dbConfig);

    // Nếu có threadId, kiểm tra người dùng có quyền gửi tin nhắn trong thread không
    if (threadId) {
      // Kiểm tra quyền truy cập vào thread
      let accessCheckQuery = '';
      if (senderRole === 'coach') {
        const coachRes = await pool.request()
          .input('user_id', sql.Int, senderId)
          .query('SELECT coach_id FROM COACH WHERE user_id = @user_id');
        const coachId = coachRes.recordset[0]?.coach_id;

        accessCheckQuery = `
          SELECT thread_id FROM DIRECT_CHAT_THREAD 
          WHERE thread_id = @thread_id AND coach_id = ${coachId}
        `;
      } else if (senderRole === 'member') {
        accessCheckQuery = `
          SELECT thread_id FROM DIRECT_CHAT_THREAD 
          WHERE thread_id = @thread_id AND member_id = @user_id
        `;
      }

      const accessCheck = await pool.request()
        .input('thread_id', sql.Int, threadId)
        .input('user_id', sql.Int, senderId)
        .query(accessCheckQuery);

      if (accessCheck.recordset.length === 0) {
        return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong thread này' });
      }
    } else {
      // Phương thức cũ: sử dụng recipientId
      let coachId, memberId;
      if (senderRole === 'coach') {
        const coachRes = await pool.request().input('user_id', sql.Int, senderId)
          .query(`SELECT coach_id FROM COACH WHERE user_id = @user_id`);
        coachId = coachRes.recordset[0]?.coach_id;
        memberId = recipientId;
      } else if (senderRole === 'member') {
        coachId = recipientId;
        memberId = senderId;
      } else {
        return res.status(403).json({ message: 'Vai trò không hợp lệ' });
      }

      // 🔁 Chỉ lấy thread_id, không tạo mới nữa
      const existingThread = await pool.request()
        .input('member_id', sql.Int, memberId)
        .input('coach_id', sql.Int, coachId)
        .query(`SELECT thread_id FROM DIRECT_CHAT_THREAD WHERE member_id = @member_id AND coach_id = @coach_id`);

      if (existingThread.recordset.length === 0) {
        return res.status(400).json({ message: 'Chưa có box chat giữa 2 người này. Vui lòng đặt lịch trước.' });
      }
      threadId = existingThread.recordset[0].thread_id;
    }

    // 💬 Gửi tin nhắn
    const result = await pool.request()
      .input('thread_id', sql.Int, threadId)
      .input('sender_id', sql.Int, senderId)
      .input('sender_role', sql.VarChar, senderRole)
      .input('message', sql.NVarChar, message)
      .input('file_url', sql.NVarChar, fileUrl)
      .input('is_read', sql.Bit, 0)
      .query(`
        INSERT INTO DIRECT_MESSAGE (thread_id, sender_id, sender_role, message, file_url, is_read, sent_at)
        OUTPUT INSERTED.*
        VALUES (@thread_id, @sender_id, @sender_role, @message, @file_url, @is_read, GETDATE())
      `);

    const inserted = result.recordset[0];

    if (req.io) {
      // Gửi toàn bộ dữ liệu từ record để frontend có đầy đủ thông tin
      const messageData = {
        message_id: inserted.message_id,
        thread_id: threadId,
        sender_id: senderId,
        sender_role: senderRole,
        message: inserted.message,
        file_url: inserted.file_url,
        sent_at: inserted.sent_at,
        is_read: inserted.is_read,
        _socketId: req.body._socketId // Truyền lại socketId nếu frontend gửi lên
      };
      
      // Broadcast đến tất cả client trong room
      req.io.to(`chat-${threadId}`).emit('receiveGuidedMessage', messageData);
      
      // Thông báo có tin nhắn mới với cả hai phía 
      // (Giúp update UI cho cả người đang không mở chat screen)
      req.io.emit('newChatMessage', {
        thread_id: threadId,
        sender_id: senderId,
        sender_role: senderRole,
        message_preview: inserted.message ? 
          (inserted.message.length > 30 ? inserted.message.substring(0, 30) + '...' : inserted.message) : 
          (inserted.file_url ? '[File đính kèm]' : ''),
        timestamp: inserted.sent_at
      });
    }

    res.json({ success: true, message: 'Đã gửi tin nhắn', data: inserted });

  } catch (err) {
    console.error('❌ Lỗi gửi tin nhắn:', err);
    res.status(500).json({ message: 'Lỗi server khi gửi tin nhắn' });
  }
};


// Tìm thread_id dựa trên coach_id
exports.findThreadByCoach = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const coachId = parseInt(req.params.coach_id);

    if (!coachId) {
      return res.status(400).json({ success: false, message: 'Thiếu coach_id' });
    }

    const pool = await sql.connect(dbConfig);
    let memberId = userId; // Mặc định userId là member_id

    // Tìm thread_id từ database
    const threadRes = await pool.request()
      .input('member_id', sql.Int, memberId)
      .input('coach_id', sql.Int, coachId)
      .query(`SELECT thread_id FROM DIRECT_CHAT_THREAD WHERE member_id = @member_id AND coach_id = @coach_id`);

    if (threadRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thread cho coach này' });
    }

    const threadId = threadRes.recordset[0].thread_id;
    return res.json({ success: true, thread_id: threadId });

  } catch (err) {
    console.error('❌ Lỗi khi tìm thread_id:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tìm thread_id' });
  }
};

// Lấy toàn bộ tin nhắn của box chat coach–member
exports.getGuidedMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const partnerId = parseInt(req.params.partner_id); // người còn lại trong cuộc trò chuyện

    const pool = await sql.connect(dbConfig);
    let coachId, memberId;

    if (role === 'coach') {
      const coachRes = await pool.request().input('user_id', sql.Int, userId)
        .query('SELECT coach_id FROM COACH WHERE user_id = @user_id');
      coachId = coachRes.recordset[0]?.coach_id;
      memberId = partnerId;
    } else if (role === 'member') {
      coachId = partnerId;
      memberId = userId;
    } else {
      return res.status(403).json({ message: 'Vai trò không hợp lệ' });
    }

    const threadRes = await pool.request()
      .input('member_id', sql.Int, memberId)
      .input('coach_id', sql.Int, coachId)
      .query(`SELECT thread_id FROM DIRECT_CHAT_THREAD WHERE member_id = @member_id AND coach_id = @coach_id`);

    if (!threadRes.recordset.length) {
      return res.status(404).json({ message: 'Chưa có box chat nào giữa 2 người này' });
    }

    const threadId = threadRes.recordset[0].thread_id;

    const result = await pool.request()
      .input('thread_id', sql.Int, threadId)
      .query(`
        SELECT message_id, thread_id, sender_id, sender_role, message, file_url, sent_at, is_read
        FROM DIRECT_MESSAGE
        WHERE thread_id = @thread_id
        ORDER BY sent_at ASC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('❌ Lỗi khi lấy tin nhắn:', err);
    res.status(500).json({ message: 'Lỗi server khi truy xuất tin nhắn' });
  }
};

// Đánh dấu các tin chưa đọc là đã đọc
exports.markGuidedAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const threadId = parseInt(req.params.thread_id);

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('thread_id', sql.Int, threadId)
      .input('user_id', sql.Int, userId)
      .query(`
        UPDATE DIRECT_MESSAGE
        SET is_read = 1
        WHERE thread_id = @thread_id
          AND sender_id <> @user_id
          AND is_read = 0
      `);

    res.json({ success: true, message: 'Đã đánh dấu là đã đọc' });
  } catch (err) {
    console.error('❌ Lỗi khi đánh dấu đã đọc:', err);
    res.status(500).json({ message: 'Lỗi server khi đánh dấu đã đọc' });
  }
};

// Hiển thị danh sách các cuộc hội thoại
exports.getChatThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const pool = await sql.connect(dbConfig);
    let query = '';
    if (role === 'member') {
      query = `
        SELECT t.thread_id, t.coach_id, c.full_name AS coach_name, c.avatar_url,
               (SELECT TOP 1 message FROM DIRECT_MESSAGE WHERE thread_id = t.thread_id ORDER BY sent_at DESC) AS last_message,
               (SELECT TOP 1 sent_at FROM DIRECT_MESSAGE WHERE thread_id = t.thread_id ORDER BY sent_at DESC) AS last_time
        FROM DIRECT_CHAT_THREAD t
        JOIN COACH co ON t.coach_id = co.coach_id
        JOIN CUSTOMER c ON co.user_id = c.user_id
        WHERE t.member_id = @userId
        ORDER BY last_time DESC
      `;
    } else if (role === 'coach') {
      const coachRes = await pool.request().input('user_id', sql.Int, userId)
        .query('SELECT coach_id FROM COACH WHERE user_id = @user_id');
      const coachId = coachRes.recordset[0]?.coach_id;

      query = `
        SELECT t.thread_id, t.member_id, c.full_name AS member_name, c.avatar_url,
               (SELECT TOP 1 message FROM DIRECT_MESSAGE WHERE thread_id = t.thread_id ORDER BY sent_at DESC) AS last_message,
               (SELECT TOP 1 sent_at FROM DIRECT_MESSAGE WHERE thread_id = t.thread_id ORDER BY sent_at DESC) AS last_time
        FROM DIRECT_CHAT_THREAD t
        JOIN CUSTOMER c ON t.member_id = c.user_id
        WHERE t.coach_id = ${coachId}
        ORDER BY last_time DESC
      `;
    } else {
      return res.status(403).json({ message: 'Vai trò không hợp lệ' });
    }

    const result = await pool.request().input('userId', sql.Int, userId).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách box chat:', err);
    res.status(500).json({ message: 'Lỗi server khi truy xuất danh sách box chat' });
  }
};