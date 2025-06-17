// controllers/memberController.js
const { sql, dbConfig } = require('../config/database');

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;s
    const {
      full_name,
      email,
      phone_number,
      date_of_birth
    } = req.body;

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('full_name', sql.NVarChar, full_name)
      .input('email', sql.VarChar, email)
      .input('phone_number', sql.VarChar, phone_number)
      .input('date_of_birth', sql.Date, date_of_birth)
      .query(`
        UPDATE CUSTOMER
        SET full_name = @full_name,
            email = @email,
            phone_number = @phone_number,
            date_of_birth = @date_of_birth
        WHERE user_id = @user_id
      `);

    res.status(200).json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('❌ Lỗi cập nhật hồ sơ:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};
