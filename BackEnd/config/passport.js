const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { sql, dbConfig } = require('./database');

const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
console.log('JWT_SECRET:', jwtSecret);

// Xây dựng URL callback Google OAuth dựa trên biến môi trường SERVER_URL
const baseUrl = (process.env.SERVER_URL || '').replace(/\/+$/, '');
const callbackPath = '/api/auth/google/callback';
const callbackURL = `${baseUrl}${callbackPath}`; // SỬA: thêm backticks
console.log('Google Callback URL:', callbackURL);

/**
 * JWT Strategy: Xác thực người dùng bằng token JWT
 */
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret
}, async (payload, done) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, payload.id)
      .query(`SELECT user_id AS id, email, full_name AS name, NULL AS avatar FROM CUSTOMER WHERE user_id = @id`);

    if (result.recordset.length > 0) {
      return done(null, result.recordset[0]);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

/**
 * Google OAuth Strategy: Đăng nhập bằng Google OAuth 2.0
 */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('=== GOOGLE STRATEGY CALLED ===');
    console.log('Profile ID:', profile.id);
    console.log('Profile Email:', profile.emails[0].value);
    console.log('Profile Name:', profile.displayName);
    //const googleAvatar = profile.photos && profile.photos.length > 0
    // ? profile.photos[0].value
    // : null;
    const pool = await sql.connect(dbConfig);

    // 1. Kiểm tra xem user đã tồn tại trong CUSTOMER chưa (theo email)
    const result = await pool.request()
      .input('email', sql.VarChar, profile.emails[0].value)
      .query(`SELECT * FROM CUSTOMER WHERE email = @email`);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('✅ Existing user found:', user.user_id);

      // 2. Cập nhật full_name nếu có thay đổi
      await pool.request()
        .input('id', sql.Int, user.user_id)
        .input('name', sql.VarChar, profile.displayName)
        .query(`
          UPDATE CUSTOMER
          SET full_name = @name
          WHERE user_id = @id
        `);

      // 3. Kiểm tra USER_LOGIN theo user_id
      const loginResult = await pool.request()
        .input('user_id', sql.Int, user.user_id)
        .query(`SELECT * FROM USER_LOGIN WHERE user_id = @user_id`);

      if (loginResult.recordset.length > 0) {
        // Nếu đã tồn tại, cập nhật google_id
        await pool.request()
          .input('user_id', sql.Int, user.user_id)
          .input('google_id', sql.VarChar, profile.id)
          .query(`UPDATE USER_LOGIN SET google_id = @google_id WHERE user_id = @user_id`);
      } else {
        // Nếu chưa tồn tại, tạo mới bản ghi USER_LOGIN
        await pool.request()
          .input('user_id', sql.Int, user.user_id)
          .input('username', sql.VarChar, profile.emails[0].value.split('@')[0])
          .input('login_provider', sql.VarChar, 'google')
          .input('google_id', sql.VarChar, profile.id)
          .input('created', sql.DateTime, new Date())
          .query(`
            INSERT INTO USER_LOGIN (user_id, username, login_provider, google_id, created_at)
            VALUES (@user_id, @username, @login_provider, @google_id, @created)
          `);
      }

      return done(null, {
        id: user.user_id,
        email: user.email,
        name: user.full_name || profile.displayName,
        role: user.user_role
        //avatar: userFromDb.avatar_url 
      });
    }

    // Nếu chưa có user, tạo mới trong database
    console.log('🆕 Creating new user...');

    let username = profile.emails[0].value.split('@')[0];

    // Kiểm tra username đã tồn tại chưa
    const checkUsername = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT 1 FROM CUSTOMER WHERE username = @username');

    if (checkUsername.recordset.length > 0) {
      username = `${username}_${Date.now()}`; // thêm thời gian để tránh trùng
    }

    const insertResult = await pool.request()
      .input('email', sql.VarChar, profile.emails[0].value)
      .input('name', sql.VarChar, profile.displayName)
      .input('username', sql.VarChar, username)
      .input('status', sql.VarChar, 'active')
      .input('role', sql.VarChar, 'member')
      .input('created', sql.DateTime, new Date())
      .query(`
        INSERT INTO CUSTOMER (email, full_name, username, account_status, user_role, registration_date)
        OUTPUT INSERTED.user_id
        VALUES (@email, @name, @username, @status, @role, @created)
      `);

    const newUserId = insertResult.recordset[0].user_id;
    console.log('✅ New user created:', newUserId);

    // Tạo bản ghi USER_LOGIN tương ứng
    await pool.request()
      .input('user_id', sql.Int, newUserId)
      .input('username', sql.VarChar, username)
      .input('login_provider', sql.VarChar, 'google')
      .input('google_id', sql.VarChar, profile.id)
      .input('created', sql.DateTime, new Date())
      .query(`
        INSERT INTO USER_LOGIN (user_id, username, login_provider, google_id, created_at)
        VALUES (@user_id, @username, @login_provider, @google_id, @created)
      `);

    return done(null, {
      id: newUserId,
      email: profile.emails[0].value,
      name: profile.displayName,
      role: 'member'
    });

  } catch (error) {
    console.error('❌ Google Strategy Error:', error);
    return done(error, null);
  }
}));

/**
 * Serialize User: Lưu user ID vào session
 */
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

/**
 * Deserialize User: Lấy thông tin user từ session ID
 */
passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user ID:', id);
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT user_id AS id, email, full_name AS name FROM CUSTOMER WHERE user_id = @id`);

    if (result.recordset.length > 0) {
      console.log('✅ User deserialized:', result.recordset[0]);
      done(null, result.recordset[0]);
    } else {
      console.log('❌ User not found for ID:', id);
      done(null, false);
    }
  } catch (error) {
    console.error('❌ Deserialize error:', error);
    done(error, false);
  }
});

// Debug info
console.log('=== PASSPORT CONFIG LOADED ===');
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('Callback URL:', callbackURL);

module.exports = passport;
