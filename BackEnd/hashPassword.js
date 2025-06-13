// BackEnd/hashPasswords.js

const bcrypt = require('bcryptjs');
const { sql, dbConfig } = require('./config/database'); // import dbConfig mới
require('dotenv').config(); // load .env

(async () => {
    try {
        // 1) Kết nối đến database
        const pool = await sql.connect(dbConfig);
        console.log("🗄️  Kết nối DB thành công!");

        // 2) Lấy các user có password_hash chưa được băm (plain-text)
        const result = await pool.request().query(`
      SELECT user_id, password_hash
      FROM CUSTOMER
      WHERE password_hash IS NOT NULL
        AND (LEN(password_hash) < 60 OR password_hash NOT LIKE '$2%')
    `);

        const users = result.recordset;
        console.log(`🔎 Tìm thấy ${users.length} user cần hash lại.`);

        // 3) Với mỗi user, hash lại và cập nhật vào DB
        for (const row of users) {
            const { user_id, password_hash: plainPassword } = row;

            // Tạo salt và hash
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(plainPassword, salt);

            // Cập nhật lại password_hash
            await pool.request()
                .input('id', sql.Int, user_id)
                .input('newHash', sql.VarChar(200), hashed)
                .query(`
          UPDATE CUSTOMER
          SET password_hash = @newHash
          WHERE user_id = @id
        `);

            console.log(`✅ Đã hash user_id=${user_id}: "${plainPassword}" → "${hashed.slice(0, 20)}..."`);
        }

        console.log("🎉 Hoàn tất quá trình hash lại tất cả mật khẩu plain-text.");

        // 4) Đóng kết nối
        await sql.close();
        process.exit(0);

    } catch (err) {
        console.error("❌ Lỗi khi hash passwords:", err);
        process.exit(1);
    }
})();
