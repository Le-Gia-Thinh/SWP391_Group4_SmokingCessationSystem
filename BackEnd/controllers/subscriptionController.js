// controllers/subscriptionController.js - Fixed version

const { sql, dbConfig } = require('../config/database');
const dayjs = require('dayjs');

/**
 * 1. Lấy danh sách tất cả gói - FIX: Convert bit to boolean
 */
exports.getAllPackages = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        package_id,
        package_name,
        description,
        price,
        duration_days,
        CONVERT(INT, coach_access)    AS coach_access,
        CONVERT(INT, community_access) AS community_access,
        CONVERT(INT, premium_content)  AS premium_content,
        created_at
      FROM SUBSCRIPTION_PACKAGE
      ORDER BY price ASC
    `);

    const packages = result.recordset.map(pkg => ({
      package_id: pkg.package_id,
      package_name: pkg.package_name,
      description: pkg.description,
      price: pkg.price,
      duration_days: pkg.duration_days,
      coach_access: pkg.coach_access === 1,
      community_access: pkg.community_access === 1,
      premium_content: pkg.premium_content === 1,
      created_at: pkg.created_at
    }));

    res.json(packages);
  } catch (err) {
    console.error('❌ getAllPackages:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * 2. Lấy subscription hiện tại (không thay đổi logic chính)
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await sql.connect(dbConfig);

    const { recordset } = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT us.subscription_id,
               us.start_date,
               sp.duration_days,
               sp.package_name,
               p.payment_date
        FROM   USER_SUBSCRIPTION us
        JOIN   SUBSCRIPTION_PACKAGE sp
          ON sp.package_id = us.package_id
        JOIN   PAYMENT p
          ON p.subscription_id = us.subscription_id
         AND p.payment_status = 'paid'
        WHERE  us.user_id = @userId
        ORDER  BY us.start_date ASC
      `);

    if (recordset.length === 0) {
      return res.json({ success: true, subscription: null });
    }

    const subs = recordset.map(r => {
      const months = Math.floor(r.duration_days / 30);
      const remDays = r.duration_days % 30;
      return {
        start: dayjs(r.start_date),
        months,
        remDays,
        days: r.duration_days,
        name: r.package_name,
        pay: r.payment_date ? dayjs(r.payment_date) : null
      };
    });

    let currentStart = subs[0].start;
    let currentEnd = currentStart
      .add(subs[0].months, 'month')
      .add(subs[0].remDays, 'day');
    let totalDays = subs[0].days;
    let packageNames = [subs[0].name];
    let lastPay = subs[0].pay;
    const today = dayjs();

    if (currentEnd.isBefore(today)) {
      const last = subs[subs.length - 1];
      currentStart = last.start;
      currentEnd = last.start
        .add(last.months, 'month')
        .add(last.remDays, 'day');
      totalDays = last.days;
      packageNames = [last.name];
      lastPay = last.pay;
    }

    for (let i = 1; i < subs.length; i++) {
      const s = subs[i];

      if (s.start.isBefore(currentEnd) || s.start.isSame(currentEnd)) {
        currentEnd = currentEnd
          .add(s.months, 'month')
          .add(s.remDays, 'day');
        totalDays += s.days;
        packageNames.push(s.name);
      } else {
        currentStart = s.start;
        currentEnd = s.start
          .add(s.months, 'month')
          .add(s.remDays, 'day');
        totalDays = s.days;
        packageNames = [s.name];
      }

      if (s.pay && (!lastPay || s.pay.isAfter(lastPay))) {
        lastPay = s.pay;
      }
    }

    const nowMs = dayjs().valueOf();
    const endMs = currentEnd.valueOf();
    const diffMs = Math.max(0, endMs - nowMs);

    const msPerDay = 24 * 60 * 60 * 1000;
    const msPerHour = 60 * 60 * 1000;
    const msPerMinute = 60 * 1000;

    const days = Math.floor(diffMs / msPerDay);
    const hours = Math.floor((diffMs % msPerDay) / msPerHour);
    const minutes = Math.floor((diffMs % msPerHour) / msPerMinute);

    return res.json({
      success: true,
      subscription: {
        package_names: packageNames,
        total_days: totalDays,
        start_date: currentStart.toDate(),
        end_date: currentEnd.toDate(),
        last_payment_date: lastPay ? lastPay.toDate() : null,
        remaining_days: days,
        remaining_hours: hours,
        remaining_minutes: minutes
      }
    });

  } catch (err) {
    console.error('❌ getCurrentSubscription:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3. Lịch sử các subscription
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await sql.connect(dbConfig);

    const { recordset } = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          us.subscription_id,
          us.start_date,
          us.end_date,
          sp.package_name,
          p.payment_date,
          p.amount    AS paid_amount,
          p.order_code
        FROM   USER_SUBSCRIPTION us
        JOIN   SUBSCRIPTION_PACKAGE sp
          ON sp.package_id = us.package_id
        JOIN   PAYMENT p
          ON p.subscription_id = us.subscription_id
         AND p.payment_status  = 'paid'
        WHERE  us.user_id = @userId
        ORDER  BY p.payment_date DESC
      `);

    res.json({ success: true, history: recordset });
  } catch (err) {
    console.error('❌ getHistory:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * 4. Tính tổng ngày còn lại
 */
exports.getRemainingDays = async (req, res) => {
  const userId = req.user.id;
  try {
    const pool = await sql.connect(dbConfig);
    const { recordset } = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT start_date, end_date
        FROM   USER_SUBSCRIPTION
        WHERE  user_id = @userId
          AND payment_status IN ('paid','success')
          AND end_date > GETUTCDATE()
        ORDER  BY start_date
      `);

    if (!recordset.length) {
      return res.json({ remainingDays: 0 });
    }

    const today = new Date();
    let curEnd = today;
    let totalDays = 0;

    for (const { start_date, end_date } of recordset) {
      const start = new Date(start_date > today ? start_date : today);
      const end = new Date(end_date);
      if (end <= curEnd) continue;
      const from = start <= curEnd ? curEnd : start;
      totalDays += Math.ceil((end - from) / 86_400_000);
      curEnd = end;
    }

    res.json({ remainingDays: totalDays });
  } catch (err) {
    console.error('❌ getRemainingDays:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * 5. Tạo mới package - FIX: Ensure proper boolean conversion
 */
exports.createPackage = async (req, res) => {
  const {
    package_name, description, price, duration_days,
    coach_access, community_access, premium_content
  } = req.body;

  // validate…

  try {
    const pool = await sql.connect(dbConfig);

    // chuẩn hóa giá, boolean→bit
    const priceNum = Math.round(Math.abs(parseFloat(price) || 0) * 100) / 100;
    const coachBit = Boolean(coach_access);
    const communityBit = Boolean(community_access);
    const premiumBit = Boolean(premium_content);
    console.log('▶️ createPackage payload:', {
      package_name,
      duration_days,
      coach_access,
      community_access,
      premium_content
    });
    console.log('▶️ bits to SQL:', { coachBit, communityBit, premiumBit });
    const result = await pool.request()
      .input('name', sql.NVarChar, package_name.trim())
      .input('desc', sql.NVarChar, description || '')
      .input('price', sql.Decimal(10, 2), priceNum)
      .input('duration', sql.Int, duration_days)
      .input('coach', sql.Bit, coachBit)
      .input('comm', sql.Bit, communityBit)
      .input('premium', sql.Bit, premiumBit)
      .input('created_at', sql.DateTime2(0), new Date())
      .input('update_at', sql.DateTime2(0), null)
      .query(`
        INSERT INTO SUBSCRIPTION_PACKAGE
          (package_name, description, price, duration_days,
           coach_access, community_access, premium_content,
           created_at, update_at)
        VALUES
          (@name,@desc,@price,@duration,
           @coach,@comm,@premium,@created_at,@update_at)
      `);
    console.log('▶️ rowsAffected =', result.rowsAffected);
    res.json({ success: true, message: 'Package created' });
  } catch (err) {
    console.error('❌ createPackage:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * 6. Cập nhật package
 */
exports.updatePackage = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const {
    package_name, description, price, duration_days,
    coach_access, community_access, premium_content
  } = req.body;

  // validate…

  try {
    const pool = await sql.connect(dbConfig);

    // chuẩn hóa
    const priceNum = Math.round(Math.abs(parseFloat(price) || 0) * 100) / 100;
    const coachBit = Boolean(coach_access);
    const communityBit = Boolean(community_access);
    const premiumBit = Boolean(premium_content);


    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, package_name.trim())
      .input('desc', sql.NVarChar, description || '')
      .input('price', sql.Decimal(10, 2), priceNum)
      .input('duration', sql.Int, duration_days)
      .input('coach', sql.Bit, coachBit)
      .input('comm', sql.Bit, communityBit)
      .input('premium', sql.Bit, premiumBit)
      .input('update_at', sql.DateTime2(0), new Date())
      .query(`
        UPDATE SUBSCRIPTION_PACKAGE
        SET
          package_name     = @name,
          description      = @desc,
          price            = @price,
          duration_days    = @duration,
          coach_access     = @coach,
          community_access = @comm,
          premium_content  = @premium,
          update_at        = @update_at
        WHERE package_id = @id
      `);

    res.json({ success: true, message: 'Package updated' });
  } catch (err) {
    console.error('❌ updatePackage:', err);
    res.status(500).json({ message: err.message });
  }
};
/**
 * 7. Xóa package theo ID
 */
exports.deletePackage = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM SUBSCRIPTION_PACKAGE
        WHERE package_id = @id
      `);

    res.json({ success: true, message: 'Package deleted' });
  } catch (err) {
    console.error('❌ deletePackage:', err);
    res.status(500).json({ message: err.message });
  }
};