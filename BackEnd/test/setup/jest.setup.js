// test/setup/jest.setup.js
const { setupTestData, checkDatabaseConnection } = require('./database-setup');

// Global setup before all tests
beforeAll(async () => {
    // Increase timeout for database operations
    jest.setTimeout(30000);

    // Check database connection
    const dbReady = await checkDatabaseConnection();
    if (!dbReady) {
        throw new Error('Database connection failed - cannot run tests');
    }

    // Setup test data
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
        console.warn('⚠️ Test data setup failed - some tests may fail');
    }
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Ensure environment variables are set for tests
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
}

if (!process.env.PAYOS_CHECKSUM_KEY) {
    process.env.PAYOS_CHECKSUM_KEY = 'test-checksum-key-for-testing-only';
}

if (!process.env.CLIENT_URL) {
    process.env.CLIENT_URL = 'http://localhost:5173';
}

console.log('🧪 Jest setup completed');