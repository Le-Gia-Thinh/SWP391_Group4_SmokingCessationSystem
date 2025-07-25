const { sql, dbConfig } = require('../../config/database');

/**
 * Setup test data for payment controller tests
 */
async function setupTestData() {
    try {
        const pool = await sql.connect(dbConfig);

        // 1. Ensure test user exists
        await pool.request()
            .input('user_id', sql.Int, 8)
            .input('username', sql.NVarChar, 'testuser')
            .input('email', sql.NVarChar, 'test@example.com')
            .input('password_hash', sql.NVarChar, 'dummy_hash')
            .input('full_name', sql.NVarChar, 'Test User')
            .input('user_role', sql.NVarChar, 'member')
            .input('account_status', sql.NVarChar, 'active')
            .input('login_provider', sql.NVarChar, 'local')
            .query(`
                IF NOT EXISTS (SELECT 1 FROM [CUSTOMER] WHERE user_id = @user_id)
                BEGIN
                    INSERT INTO [CUSTOMER] 
                    (user_id, username, email, password_hash, full_name, user_role, account_status, login_provider, registration_date)
                    VALUES (@user_id, @username, @email, @password_hash, @full_name, @user_role, @account_status, @login_provider, GETDATE())
                END
            `);

        // 2. Ensure subscription packages exist
        const packages = [
            {
                id: 1,
                name: 'Basic Package',
                description: 'Test Basic Package',
                duration: 7,
                price: 49000,
                coach: 0,
                community: 0,
                premium: 0
            },
            {
                id: 2,
                name: 'Premium Package',
                description: 'Test Premium Package',
                duration: 30,
                price: 99000,
                coach: 1,
                community: 1,
                premium: 1
            },
            {
                id: 3,
                name: 'Pro Package',
                description: 'Test Pro Package',
                duration: 90,
                price: 199000,
                coach: 1,
                community: 1,
                premium: 1
            }
        ];

        for (const pkg of packages) {
            await pool.request()
                .input('package_id', sql.Int, pkg.id)
                .input('package_name', sql.NVarChar, pkg.name)
                .input('description', sql.NVarChar, pkg.description)
                .input('duration_days', sql.Int, pkg.duration)
                .input('price', sql.Float, pkg.price)
                .input('coach_access', sql.Bit, pkg.coach)
                .input('community_access', sql.Bit, pkg.community)
                .input('premium_content', sql.Bit, pkg.premium)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM SUBSCRIPTION_PACKAGE WHERE package_id = @package_id)
                    BEGIN
                        INSERT INTO SUBSCRIPTION_PACKAGE 
                        (package_id, package_name, description, duration_days, price, coach_access, community_access, premium_content, created_at)
                        VALUES (@package_id, @package_name, @description, @duration_days, @price, @coach_access, @community_access, @premium_content, GETDATE())
                    END
                    ELSE
                    BEGIN
                        UPDATE SUBSCRIPTION_PACKAGE
                        SET package_name = @package_name,
                            description = @description,
                            duration_days = @duration_days,
                            price = @price,
                            coach_access = @coach_access,
                            community_access = @community_access,
                            premium_content = @premium_content,
                            update_at = GETDATE()
                        WHERE package_id = @package_id
                    END
                `);
        }

        console.log('✅ Test data setup completed successfully');
        return true;

    } catch (err) {
        console.error('❌ Test data setup failed:', err);
        return false;
    }
}

/**
 * Clean up test data after tests
 */
async function cleanupTestData() {
    try {
        const pool = await sql.connect(dbConfig);

        await pool.request()
            .input('user_id', sql.Int, 8)
            .query(`
                DELETE p FROM PAYMENT p
                JOIN USER_SUBSCRIPTION us ON p.subscription_id = us.subscription_id
                WHERE us.user_id = @user_id
                AND p.payment_status IN ('pending', 'failed')
                AND DATEDIFF(hour, p.payment_date, GETDATE()) < 24
            `);

        await pool.request()
            .input('user_id', sql.Int, 8)
            .query(`
                DELETE FROM USER_SUBSCRIPTION
                WHERE user_id = @user_id
                AND payment_status IN ('pending', 'failed')
                AND DATEDIFF(hour, start_date, GETDATE()) < 24
            `);

        console.log('✅ Test data cleanup completed');
        return true;

    } catch (err) {
        console.error('❌ Test data cleanup failed:', err);
        return false;
    }
}

async function checkDatabaseConnection() {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request().query('SELECT 1 as test');
        console.log('✅ Database connection successful');
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        return false;
    }
}

module.exports = {
    setupTestData,
    cleanupTestData,
    checkDatabaseConnection
};
