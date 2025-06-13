// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, dbConfig } = require('../config/database');

// Hàm tạo JWT token dựa trên object user (id, email, name, avatar)
const generateToken = (userData) => {
  return jwt.sign(
    {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || userData.user_role
      //avatar: userData.avatar || null // nếu bạn muốn kèm avatar
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};
// Gửi response kèm token và thông tin user
const sendTokenWithUser = (res, user) => {
  // user trả về từ DB có { user_id, email, full_name }
  const token = generateToken({
    id: user.user_id || user.id,
    email: user.email,
    name: user.full_name || user.name,
    //avatar: user.avatar_url || null 
  });
  res.json({
    success: true,
    token,
    user: {
      id: user.user_id || user.id,
      email: user.email,
      name: user.full_name || user.name,
      //avatar: user.avatar_url || null
    }
  });
};

// Đăng ký người dùng mới
const register = async (req, res) => {
  try {
    const { email, password, name, phone_number} = req.body;
    
    // Kiểm tra rỗng
    if (!email?.trim() || !password?.trim() || !name?.trim() || !phone_number?.trim())  {
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
      .input('created', sql.Date, new Date())
      .query(`
          INSERT INTO CUSTOMER (email, password_hash, full_name, username, phone_number, user_role, account_status, registration_date)
          OUTPUT INSERTED.user_id
          VALUES (@email, @password, @name, @username, @phone_number,@role, @status, @created)
        `);

    const userId = insertResult.recordset[0].user_id;

    await pool.request()
  .input('user_id', sql.Int, userId)
  .input('provider', sql.VarChar, 'local')
  .input('username', sql.VarChar, username)
  .input('password_hash', sql.VarChar, hashedPassword)
  .query(`
    INSERT INTO USER_LOGIN (user_id, login_provider, username, password_hash)
    VALUES (@user_id, @provider, @username, @password_hash)
  `);

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
      return res.status(400).json({ success: false, message: 'Vui lòng điền email và mật khẩu' });
    }

    // Tìm user theo email
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM CUSTOMER WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = result.recordset[0];
    const stored = user.password_hash; // có thể là hash của bcrypt hoặc plain‐text (khi bạn test)

    let isMatch = false;

    // Nếu stored bắt đầu bằng "$2a$" / "$2b$" / "$2y$" → dùng bcrypt.compare
    if (typeof stored === 'string' && (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$'))) {
      isMatch = await bcrypt.compare(password, stored);
    } else {
      // Ngược lại, giả sử đây là plain‐text password, so sánh thẳng
      isMatch = (password === stored);
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    // Nếu match thì gửi token
    sendTokenWithUser(res, user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
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
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      // Nếu trong database bạn lưu avatarUrl, gán vào đây:
      // avatar: user.avatar  (nếu bảng CUSTOMER có field này)
    });

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