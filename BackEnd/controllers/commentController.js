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

exports.updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, commentId)
      .query(`SELECT * FROM POST_COMMENT WHERE comment_id = @id`);

    const comment = result.recordset[0];
    if (!comment) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa bình luận này' });
    }

    await pool.request()
      .input('id', sql.Int, commentId)
      .input('content', sql.NVarChar, content)
      .query(`UPDATE POST_COMMENT SET content = @content WHERE comment_id = @id`);

    res.json({ message: 'Đã cập nhật bình luận' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật bình luận' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, commentId)
      .query(`SELECT * FROM POST_COMMENT WHERE comment_id = @id`);

    const comment = result.recordset[0];
    if (!comment) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận' });
    }

    // Admin xóa được tất cả, Member/Coach chỉ xóa của mình
    if (userRole !== 'admin' && comment.user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này' });
    }

    await pool.request()
      .input('id', sql.Int, commentId)
      .query(`DELETE FROM POST_COMMENT WHERE comment_id = @id`);

    res.json({ message: 'Đã xóa bình luận' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi xóa bình luận' });
  }
};