// middleware/auth.js
const jwt = require('jsonwebtoken');
const { sql, dbConfig } = require('../config/database');

const auth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');

    // Kiểm tra token có tồn tại không
    if (!token) {
      return res.status(401).json({ message: 'Token không tồn tại, quyền truy cập bị từ chối' });
    }

    // Nếu có prefix 'Bearer ', loại bỏ
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kết nối và truy vấn SQL Server (mssql)
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, decoded.id)
      .query('SELECT user_id AS id, email, full_name AS name, NULL AS avatar FROM CUSTOMER WHERE user_id = @id');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc user không tồn tại' });
    }

    // Lưu thông tin user vào request
    req.user = result.recordset[0];
    next();
  } catch (error) {
    console.error('JWT Auth Error:', error);
    res.status(401).json({ message: 'Token không hợp lệ hoặc lỗi server' });
  }
};

module.exports = auth;
