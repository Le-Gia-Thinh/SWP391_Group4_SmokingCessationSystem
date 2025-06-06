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
    //Khai báo các biến tái sử dụng
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const displayName = profile.displayName;

    console.log('Profile ID:', googleId);
    console.log('Profile Email:', email);
    console.log('Profile Name:', displayName);

    const pool = await sql.connect(dbConfig);

    // Tìm user email trong CUSTOMER
    const result = await pool.request()
      .input('email', sql.VarChar, profile.emails[0].value)
      .query(`SELECT user_id AS id, email, full_name AS name FROM CUSTOMER WHERE email = @email`
      );

    if (result.recordset.length > 0) {
  const user = result.recordset[0];
  console.log('✅ Existing user found:', user);

  // Kiểm tra USER_LOGIN
  const loginCheck = await pool.request()
    .input('user_id', sql.Int, user.id)
    .input('provider', sql.VarChar, 'google')
    .query('SELECT * FROM USER_LOGIN WHERE user_id = @user_id AND login_provider = @provider');

  if (loginCheck.recordset.length === 0) {
    // Insert mới nếu chưa có
    await pool.request()
      .input('user_id', sql.Int, user.id)
      .input('google_id', sql.VarChar, googleId)
      .input('provider', sql.VarChar, 'google')
      .query(`INSERT INTO USER_LOGIN (user_id, login_provider, google_id)
              VALUES (@user_id, @provider, @google_id)`);
    console.log('✅ USER_LOGIN inserted for existing user.');
  } else {
    // Update google_id nếu cần
    await pool.request()
      .input('user_id', sql.Int, user.id)
      .input('google_id', sql.VarChar, googleId)
      .input('provider', sql.VarChar, 'google')
      .query(`UPDATE USER_LOGIN SET google_id = @google_id
              WHERE user_id = @user_id AND login_provider = @provider`);
    console.log('🔄 USER_LOGIN updated.');
  }

  //Trả về user
  return done(null, {
    id: user.id,
    email: user.email,
    name: user.name || displayName
    // avatar: userFromDb.avatar_url // nếu có
  });
    }

    // Nếu chưa có user, tạo mới trong database
    console.log('🆕 Creating new user...');
    const username = profile.emails[0].value.split('@')[0];

    // Tránh trùng username
    const checkUsername = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT COUNT(*) AS count FROM CUSTOMER WHERE username = @username');
    if (checkUsername.recordset[0].count > 0) {
      username += '_' + Math.floor(Math.random() * 10000);
    }

    // Insert CUSTOMER
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
    console.log('✅ New CUSTOMER created:', newUserId);

    //Insert USER_LOGIN
    await pool.request()
      .input('user_id', sql.Int, newUserId)
      .input('google_id', sql.VarChar, profile.id)
      .input('provider', sql.VarChar, 'google')
      .query(`
        INSERT INTO USER_LOGIN (user_id, login_provider, google_id)
        VALUES (@user_id, @provider, @google_id)
      `);
    console.log('✅ New user created:', newUserId);

    return done(null, {
      id: newUserId,
      email: email,
      name: displayName
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