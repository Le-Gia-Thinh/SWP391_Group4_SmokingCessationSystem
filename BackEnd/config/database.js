//config/database.js
require('dotenv').config(); // Load biến môi trường từ .env
const sql = require('mssql');

// Cấu hình kết nối đến SQL Server
const dbConfig = {
  user: process.env.DB_USER,              // Tên user database
  password: process.env.DB_PASSWORD,      // Mật khẩu database
  server: process.env.DB_HOST,            // Địa chỉ server database
  database: process.env.DB_NAME,          // Tên database
  options: {
    encrypt: false,                       // Nếu kết nối tới Azure, cần true
    trustServerCertificate: true         // Cho phép dùng chứng chỉ tự ký (self-signed)
  }
};

module.exports = { sql, dbConfig };