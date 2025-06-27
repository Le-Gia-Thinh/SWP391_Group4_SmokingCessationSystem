
// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, dbConfig } = require('../config/database');

// Hàm tạo JWT token
const generateToken = (userData) => {
  return jwt.sign(
    {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || userData.user_role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Gửi token + user về client
const sendTokenWithUser = (res, user) => {
  const token = generateToken({
    id: user.user_id || user.id,
    email: user.email,
    name: user.full_name || user.name,
    role: user.user_role || user.role
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.user_id || user.id,
      email: user.email,
      name: user.full_name || user.name,
      role: user.user_role || user.role
    }
  });
};

// Đăng ký người dùng mới
const register = async (req, res) => {
  try {
    const { email, password, name, phone_number } = req.body;

    // Kiểm tra rỗng
    if (!email?.trim() || !password?.trim() || !name?.trim() || !phone_number?.trim()) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra dữ liệu đầu vào
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }
    // Kiểm tra định dạng số điện thoại
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
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
    const username = email.split('@')[0]; // tạo username từ email

    // Thêm user mới vào DB
    const insertResult = await pool.request()
      .input('email', sql.VarChar, email)
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, hashedPassword)
      .input('name', sql.VarChar, name)
      .input('phone_number', sql.VarChar, phone_number)
      .input('role', sql.VarChar, 'member')
      .input('status', sql.VarChar, 'active')
      .input('provider', sql.VarChar, 'local')
      .input('created', sql.Date, new Date())
      .query(`
        INSERT INTO CUSTOMER (email, password_hash, full_name, username, phone_number, user_role, account_status, login_provider, registration_date)
        OUTPUT INSERTED.user_id
        VALUES (@email, @password, @name, @username, @phone_number, @role, @status, @provider, @created)
      `);

    const userId = insertResult.recordset[0].user_id;

    const token = generateToken({
      id: userId,
      email,
      name
    });


    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        name,
        role: 'member'
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
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Vui lòng điền email và mật khẩu' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
    SELECT 
      user_id, 
      full_name, 
      email, 
      user_role, 
      password_hash 
    FROM CUSTOMER
    WHERE email = @email
  `);
    if (result.recordset.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = result.recordset[0];
    const stored = user.password_hash;

    // Chỉ so sánh qua bcrypt.compare
    let isMatch;
    if (typeof stored === 'string' && stored.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, stored);
    } else {
      isMatch = password === stored;
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }
    // Nếu đúng, trả token
    sendTokenWithUser(res, user);
  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
};

//Lấy dữ liệu người dùng khi đăng nhập
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
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      // Nếu trong database bạn lưu avatarUrl, gán vào đây:
      // avatar: user.avatar  (nếu bảng CUSTOMER có field này)
    });

    console.log('✅ User found:', { id: user.id, email: user.email, name: user.name, role: user.role });
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

  // Nếu session tồn tại, destroy nó và xóa cookie
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đăng xuất' });
      }
      // Xóa cookie session (mặc định tên connect.sid)
      res.clearCookie('connect.sid');
      return res.json({ success: true, message: 'Đã đăng xuất thành công' });
    });
  } else {
    // Nếu không có session (ví dụ user login bằng JWT-only), trả về thành công
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
