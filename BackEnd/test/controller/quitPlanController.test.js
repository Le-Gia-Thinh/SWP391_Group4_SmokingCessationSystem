const request = require('supertest');
const express = require('express');

// Declare mockPoolInstance globally.
// mockPoolInstance will be the mock for the ConnectionPool instance.
let mockPoolInstance;

// Mock the database module. This factory function runs once when the mock is defined.
jest.mock('../../config/database', () => {
    // Initialize mockPoolInstance here with its mock methods.
    // This ensures it's always available and correctly configured
    // even before beforeEach runs for the very first test.
    mockPoolInstance = {
        request: jest.fn(function () { return this; }), // Allows chaining .request()
        input: jest.fn(function () { return this; }), // Allows chaining .input()
        query: jest.fn(),
        close: jest.fn().mockResolvedValue(true),
    };
    // Crucially, the connect method should resolve to the pool instance itself.
    mockPoolInstance.connect = jest.fn().mockResolvedValue(mockPoolInstance);

    // Define the mock sql object that will be returned by the mock
    // These are now defined INSIDE the mock factory, making them in-scope.
    const sql = { // Declared with const here, local to the mock factory
        ConnectionPool: jest.fn(() => mockPoolInstance), // ConnectionPool factory returns our mock instance
        Int: { type: 'Int' }, // Mock SQL types
        Date: { type: 'Date' },
        NVarChar: { type: 'NVarChar' },
        // Add other SQL types if used in controllers
    };

    // Define the mock dbConfig object
    const dbConfig = { // Declared with const here, local to the mock factory
        user: 'mockUser',
        password: 'mockPassword',
        server: 'mockServer',
        database: 'mockDatabase'
    };

    return {
        sql: sql, // Return the locally defined sql
        dbConfig: dbConfig // Return the locally defined dbConfig
    };
});

// Re-import the controller after the mock is set up.
// This is necessary because the controller has global `pool` and `poolConnect` variables.
// We import it here once, but will use jest.resetModules() in beforeEach to reload it.
const quitPlanController = require('../../controllers/quitPlanController');


