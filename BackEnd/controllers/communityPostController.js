// controllers/communityPostController.js
const { sql, dbConfig } = require('../config/database');

exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .query(`
        INSERT INTO COMMUNITY_POST (user_id, title, content, created_at)
        VALUES (@user_id, @title, @content, GETDATE())
      `);

    res.status(201).json({ success: true, message: 'Tạo bài viết thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo bài viết' });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .query(`
        SELECT p.*, c.full_name FROM COMMUNITY_POST p
        LEFT JOIN CUSTOMER c ON p.user_id = c.user_id
        ORDER BY created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bài viết' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content } = req.body;
    const userId = req.user.id;

    const pool = await sql.connect(dbConfig);

    const post = await pool.request()
      .input('id', sql.Int, postId)
      .query('SELECT * FROM COMMUNITY_POST WHERE post_id = @id');

    if (!post.recordset.length || post.recordset[0].user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa bài viết này' });
    }

    await pool.request()
      .input('id', sql.Int, postId)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .query(`
        UPDATE COMMUNITY_POST
        SET title = @title, content = @content, last_updated = GETDATE()
        WHERE post_id = @id
      `);

    res.json({ message: 'Cập nhật bài viết thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật bài viết' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const pool = await sql.connect(dbConfig);

    const post = await pool.request()
      .input('id', sql.Int, postId)
      .query('SELECT * FROM COMMUNITY_POST WHERE post_id = @id');

    if (!post.recordset.length || post.recordset[0].user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này' });
    }

    await pool.request()
      .input('id', sql.Int, postId)
      .query('DELETE FROM COMMUNITY_POST WHERE post_id = @id');

    res.json({ message: 'Đã xóa bài viết' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi xóa bài viết' });
  }
};