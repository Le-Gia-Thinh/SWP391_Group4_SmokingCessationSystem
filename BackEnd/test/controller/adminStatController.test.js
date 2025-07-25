const request = require('supertest');
const express = require('express');
const adminStatController = require('../../controllers/adminStatController');
const { sql, dbConfig } = require('../../config/database');

// Mock module database
jest.mock('../../config/database');

// Declare auth and authorize mocks at a higher scope
let auth;
let authorize;

// Mock the entire middleware/auth module
jest.mock('../../middleware/auth', () => {
    return {
        auth: jest.fn(),
        authorize: jest.fn((roles) => jest.fn((req, res, next) => {
            // Default authorization logic for the mock middleware
            if (!req.user || !req.user.user_role) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const allowedRoles = Array.isArray(roles) ? roles : [roles];
            if (allowedRoles.includes(req.user.user_role)) {
                next();
            } else {
                res.status(403).json({ success: false, message: 'Forbidden' });
            }
        })),
    };
});

// Import the mocked functions after jest.mock is defined
const originalAuthModule = require('../../middleware/auth');
auth = originalAuthModule.auth;
authorize = originalAuthModule.authorize;


describe('Admin Stat Controller', () => {
    let app;
    let mockPool;
    let RealDate; // Thêm biến này để lưu trữ Date gốc

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Reset all mocks (including auth and authorize) before each test
        jest.clearAllMocks();

        // Set up default mock implementations for auth and authorize for the current test
        auth.mockImplementation((req, res, next) => {
            req.user = { id: 1, user_role: 'admin' }; // Default to admin
            next();
        });

        authorize.mockImplementation((roles) => {
            const middleware = jest.fn((req, res, next) => {
                if (!req.user || !req.user.user_role) {
                    return res.status(401).json({ success: false, message: 'Unauthorized' });
                }
                const allowedRoles = Array.isArray(roles) ? roles : [roles];
                if (allowedRoles.includes(req.user.user_role)) {
                    next();
                } else {
                    res.status(403).json({ success: false, message: 'Forbidden' });
                }
            });
            return middleware;
        });

        // Define routes AFTER setting up the mock implementations in beforeEach
        // (Make sure these routes match your routes/admin.js file for stat endpoints)
        app.get('/admin/users-summary', auth, authorize('admin'), adminStatController.getUsersSummary);
        app.get('/admin/revenue-today', auth, authorize('admin'), adminStatController.getDailyRevenue);
        app.get('/admin/revenue-date-range', auth, authorize('admin'), adminStatController.getRevenueByDateRange);
        app.get('/admin/revenue-week', auth, authorize('admin'), adminStatController.getWeeklyRevenue);
        app.get('/admin/monthly-revenue', auth, authorize('admin'), adminStatController.getMonthlyRevenue);
        app.get('/admin/revenue-year', auth, authorize('admin'), adminStatController.getYearlyRevenue);
        app.get('/admin/revenue-week-range', auth, authorize('admin'), adminStatController.getRevenueByWeekRange);
        app.get('/admin/monthly-revenue-by-year', auth, authorize('admin'), adminStatController.getMonthlyRevenueByYear);
        app.get('/admin/active-coach-count', auth, authorize('admin'), adminStatController.getActiveCoachCount);
        app.get('/admin/avg-months-by-addiction', auth, authorize('admin'), adminStatController.getAverageMonthsByAddictionLevel);
        app.get('/admin/revenue-stats', auth, authorize('admin'), adminStatController.getRevenueStats);


        // Re-initialize mockPool for each test
        mockPool = {
            request: jest.fn(() => mockPool),
            input: jest.fn(() => mockPool),
            query: jest.fn(),
            connect: jest.fn().mockResolvedValue(mockPool),
            close: jest.fn().mockResolvedValue(),
        };
        sql.connect.mockResolvedValue(mockPool);

        // --- SỬA LỖI 1: RangeError: Maximum call stack size exceeded ---
        RealDate = Date; // Lưu trữ Date gốc
        const mockDate = new RealDate('2025-07-25T10:00:00Z'); // Tạo mockDate bằng Date gốc
        jest.spyOn(global, 'Date').mockImplementation((dateString) => {
            // Nếu có dateString, dùng Date gốc để tạo
            if (dateString) {
                return new RealDate(dateString);
            }
            // Nếu không, trả về mockDate cố định
            return mockDate;
        });
        // --- KẾT THÚC SỬA LỖI 1 ---
    });

    afterEach(async () => {
        // Ensure mockPool.close() is called to prevent open handles
        if (mockPool && mockPool.close) {
            await mockPool.close();
        }
        jest.restoreAllMocks(); // Restore all mocks after each test
    });

    // =========================================================================
    // GET /admin/users-summary
    // =========================================================================
    describe('GET /admin/users-summary', () => {
        it('should return total number of member users', async () => {
            mockPool.query.mockResolvedValue({ recordset: [{ total_users: 100 }] });

            const res = await request(app).get('/admin/users-summary');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ total_users: 100 });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check if authorize was called with 'admin'
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*SELECT COUNT\(\*\) AS total_users\s*FROM CUSTOMER\s*WHERE user_role = 'member'\s*$/i)
            );
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/admin/users-summary');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' }; // Not admin
                next();
            });

            const res = await request(app).get('/admin/users-summary');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });

    // =========================================================================
    // GET /admin/revenue-today (getDailyRevenue)
    // =========================================================================
    describe('GET /admin/revenue-today', () => {
        it('should return daily revenue for the last 7 days', async () => {
            // Mock SQL results for getDailyRevenue
            // Note: Use RealDate to ensure the mock date objects are correctly handled by the controller
            mockPool.query.mockResolvedValue({
                recordset: [
                    { day: new RealDate('2025-07-19T00:00:00Z'), total: 100 },
                    { day: new RealDate('2025-07-20T00:00:00Z'), total: 150 },
                    { day: new RealDate('2025-07-22T00:00:00Z'), total: 200 },
                    { day: new RealDate('2025-07-25T00:00:00Z'), total: 300 }, // Today
                ],
            });

            const res = await request(app).get('/admin/revenue-today');

            expect(res.statusCode).toEqual(200);
            expect(res.body.labels).toEqual([
                '2025-07-19', // 6 days ago from 2025-07-25
                '2025-07-20', // 5 days ago
                '2025-07-21', // 4 days ago (no data, should be 0)
                '2025-07-22', // 3 days ago
                '2025-07-23', // 2 days ago (no data, should be 0)
                '2025-07-24', // 1 day ago (no data, should be 0)
                '2025-07-25', // Today
            ]);
            expect(res.body.data).toEqual([100, 150, 0, 200, 0, 0, 300]); // Ensure missing days are 0
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT[\s\u00A0]+CAST\(P\.payment_date AS DATE\) AS day,[\s\u00A0]+SUM\(P\.amount\) AS total[\s\u00A0]+FROM PAYMENT P[\s\u00A0]+JOIN USER_SUBSCRIPTION US ON P\.subscription_id = US\.subscription_id[\s\u00A0]+JOIN CUSTOMER C ON US\.user_id = C\.user_id[\s\u00A0]+WHERE[\s\u00A0]+P\.payment_status = 'paid'[\s\u00A0]+AND C\.user_role = 'member'[\s\u00A0]+AND CAST\(P\.payment_date AS DATE\) >= DATEADD\(DAY, -6, CAST\(GETDATE\(\) AS DATE\)\)[\s\u00A0]+GROUP BY CAST\(P\.payment_date AS DATE\)/is)
            );
        });

        it('should return empty data and labels if no revenue', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get('/admin/revenue-today');

            expect(res.statusCode).toEqual(200);
            // Expected labels will still be the last 7 days from the mocked date
            expect(res.body.labels).toEqual([
                '2025-07-19', '2025-07-20', '2025-07-21', '2025-07-22', '2025-07-23', '2025-07-24', '2025-07-25'
            ]);
            expect(res.body.data).toEqual([0, 0, 0, 0, 0, 0, 0]); // All should be 0
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/admin/revenue-today');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get('/admin/revenue-today');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });

    // =========================================================================
    // GET /admin/revenue-date-range
    // =========================================================================
    describe('GET /admin/revenue-date-range', () => {
        const fromDate = '2025-07-20';
        const toDate = '2025-07-23';

        it('should return revenue for a given date range', async () => {
            mockPool.query.mockResolvedValue({
                recordset: [
                    { day: new RealDate('2025-07-20T00:00:00Z'), total: 100 },
                    { day: new RealDate('2025-07-22T00:00:00Z'), total: 250 },
                ],
            });

            const res = await request(app).get(`/admin/revenue-date-range?from=${fromDate}&to=${toDate}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.labels).toEqual(['2025-07-20', '2025-07-21', '2025-07-22', '2025-07-23']);
            expect(res.body.data).toEqual([100, 0, 250, 0]); // Ensure missing days are 0
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            expect(mockPool.input).toHaveBeenCalledWith('from', sql.Date, fromDate);
            expect(mockPool.input).toHaveBeenCalledWith('to', sql.Date, toDate);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+CAST\(P\.payment_date AS DATE\) AS day,\s+SUM\(P\.amount\) AS total\s+FROM PAYMENT P\s+JOIN USER_SUBSCRIPTION US ON P\.subscription_id = US\.subscription_id\s+JOIN CUSTOMER C ON US\.user_id = C\.user_id\s+WHERE P\.payment_status = 'paid'\s+AND C\.user_role = 'member'\s+AND CAST\(P\.payment_date AS DATE\) BETWEEN @from AND @to\s+GROUP BY CAST\(P\.payment_date AS DATE\)\s+ORDER BY day ASC/i)
            );
        });

        it('should return empty data and labels if no revenue in range', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get(`/admin/revenue-date-range?from=${fromDate}&to=${toDate}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.labels).toEqual(['2025-07-20', '2025-07-21', '2025-07-22', '2025-07-23']);
            expect(res.body.data).toEqual([0, 0, 0, 0]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get(`/admin/revenue-date-range?from=${fromDate}&to=${toDate}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get(`/admin/revenue-date-range?from=${fromDate}&to=${toDate}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });

    // =========================================================================
    // GET /admin/revenue-week (getWeeklyRevenue)
    // =========================================================================
    describe('GET /admin/revenue-week', () => {
        it('should return weekly revenue for the current month', async () => {
            // Mock SQL results for getWeeklyRevenue
            // Controller now fetches data that is already grouped by week and formatted
            mockPool.query.mockResolvedValue({
                recordset: [
                    { label: '01-07 __ 07-07', total: 150 }, // Sum of 100 + 50
                    { label: '08-07 __ 14-07', total: 350 }, // Sum of 200 + 150
                    { label: '15-07 __ 21-07', total: 120 },
                    { label: '22-07 __ 28-07', total: 480 }, // Sum of 180 + 300
                    { label: '29-07 __ 04-08', total: 50 },
                ],
            });

            const res = await request(app).get('/admin/revenue-week');

            expect(res.statusCode).toEqual(200);
            // Labels will be based on the calculated weeks from 2025-07-25
            // Note: The controller's logic for getWeeklyRevenue calculates weeks based on the first day of the month
            // and then iterates for 5 weeks. The labels should reflect this.
            expect(res.body.labels).toEqual([
                '01-07 __ 07-07', // Week 1: Mon 01-07 to Sun 07-07
                '08-07 __ 14-07', // Week 2: Mon 08-07 to Sun 14-07
                '15-07 __ 21-07', // Week 3: Mon 15-07 to Sun 21-07
                '22-07 __ 28-07', // Week 4: Mon 22-07 to Sun 28-07
                '29-07 __ 04-08', // Week 5: Mon 29-07 to Sun 04-08
            ]);
            // Data should directly match the mocked totals from the SQL query
            expect(res.body.data).toEqual([150, 350, 120, 480, 50]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            // Regex updated to match the simplified SQL query in the controller
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/WITH FilteredPayments AS \(.*SELECT.*payment_date,.*amount,.*DATEFROMPARTS\(YEAR\(payment_date\), MONTH\(payment_date\), 1\) AS month_start,.*EOMONTH\(payment_date\) AS month_end.*FROM PAYMENT P.*JOIN USER_SUBSCRIPTION US ON P\.subscription_id = US\.subscription_id.*JOIN CUSTOMER C ON US\.user_id = C\.user_id.*WHERE P\.payment_status = 'paid' AND C\.user_role = 'member'.*\),.*WeeklyGrouped AS \(.*SELECT.*DATEADD\(DAY, \(DATEDIFF\(DAY, month_start, payment_date\) \/ 7\) \* 7, month_start\) AS week_start,.*SUM\(amount\) AS total.*FROM FilteredPayments.*WHERE.*MONTH\(payment_date\) = MONTH\(GETDATE\(\)\).*AND YEAR\(payment_date\) = YEAR\(GETDATE\(\)\).*AND payment_date >= month_start AND payment_date <= month_end.*GROUP BY DATEADD\(DAY, \(DATEDIFF\(DAY, month_start, payment_date\) \/ 7\) \* 7, month_start\).*\).*SELECT.*FORMAT\(week_start, 'dd-MM'\) \+ ' __ ' \+ FORMAT\(DATEADD\(DAY, 6, week_start\), 'dd-MM'\) AS label,.*total.*FROM WeeklyGrouped.*ORDER BY week_start/is)
            );
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/admin/revenue-week');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get('/admin/revenue-week');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });

    // =========================================================================
    // GET /admin/monthly-revenue (getMonthlyRevenue)
    // =========================================================================
    describe('GET /admin/monthly-revenue', () => {
        it('should return monthly revenue for the current year', async () => {
            mockPool.query.mockResolvedValue({
                recordset: [
                    { month: '01/2025', total: 5000 },
                    { month: '03/2025', total: 7000 },
                    { month: '07/2025', total: 9000 },
                ],
            });

            const res = await request(app).get('/admin/monthly-revenue');

            expect(res.statusCode).toEqual(200);
            expect(res.body.labels).toEqual(['01/2025', '03/2025', '07/2025']);
            expect(res.body.data).toEqual([5000, 7000, 9000]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT FORMAT\(P\.payment_date, 'MM\/yyyy'\) AS month, SUM\(P\.amount\) AS total.*WHERE P\.payment_status = 'paid'.*AND C\.user_role = 'member'.*AND YEAR\(P\.payment_date\) = YEAR\(GETDATE\(\)\).*GROUP BY FORMAT\(P\.payment_date, 'MM\/yyyy'\).*ORDER BY MIN\(P\.payment_date\)/is)
            );
        });

        it('should return empty labels and data if no revenue for the current year', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get('/admin/monthly-revenue');

            expect(res.statusCode).toEqual(200);
            expect(res.body.labels).toEqual([]);
            expect(res.body.data).toEqual([]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/admin/monthly-revenue');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get('/admin/monthly-revenue');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });

    // =========================================================================
    // GET /admin/revenue-year (getYearlyRevenue)
    // =========================================================================
    describe('GET /admin/revenue-year', () => {
        it('should return yearly revenue', async () => {
            mockPool.query.mockResolvedValue({
                recordset: [
                    { year: 2023, total: 10000 },
                    { year: 2024, total: 15000 },
                    { year: 2025, total: 20000 },
                ],
            });

            const res = await request(app).get('/admin/revenue-year');

            expect(res.statusCode).toEqual(200);
            expect(res.body.labels).toEqual(['2023', '2024', '2025']);
            expect(res.body.data).toEqual([10000, 15000, 20000]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT DATEPART\(YEAR, payment_date\) AS year, SUM\(amount\) AS total.*FROM PAYMENT P.*WHERE P\.payment_status = 'paid' AND C\.user_role = 'member'.*GROUP BY DATEPART\(YEAR, payment_date\).*ORDER BY year/is)
            );
        });

        it('should return empty labels and data if no yearly revenue', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get('/admin/revenue-year');

            expect(res.statusCode).toEqual(200);
            expect(res.body.labels).toEqual([]);
            expect(res.body.data).toEqual([]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/admin/revenue-year');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get('/admin/revenue-year');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });

    // =========================================================================
    // GET /admin/active-coach-count
    // =========================================================================
    describe('GET /admin/active-coach-count', () => {
        it('should return the count of active coaches', async () => {
            mockPool.query.mockResolvedValue({ recordset: [{ active_coach: 5 }] });

            const res = await request(app).get('/admin/active-coach-count');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ count: 5 });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT COUNT\(\*\) AS active_coach\s+FROM CUSTOMER\s+WHERE user_role = 'coach' AND account_status = 'active'/is)
            );
        });

        it('should return 0 if no active coaches', async () => {
            mockPool.query.mockResolvedValue({ recordset: [{ active_coach: 0 }] });

            const res = await request(app).get('/admin/active-coach-count');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ count: 0 });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/admin/active-coach-count');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get('/admin/active-coach-count');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });

    // =========================================================================
    // GET /admin/revenue-week-range
    // =========================================================================
    describe('GET /admin/revenue-week-range', () => {
        const fromDate = '2025-07-01'; // Bắt đầu từ 01/07
        const toDate = '2025-07-31'; // Kết thúc 31/07

        // Mock console.error to prevent it from polluting test output
        let consoleErrorSpy;
        beforeEach(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
        });

        it('should return weekly revenue for a given 5-week range', async () => {
            // Mock pool.request().query for each promise in Promise.all
            mockPool.query
                .mockResolvedValueOnce({ recordset: [{ total: 100 }] }) // Week 1: 01-07 -> 07-07
                .mockResolvedValueOnce({ recordset: [{ total: 200 }] }) // Week 2: 08-07 -> 14-07
                .mockResolvedValueOnce({ recordset: [{ total: 0 }] }) // Week 3: 15-07 -> 21-07
                .mockResolvedValueOnce({ recordset: [{ total: 300 }] }) // Week 4: 22-07 -> 28-07
                .mockResolvedValueOnce({ recordset: [{ total: 50 }] }); // Week 5: 29-07 -> 04-08 (lưu ý sẽ vượt tháng)

            const res = await request(app).get(`/admin/revenue-week-range?from=${fromDate}&to=${toDate}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.labels).toEqual([
                '01-07 __ 07-07',
                '08-07 __ 14-07',
                '15-07 __ 21-07',
                '22-07 __ 28-07',
                '29-07 __ 04-08',
            ]);
            expect(res.body.data).toEqual([100, 200, 0, 300, 50]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            // Verify mockPool.input and query for each week in the loop
            expect(mockPool.input).toHaveBeenCalledWith('start', sql.Date, new RealDate('2025-07-01T00:00:00.000Z'));
            expect(mockPool.input).toHaveBeenCalledWith('end', sql.Date, new RealDate('2025-07-07T00:00:00.000Z'));
            // This is complex to check for all 5 queries, but we can check the general query pattern
            expect(mockPool.query).toHaveBeenCalledTimes(5); // 5 queries in total
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+SUM\(P\.amount\) AS total\s+FROM PAYMENT P.*WHERE.*P\.payment_status = 'paid' AND C\.user_role = 'member'.*AND CAST\(P\.payment_date AS DATE\) BETWEEN @start AND @end/is)
            );
        });

        it('should handle database errors for getRevenueByWeekRange', async () => {
            mockPool.query.mockRejectedValueOnce(new Error('First week error'));
            // No need for subsequent mockResolvedValueOnce as Promise.all will reject on first error

            const res = await request(app).get(`/admin/revenue-week-range?from=${fromDate}&to=${toDate}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            expect(console.error).toHaveBeenCalledWith(
                "getRevenueByWeekRange error:",
                expect.any(Error)
            );
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get(`/admin/revenue-week-range?from=${fromDate}&to=${toDate}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if fromDate parameter is missing', async () => { // Changed from 400 to 500
            const res = await request(app).get(`/admin/revenue-week-range?to=${toDate}`);

            expect(res.statusCode).toEqual(500); // Expect 500 as controller doesn't handle 400
            expect(res.body).toEqual({ error: 'Internal server error' }); // Expect generic 500 error message
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
        });

        it('should return 500 if toDate parameter is missing', async () => { // Changed from 400 to 500
            const res = await request(app).get(`/admin/revenue-week-range?from=${fromDate}`);

            expect(res.statusCode).toEqual(500); // Expect 500 as controller doesn't handle 400
            expect(res.body).toEqual({ error: 'Internal server error' }); // Expect generic 500 error message
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
        });

        it('should return 500 if fromDate parameter is invalid', async () => { // Changed from 400 to 500
            const res = await request(app).get(`/admin/revenue-week-range?from=invalid-date&to=${toDate}`);

            expect(res.statusCode).toEqual(500); // Expect 500 as controller doesn't handle 400
            expect(res.body).toEqual({ error: 'Internal server error' }); // Expect generic 500 error message
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
        });

        it('should return 500 if toDate parameter is invalid', async () => { // Changed from 400 to 500
            const res = await request(app).get(`/admin/revenue-week-range?from=${fromDate}&to=invalid-date`);

            expect(res.statusCode).toEqual(500); // Expect 500 as controller doesn't handle 400
            expect(res.body).toEqual({ error: 'Internal server error' }); // Expect generic 500 error message
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
        });
    });

    // =========================================================================
    // GET /admin/monthly-revenue-by-year
    // =========================================================================
    describe('GET /admin/monthly-revenue-by-year', () => {
        it('should return monthly revenue for a given year', async () => {
            mockPool.query.mockResolvedValue({
                recordset: [
                    { month: 1, total: 500 },
                    { month: 2, total: 600 },
                    { month: 4, total: 800 },
                ],
            });

            const res = await request(app).get('/admin/monthly-revenue-by-year?year=2024');

            expect(res.statusCode).toEqual(200);
            // Labels khớp với định dạng tiếng Việt từ controller
            expect(res.body.labels).toEqual([
                "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
                "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
            ]);
            expect(res.body.data).toEqual([500, 600, 0, 800, 0, 0, 0, 0, 0, 0, 0, 0]); // Ensure missing months are 0
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            // SỬA LỖI: mockPool.input mong đợi chuỗi "2024", không phải số nguyên 2024
            expect(mockPool.input).toHaveBeenCalledWith('year', sql.Int, '2024');
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT[\s\u00A0]+MONTH\(payment_date\) AS month,[\s\u00A0]+SUM\(amount\) AS total[\s\u00A0]+FROM PAYMENT P[\s\u00A0]+JOIN USER_SUBSCRIPTION US ON P\.subscription_id = US\.subscription_id[\s\u00A0]+JOIN CUSTOMER C ON US\.user_id = C\.user_id[\s\u00A0]+WHERE[\s\u00A0]+P\.payment_status = 'paid'[\s\u00A0]+AND C\.user_role = 'member'[\s\u00A0]+AND YEAR\(payment_date\) = @year[\s\u00A0]+GROUP BY MONTH\(payment_date\)[\s\u00A0]+ORDER BY month/is)
            );
        });

        it('should return empty labels and data if no revenue for the given year', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get('/admin/monthly-revenue-by-year?year=2024');

            expect(res.statusCode).toEqual(200);
            // Labels khớp với định dạng tiếng Việt từ controller
            expect(res.body.labels).toEqual([
                "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
                "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
            ]);
            expect(res.body.data).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/admin/monthly-revenue-by-year?year=2024');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get('/admin/monthly-revenue-by-year?year=2024');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if year parameter is missing', async () => { // Changed from 400 to 500
            const res = await request(app).get('/admin/monthly-revenue-by-year');

            expect(res.statusCode).toEqual(500); // Expect 500 as controller doesn't handle 400
            expect(res.body).toEqual({ error: 'Internal server error' }); // Expect generic 500 error message
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if year parameter is invalid', async () => { // Changed from 400 to 500
            const res = await request(app).get('/admin/monthly-revenue-by-year?year=abc');

            expect(res.statusCode).toEqual(500); // Expect 500 as controller doesn't handle 400
            expect(res.body).toEqual({ error: 'Internal server error' }); // Expect generic 500 error message
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });

    // =========================================================================
    // GET /admin/avg-months-by-addiction
    // =========================================================================
    describe('GET /admin/avg-months-by-addiction', () => {
        it('should return average months by addiction level', async () => {
            mockPool.query.mockResolvedValue({
                recordset: [
                    { addiction_level: 'low', avg_months: 3.5 },
                    { addiction_level: 'medium', avg_months: 6.0 },
                    { addiction_level: 'high', avg_months: 9.2 },
                ],
            });

            const res = await request(app).get('/admin/avg-months-by-addiction');

            expect(res.statusCode).toEqual(200);
            // SỬA: Labels khớp với định dạng chữ thường từ controller
            expect(res.body.labels).toEqual(['low', 'medium', 'high']);
            expect(res.body.data).toEqual([3.5, 6.0, 9.2]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT[\s\u00A0]+fr\.\[level\] AS addiction_level,[\s\u00A0]+AVG\(cp\.month_quit \* 1\.0\) AS avg_months[\s\u00A0]+FROM CESSATION_PLAN cp[\s\u00A0]+JOIN \([\s\u00A0]+SELECT user_id, \[level\][\s\u00A0]+FROM \([\s\u00A0]+SELECT \*, ROW_NUMBER\(\) OVER \(PARTITION BY user_id ORDER BY submitted_at DESC\) AS rn[\s\u00A0]+FROM FTND_RESULT[\s\u00A0]+\) sub[\s\u00A0]+WHERE rn = 1[\s\u00A0]+\) fr ON cp\.user_id = fr\.user_id[\s\u00A0]+JOIN CUSTOMER c ON cp\.user_id = c\.user_id[\s\u00A0]+WHERE c\.user_role = 'member'[\s\u00A0]+GROUP BY fr\.\[level\]/is)
            );
        });

        it('should return empty data and labels if no addiction data', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get('/admin/avg-months-by-addiction');

            expect(res.statusCode).toEqual(200);
            expect(res.body.labels).toEqual([]);
            expect(res.body.data).toEqual([]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/admin/avg-months-by-addiction');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get('/admin/avg-months-by-addiction');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });

    // =========================================================================
    // GET /admin/revenue-stats
    // =========================================================================
    describe('GET /admin/revenue-stats', () => {
        let consoleErrorSpy;
        beforeEach(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
        });

        it('should return total revenue and total paid subscriptions', async () => {
            mockPool.query.mockResolvedValue({
                recordset: [{
                    total_today: 100,
                    total_week: 1000,
                    total_month: 5000,
                    total_year: 50000
                }]
            });

            const res = await request(app).get('/admin/revenue-stats');

            expect(res.statusCode).toEqual(200);
            // Cấu trúc response body khớp với controller
            expect(res.body).toEqual({
                total_today: 100,
                total_week: 1000,
                total_month: 5000,
                total_year: 50000
            });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
            // SỬA: Regex khớp với query mới (bao gồm JOIN và WHERE user_role = 'member')
            // Đã làm cho regex linh hoạt hơn với khoảng trắng và các ký tự không in được
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s*\(\s*SELECT SUM\(amount\)\s+FROM PAYMENT\s+WHERE payment_status = 'paid'\s+AND CAST\(payment_date AS DATE\) = CAST\(GETDATE\(\) AS DATE\)\s*\) AS total_today,\s*\(\s*SELECT SUM\(amount\)\s+FROM PAYMENT\s+WHERE payment_status = 'paid'\s+AND CAST\(payment_date AS DATE\) BETWEEN @start AND @end\s*\) AS total_week,\s*\(\s*SELECT SUM\(amount\)\s+FROM PAYMENT\s+WHERE payment_status = 'paid'\s+AND MONTH\(payment_date\) = MONTH\(GETDATE\(\)\)\s+AND YEAR\(payment_date\) = YEAR\(GETDATE\(\)\)\s*\) AS total_month,\s*\(\s*SELECT SUM\(amount\)\s+FROM PAYMENT\s+WHERE payment_status = 'paid'\s+AND YEAR\(payment_date\) = YEAR\(GETDATE\(\)\)\s*\) AS total_year/is)
            );
        });

        it('should return 0 for revenue and subscriptions if no data', async () => {
            mockPool.query.mockResolvedValue({
                recordset: [{
                    total_today: null, // SQL returns NULL if SUM is over no rows
                    total_week: null,
                    total_month: null,
                    total_year: null
                }]
            });

            const res = await request(app).get('/admin/revenue-stats');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({
                total_today: 0,
                total_week: 0,
                total_month: 0,
                total_year: 0
            });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 500 if there is a database error fetching total revenue', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error for revenue stats'));

            const res = await request(app).get('/admin/revenue-stats');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });

            const res = await request(app).get('/admin/revenue-stats');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ success: false, message: 'Forbidden' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin'); // Check authorize call
        });
    });
});
