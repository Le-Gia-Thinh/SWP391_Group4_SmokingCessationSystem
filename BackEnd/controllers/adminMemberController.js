const { sql, dbConfig } = require('../config/database');
const bcrypt = require('bcrypt');

// 1. Lấy danh sách Member
exports.getAllMembers = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        user_id, username, full_name, email, phone_number, account_status,
        date_of_birth, registration_date
      FROM CUSTOMER
      WHERE user_role = 'member' AND account_status != 'deleted'
      ORDER BY created_at DESC
    `);
    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách member:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách member' });
  }
};

// 2. Cập nhật thông tin Member
exports.updateMember = async (req, res) => {
  const { user_id } = req.params;
  const { full_name, phone_number, email, date_of_birth, account_status } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('full_name', sql.NVarChar, full_name)
      .input('phone_number', sql.VarChar, phone_number)
      .input('email', sql.VarChar, email)
      .input('date_of_birth', sql.Date, date_of_birth)
      .input('account_status', sql.NVarChar, account_status)
      .query(`
        UPDATE CUSTOMER
        SET full_name = @full_name,
            phone_number = @phone_number,
            email = @email,
            date_of_birth = @date_of_birth,
            account_status = @account_status
        WHERE user_id = @user_id AND user_role = 'member'
      `);
    res.status(200).json({ success: true, message: 'Cập nhật member thành công' });
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật member:', error);
    res.status(500).json({ success: false, message: 'Cập nhật member thất bại' });
  }
};

// 3. Khóa Member
exports.lockMember = async (req, res) => {
  const { user_id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        UPDATE CUSTOMER SET account_status = 'inactive'
        WHERE user_id = @user_id AND user_role = 'member'
      `);
    res.status(200).json({ success: true, message: 'Đã khóa tài khoản member' });
  } catch (error) {
    console.error('❌ Lỗi khi khóa member:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi khóa tài khoản member' });
  }
};

// 4. Mở khóa Member
exports.unlockMember = async (req, res) => {
  const { user_id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        UPDATE CUSTOMER SET account_status = 'active'
        WHERE user_id = @user_id AND user_role = 'member'
      `);
    res.status(200).json({ success: true, message: 'Đã mở khóa tài khoản member' });
  } catch (error) {
    console.error('❌ Lỗi khi mở khóa member:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi mở khóa tài khoản member' });
  }
};

// 5. Xóa mềm Member
exports.softDeleteMember = async (req, res) => {
  const { user_id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        UPDATE CUSTOMER SET account_status = 'banned'
        WHERE user_id = @user_id AND user_role = 'member'
      `);
    res.status(200).json({ success: true, message: 'Đã xóa member (soft delete)' });
  } catch (error) {
    console.error('❌ Lỗi khi xóa member:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa member' });
  }
};
