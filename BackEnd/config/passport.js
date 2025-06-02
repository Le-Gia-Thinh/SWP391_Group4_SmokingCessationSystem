const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { sql, dbConfig } = require('./database');

const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
console.log('JWT_SECRET:', jwtSecret);

// Xử lý callbackURL an toàn tuyệt đối
const baseUrl = (process.env.SERVER_URL || '').replace(/\/+$/, '');
const callbackPath = '/api/auth/google/callback';
const callbackURL = `${baseUrl}${callbackPath}`;
console.log('Google Callback URL:', callbackURL);

// JWT Strategy
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

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('email', sql.VarChar, profile.emails[0].value)
      .input('google_id', sql.VarChar, profile.id)
      .query(`SELECT * FROM CUSTOMER WHERE google_id = @google_id OR email = @email`);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];

      await pool.request()
        .input('id', sql.Int, user.user_id)
        .input('google_id', sql.VarChar, profile.id)
        .input('name', sql.VarChar, profile.displayName)
        .input('provider', sql.VarChar, 'google')
        .query(`
          UPDATE CUSTOMER
          SET google_id = @google_id, full_name = @name, user_role = @provider
          WHERE user_id = @id
        `);

      return done(null, {
        id: user.user_id,
        email: user.email,
        name: user.full_name
      });
    }

    // Chưa tồn tại: chèn mới
    const username = profile.emails[0].value.split('@')[0];

    const insertResult = await pool.request()
      .input('email', sql.VarChar, profile.emails[0].value)
      .input('name', sql.VarChar, profile.displayName)
      .input('username', sql.VarChar, username)
      .input('google_id', sql.VarChar, profile.id)
      .input('status', sql.VarChar, 'active')
      .input('role', sql.VarChar, 'google')
      .input('created', sql.DateTime, new Date())
      .query(`
        INSERT INTO CUSTOMER (email, full_name, username, google_id, account_status, user_role, registration_date)
        OUTPUT INSERTED.user_id
        VALUES (@email, @name, @username, @google_id, @status, @role, @created)
      `);

    return done(null, {
      id: insertResult.recordset[0].user_id,
      email: profile.emails[0].value,
      name: profile.displayName
    });

  } catch (error) {
    console.error('Google Strategy Error:', error);
    return done(error, null);
  }
}));

// Serialize & Deserialize
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT user_id AS id, email, full_name AS name FROM CUSTOMER WHERE user_id = @id');

    if (result.recordset.length > 0) {
      done(null, result.recordset[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, false);
  }
});

module.exports = passport;