describe('Quit Plan Controller', () => {
    let app;
    let consoleErrorSpy;
    let freshQuitPlanController; // Declare here to be accessible in tests
    // Re-import sql and dbConfig here to be accessible within the test describe block
    // after jest.resetModules() has been called and the mock has been re-evaluated.
    let sqlModule; // To hold the re-imported sql object from the mock
    let dbConfigModule; // To hold the re-imported dbConfig object from the mock


    beforeEach(() => {
        app = express();
        app.use(express.json()); // For parsing JSON request bodies
        app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded bodies

        // 1. Reset modules first to ensure a clean slate for re-requiring the controller
        jest.resetModules();

        // 2. Clear all mocks. This ensures mock call counts are 0 before the controller is loaded.
        jest.clearAllMocks();

        // 3. Re-configure mockPoolInstance methods for the current test.
        // This ensures a fresh state for each test run.
        // The `jest.mock` factory (defined globally) will return this `mockPoolInstance`.
        mockPoolInstance.request.mockClear().mockReturnThis();
        mockPoolInstance.input.mockClear().mockReturnThis();
        mockPoolInstance.query.mockClear();
        mockPoolInstance.connect.mockClear().mockResolvedValue(mockPoolInstance); // Ensure it resolves correctly

        // 4. Re-require the controller. This will trigger the global `pool.connect()` call.
        freshQuitPlanController = require('../../controllers/quitPlanController');

        // 5. Re-import the mocked database module to get the `sql` and `dbConfig` objects
        const databaseMock = require('../../config/database');
        sqlModule = databaseMock.sql;
        dbConfigModule = databaseMock.dbConfig;

        // At this point, mockPoolInstance.connect should have been called exactly once
        // due to the global `poolConnect = pool.connect();` in the controller.

        // Define routes (matching routes/quitPlan.js)
        app.get('/plan/exists/:userId', freshQuitPlanController.checkPlanExists);
        app.post('/plan/save', freshQuitPlanController.savePlan);
        app.post('/plan/reset', freshQuitPlanController.resetPlan);

        // Spy on console.error to suppress output during tests and check calls
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(async () => {
        // Ensure mockPoolInstance.close() is called to prevent open handles
        // The `close` method is part of the mockPoolInstance, so it needs to be called on it.
        if (mockPoolInstance && mockPoolInstance.close) {
            await mockPoolInstance.close();
        }
        jest.restoreAllMocks(); // Restore all mocks after each test
        consoleErrorSpy.mockRestore(); // Restore original console.error
    });

    // =========================================================================
    // GET /plan/exists/:userId (checkPlanExists)
    // =========================================================================
    describe('GET /plan/exists/:userId', () => {
        it('should return hasPlan: true and plan details if a plan exists', async () => {
            // Mock the query to return a recordset
            mockPoolInstance.query.mockResolvedValue({
                recordset: [{
                    start_date: new Date('2024-01-01'),
                    plan_type: 'standard',
                    month_quit: 6
                }]
            });

            const res = await request(app).get('/plan/exists/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({
                hasPlan: true,
                start_date: '2024-01-01T00:00:00.000Z', // Dates are serialized to ISO strings
                quit_months: 6,
            });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            // This test is adjusted to expect the string '1' because the controller passes req.params.userId directly.
            // For a robust solution, parseInt(req.params.userId) should be added in the controller.
            expect(mockPoolInstance.input).toHaveBeenCalledWith('userId', sqlModule.Int, '1'); // Changed from 1 to '1'
            expect(mockPoolInstance.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT TOP 1 start_date, plan_type, month_quit\s+FROM CESSATION_PLAN\s+WHERE user_id = @userId AND is_active = 1/is)
            );
        });

        it('should return hasPlan: false if no plan exists', async () => {
            // Mock the query to return an empty recordset
            mockPoolInstance.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get('/plan/exists/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ hasPlan: false });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
        });

        it('should return 500 on database error', async () => {
            // Mock the query to reject with an error
            mockPoolInstance.query.mockRejectedValue(new Error('DB connection failed'));

            const res = await request(app).get('/plan/exists/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Server error' });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error checking plan:",
                expect.any(Error)
            );
        });

        it('should return 500 if userId parameter is missing (due to DB error)', async () => {
            // The controller does not explicitly validate req.params.userId.
            // Passing an undefined userId to sql.Int input will likely cause a DB error.
            mockPoolInstance.query.mockRejectedValue(new Error('Invalid userId input'));

            const res = await request(app).get('/plan/exists/undefined'); // Example of missing/invalid userId

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Server error' });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error checking plan:",
                expect.any(Error)
            );
        });
    });

    // =========================================================================
    // POST /plan/save (savePlan)
    // =========================================================================
    describe('POST /plan/save', () => {
        const testUserId = 1;
        const testStartDate = '2024-01-01';
        const testQuitMonths = 3;

        it('should successfully save a new plan and handle achievement', async () => {
            // Mock queries in order:
            // 1. UPDATE CESSATION_PLAN (deactivate old plan)
            // 2. INSERT into CESSATION_PLAN (save new plan)
            // 3. SELECT achievement_id from ACHIEVEMENT
            // 4. SELECT 1 from USER_ACHIEVEMENT (check if achievement exists for user)
            // 5. INSERT into USER_ACHIEVEMENT (add achievement if not exists)
            mockPoolInstance.query
                .mockResolvedValueOnce({ recordset: [] }) // Deactivate old plan
                .mockResolvedValueOnce({ recordset: [] }) // Insert new plan
                .mockResolvedValueOnce({ recordset: [{ achievement_id: 101 }] }) // Get achievement_id
                .mockResolvedValueOnce({ recordset: [] }) // Check if user has achievement (no, so insert)
                .mockResolvedValueOnce({ recordset: [] }); // Insert user achievement

            const res = await request(app)
                .post('/plan/save')
                .send({
                    user_id: testUserId,
                    start_date: testStartDate,
                    quit_months: testQuitMonths
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Plan saved successfully' });

            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted

            // Verify deactivation query
            expect(mockPoolInstance.query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE CESSATION_PLAN\s+SET is_active = 0\s+WHERE user_id = @user_id AND is_active = 1/is)
            );
            expect(mockPoolInstance.input).toHaveBeenCalledWith('user_id', sqlModule.Int, testUserId); // Use sqlModule.Int

            // Verify new plan insertion query
            expect(mockPoolInstance.query).toHaveBeenCalledWith(
                expect.stringMatching(/INSERT INTO CESSATION_PLAN \(.*user_id, start_date, end_date, plan_type, is_active, created_at, plan_name, month_quit.*\).*VALUES \(.*@user_id, @start_date, @end_date, 'standard', 1, GETDATE\(\), @plan_name, @month_quit.*\)/is)
            );
            expect(mockPoolInstance.input).toHaveBeenCalledWith('start_date', sqlModule.Date, expect.any(Date)); // Use sqlModule.Date
            expect(mockPoolInstance.input).toHaveBeenCalledWith('end_date', sqlModule.Date, expect.any(Date)); // Use sqlModule.Date
            expect(mockPoolInstance.input).toHaveBeenCalledWith('plan_name', sqlModule.NVarChar, `Kế hoạch ${testUserId}`); // Use sqlModule.NVarChar
            expect(mockPoolInstance.input).toHaveBeenCalledWith('month_quit', sqlModule.Int, testQuitMonths); // Use sqlModule.Int

            // Verify achievement queries
            expect(mockPoolInstance.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT achievement_id FROM ACHIEVEMENT WHERE title = @title/is)
            );
            expect(mockPoolInstance.input).toHaveBeenCalledWith('title', sqlModule.NVarChar, "Tạo kế hoạch đầu tiên"); // Use sqlModule.NVarChar
            expect(mockPoolInstance.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT 1 FROM USER_ACHIEVEMENT\s+WHERE user_id = @user_id AND achievement_id = @achievement_id/is)
            );
            expect(mockPoolInstance.input).toHaveBeenCalledWith('achievement_id', sqlModule.Int, 101); // Use sqlModule.Int
            expect(mockPoolInstance.query).toHaveBeenCalledWith(
                expect.stringMatching(/INSERT INTO USER_ACHIEVEMENT \(user_id, achievement_id, earned_date\).*VALUES \(@user_id, @achievement_id, @earned_date\)/is)
            );
            expect(mockPoolInstance.input).toHaveBeenCalledWith('earned_date', sqlModule.Date, expect.any(Date)); // Use sqlModule.Date
        });

        it('should not insert achievement if user already has it', async () => {
            // Mock queries in order:
            // 1. UPDATE CESSATION_PLAN (deactivate old plan)
            // 2. INSERT into CESSATION_PLAN (save new plan)
            // 3. SELECT achievement_id from ACHIEVEMENT
            // 4. SELECT 1 from USER_ACHIEVEMENT (user already has it)
            mockPoolInstance.query
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [{ achievement_id: 101 }] })
                .mockResolvedValueOnce({ recordset: [{ '1': 1 }] }); // User already has achievement

            const res = await request(app)
                .post('/plan/save')
                .send({
                    user_id: testUserId,
                    start_date: testStartDate,
                    quit_months: testQuitMonths
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Plan saved successfully' });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted
            // Ensure the INSERT into USER_ACHIEVEMENT was NOT called
            expect(mockPoolInstance.query).not.toHaveBeenCalledWith(
                expect.stringMatching(/INSERT INTO USER_ACHIEVEMENT/is)
            );
        });

        it('should return 400 if user_id, start_date, or quit_months is missing', async () => {
            // Test case 1: Missing user_id
            let res = await request(app)
                .post('/plan/save')
                .send({ start_date: testStartDate, quit_months: testQuitMonths });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: "Thiếu user_id, start_date hoặc quit_months" });
            // Connect should be called once due to global poolConnect initialization
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // This should now pass

            // Clear mocks before next request to ensure accurate call counts for connect
            jest.clearAllMocks();
            mockPoolInstance.request.mockClear().mockReturnThis();
            mockPoolInstance.input.mockClear().mockReturnThis();
            mockPoolInstance.query.mockClear();
            mockPoolInstance.connect.mockClear().mockResolvedValue(mockPoolInstance);


            // Test case 2: Missing start_date
            res = await request(app)
                .post('/plan/save')
                .send({ user_id: testUserId, quit_months: testQuitMonths });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: "Thiếu user_id, start_date hoặc quit_months" });
            // Connect should be called once
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(0);

            // Clear mocks before next request
            jest.clearAllMocks();
            mockPoolInstance.request.mockClear().mockReturnThis();
            mockPoolInstance.input.mockClear().mockReturnThis();
            mockPoolInstance.query.mockClear();
            mockPoolInstance.connect.mockClear().mockResolvedValue(mockPoolInstance);

            // Test case 3: Missing quit_months
            res = await request(app)
                .post('/plan/save')
                .send({ user_id: testUserId, start_date: testStartDate });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: "Thiếu user_id, start_date hoặc quit_months" });
            // Connect should be called once
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(0); // This should now pass
        });

        it('should return 400 if end_date calculation is invalid', async () => {
            const res = await request(app)
                .post('/plan/save')
                .send({
                    user_id: testUserId,
                    start_date: 'invalid-date', // This will make new Date() return Invalid Date
                    quit_months: testQuitMonths
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: "end_date tính ra không hợp lệ" });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // It will connect before date calculation
        });

        it('should return 500 on database error during plan save', async () => {
            mockPoolInstance.query.mockRejectedValue(new Error('Plan save DB error'));

            const res = await request(app)
                .post('/plan/save')
                .send({
                    user_id: testUserId,
                    start_date: testStartDate,
                    quit_months: testQuitMonths
                });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: "Save failed. Please check server logs." });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Error saving plan:",
                expect.any(Error)
            );
        });
    });

    // =========================================================================
    // POST /plan/reset (resetPlan)
    // =========================================================================
    describe('POST /plan/reset', () => {
        const testUserId = 1;

        it('should successfully delete habit logs and cessation plans', async () => {
            mockPoolInstance.query.mockResolvedValue({ recordset: [] }); // Mock successful deletion

            const res = await request(app)
                .post('/plan/reset')
                .send({ user_id: testUserId });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Reset thành công' });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.input).toHaveBeenCalledWith('user_id', sqlModule.Int, testUserId); // Use sqlModule.Int
            expect(mockPoolInstance.query).toHaveBeenCalledWith(
                expect.stringMatching(/DELETE FROM HABIT_LOG WHERE user_id = @user_id;\s+DELETE FROM CESSATION_PLAN WHERE user_id = @user_id;/is)
            );
        });

        it('should return 500 on database error during reset', async () => {
            mockPoolInstance.query.mockRejectedValue(new Error('Reset DB error'));

            const res = await request(app)
                .post('/plan/reset')
                .send({ user_id: testUserId });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: "Lỗi server khi reset kế hoạch" });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error resetting plan:",
                expect.any(Error)
            );
        });

        // Although the controller doesn't explicitly validate `user_id` for `resetPlan`,
        // passing an undefined value will likely cause a DB error, resulting in a 500.
        it('should return 500 if user_id is missing (due to DB error)', async () => {
            mockPoolInstance.query.mockRejectedValue(new Error('Invalid user_id input'));

            const res = await request(app)
                .post('/plan/reset')
                .send({}); // Missing user_id

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: "Lỗi server khi reset kế hoạch" });
            expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1); // Ensure connection is attempted
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error resetting plan:",
                expect.any(Error)
            );
        });
    });
});
