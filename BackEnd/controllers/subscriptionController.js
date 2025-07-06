const { sql, dbConfig } = require('../config/database');

exports.getAllPackages = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`SELECT * FROM SUBSCRIPTION_PACKAGE`);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách gói:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách gói' });
  }
};
