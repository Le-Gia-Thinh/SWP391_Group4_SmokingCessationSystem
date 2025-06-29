const { sql, dbConfig } = require('../config/database');

exports.createTopic = async (req, res) => {
  try {
    const { title, description } = req.body;
    const creatorId = req.user.id;

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('creator_id', sql.Int, creatorId)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .query(`INSERT INTO CHAT_TOPIC (creator_id, title, description) VALUES (@creator_id, @title, @description)`);

    res.status(201).json({ message: 'Chủ đề đã tạo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi tạo chủ đề' });
  }
};

exports.getTopics = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT t.*, u.full_name FROM CHAT_TOPIC t
      JOIN CUSTOMER u ON t.creator_id = u.user_id
      ORDER BY created_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy danh sách chủ đề' });
  }
};

exports.sendTopicMessage = async (req, res) => {
  try {
    const { topic_id, content } = req.body;
    const userId = req.user.id;

    const pool = await sql.connect(dbConfig);

    // Lấy thông tin user để emit
    const userQuery = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('SELECT full_name FROM CUSTOMER WHERE user_id = @user_id');

    const userName = userQuery.recordset[0]?.full_name || 'Ẩn danh';

    // Sử dụng OUTPUT INSERTED để lấy bản ghi vừa lưu
    const result = await pool.request()
      .input('topic_id', sql.Int, topic_id)
      .input('user_id', sql.Int, userId)
      .input('content', sql.NVarChar, content)
      .query(`INSERT INTO TOPIC_MESSAGE (topic_id, user_id, content) OUTPUT INSERTED.* VALUES (@topic_id, @user_id, @content)`);
    const inserted = result.recordset[0];

    // Emit real-time message với sent_at từ DB
    if (req.io) {
      req.io.emit('topicMessage', {
        topic_id: topic_id,
        user_id: userId,
        full_name: userName,
        content: inserted.content,
        sent_at: inserted.sent_at // Lấy từ DB
      });
    }

    res.status(201).json({ message: 'Gửi tin nhắn thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi gửi tin nhắn' });
  }
};

exports.getTopicMessages = async (req, res) => {
  try {
    const topicId = req.params.topicId;
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('topic_id', sql.Int, topicId)
      .query(`
        SELECT m.*, u.full_name FROM TOPIC_MESSAGE m
        JOIN CUSTOMER u ON m.user_id = u.user_id
        WHERE m.topic_id = @topic_id
        ORDER BY sent_at ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy tin nhắn chủ đề' });
  }
};
