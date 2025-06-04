// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, dbConfig } = require('../config/database');

// Hàm tạo JWT token dựa trên user id
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Gửi response kèm token và thông tin user
const sendTokenWithUser = (res, user) => {
  const token = generateToken(user.user_id || user.id);
  res.json({
    success: true,
    token,
    user: {
      id: user.user_id || user.id,
      email: user.email,
      name: user.full_name || user.name
    }
  });
};

// Đăng ký người dùng mới
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra dữ liệu đầu vào
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const pool = await sql.connect(dbConfig);

    // Kiểm tra email đã tồn tại trong DB chưa
    const checkUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM CUSTOMER WHERE email = @email');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Thêm user mới vào DB
    const insertResult = await pool.request()
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('name', sql.VarChar, name)
      .input('role', sql.VarChar, 'local')
      .input('status', sql.VarChar, 'active')
      .input('created', sql.Date, new Date())
      .query(`
        INSERT INTO CUSTOMER (email, password_hash, full_name, user_role, account_status, registration_date)
        OUTPUT INSERTED.user_id
        VALUES (@email, @password, @name, @role, @status, @created)
      `);

    const userId = insertResult.recordset[0].user_id;
    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Đăng nhập người dùng
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền email và mật khẩu' });
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const pool = await sql.connect(dbConfig);

    // Tìm user theo email
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM CUSTOMER WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = result.recordset[0];

    // So sánh mật khẩu nhập vào và mật khẩu đã mã hóa trong DB
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Trả về token và thông tin user nếu đăng nhập thành công
    sendTokenWithUser(res, user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thông tin user hiện tại (dựa trên session hoặc token đã xác thực)
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

// Callback xử lý khi đăng nhập bằng Google thành công
const googleSuccess = (req, res) => {
  console.log('=== GOOGLE SUCCESS CALLBACK ===');
  console.log('req.user:', req.user);
  console.log('CLIENT_URL:', process.env.CLIENT_URL);

  try {
    if (!req.user) {
      console.error('❌ No user in request');
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=auth_failed`;
      console.log('🔄 Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    }

    // Tạo token JWT
    const user = req.user;
    const token = generateToken(user.id);

    console.log('✅ User found:', { id: user.id, email: user.email, name: user.name });
    console.log('🔑 Generated token:', token.substring(0, 20) + '...');

    // Redirect về React route với token
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/google/redirect?token=${token}`;
    console.log('🔄 Final redirect URL:', redirectUrl);

    // QUAN TRỌNG: Sử dụng res.redirect() thay vì res.json()
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Google success error:', error);
    const errorUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=server_error`;
    return res.redirect(errorUrl);
  }
};
// Logout
const logout = (req, res) => {
  console.log('Logout called');

  // Nếu dùng session (cho Google OAuth), hủy session
  if (req.logout) {
    req.logout((err) => {
      if (err) {
        console.error('Passport logout error:', err);
      }
    });
  }

  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Lỗi server khi đăng xuất' });
      }
      // Xóa cookie session
      res.clearCookie('connect.sid');
      return res.json({ success: true, message: 'Đã đăng xuất thành công' });
    });
  } else {
    // Nếu không có session, trả về thành công
    return res.json({ success: true, message: 'Đã đăng xuất thành công' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleSuccess,
  logout,
};