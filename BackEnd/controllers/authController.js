//// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, dbConfig } = require('../config/database');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Đăng ký
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const pool = await sql.connect(dbConfig);
    const checkUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM CUSTOMER WHERE email = @email');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền email và mật khẩu' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM CUSTOMER WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = result.recordset[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = generateToken(user.user_id);

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.full_name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thông tin user
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

// Google login callback
const googleSuccess = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
    const token = generateToken(req.user.id);
    res.json({ success: true, token }); //Demo\
    //CHính thức
    // res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error('Google success error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleSuccess
};