// middleware/auth.js
const jwt = require('jsonwebtoken');
const { sql, dbConfig } = require('../config/database');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

// Middleware xác thực JWT và kiểm tra user tồn tại trong DB
const auth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');

    // Kiểm tra token có tồn tại không
    if (!token) {
      return res.status(401).json({ message: 'Token không tồn tại, quyền truy cập bị từ chối' });
    }

    // Nếu token có dạng "Bearer <token>", tách lấy phần token
    if (typeof token === 'string' && token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }

    // Xác thực token với JWT_SECRET
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    // Kết nối DB và tìm user theo id trong payload token
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, decoded.id)
      .query('SELECT user_id AS id, email, full_name AS name, user_role AS role, NULL AS avatar FROM CUSTOMER WHERE user_id = @id');

    // Nếu user không tồn tại, từ chối truy cập
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc user không tồn tại' });
    }

    // Gán thông tin user cho req để các middleware hoặc controller sau dùng
    req.user = result.recordset[0];

    // Nếu user là coach, lấy thêm coach_id
    if (req.user.role === 'coach') {
      const coachResult = await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .query('SELECT coach_id FROM COACH WHERE user_id = @user_id');
      if (coachResult.recordset.length > 0) {
        req.user.coach_id = coachResult.recordset[0].coach_id;
      }
    }
    next();

  } catch (error) {
    console.error('JWT Auth Error:', error);
    res.status(401).json({ message: 'Token không hợp lệ hoặc lỗi server' });
  }
};

// Middleware phân quyền: Kiểm tra role có nằm trong allowedRoles không
const authorize = (allowedRoles) => {
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
    }

    next();
  };
};

module.exports = { auth, authorize };