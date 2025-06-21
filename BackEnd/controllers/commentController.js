// controllers/commentController.js
const { sql, dbConfig } = require('../config/database');

exports.createComment = async (req, res) => {
  try {
    const { post_id, content, parent_comment_id } = req.body;
    const userId = req.user.id;

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('post_id', sql.Int, post_id)
      .input('user_id', sql.Int, userId)
      .input('content', sql.NVarChar, content)
      .input('parent_comment_id', sql.Int, parent_comment_id || null)
      .query(`
        INSERT INTO POST_COMMENT (post_id, user_id, content, created_at, parent_comment_id)
        VALUES (@post_id, @user_id, @content, GETDATE(), @parent_comment_id)
      `);

    res.status(201).json({ success: true, message: 'Bình luận đã được thêm' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server khi thêm bình luận' });
  }
};

exports.getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('post_id', sql.Int, postId)
      .query(`
        SELECT c.*, u.full_name FROM POST_COMMENT c
        LEFT JOIN CUSTOMER u ON c.user_id = u.user_id
        WHERE c.post_id = @post_id
        ORDER BY c.created_at ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bình luận' });
  }
};