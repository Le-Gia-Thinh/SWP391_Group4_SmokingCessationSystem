const request = require('supertest');
const express = require('express');
const habitLogController = require('../../controllers/habitLogController');
const { sql, dbConfig } = require('../../config/database');

// Mock module database
jest.mock('../../config/database', () => ({
    sql: {
        connect: jest.fn(),
        Int: jest.fn(),
        Date: jest.fn(),
        Bit: jest.fn(),
        Float: jest.fn(),
        VarChar: jest.fn(),
        NVarChar: jest.fn(),
        // Add other SQL types if used in controllers, e.g., sql.SmallInt, sql.Decimal
    },
    dbConfig: {
        user: 'mockUser',
        password: 'mockPassword',
        server: 'mockServer',
        database: 'mockDatabase'
    }
}));

// Declare auth mock at a higher scope
let auth;

// Mock the entire middleware/auth module
jest.mock('../../middleware/auth', () => {
    return {
        auth: jest.fn((req, res, next) => {
            req.user = { id: 1 }; // Default user for authenticated requests
            next();
        }),
    };
});

// Import the mocked function after jest.mock is defined
const originalAuthModule = require('../../middleware/auth');
auth = originalAuthModule.auth;


describe('Habit Log Controller', () => {
    let app;
    let mockPool;
    let consoleErrorSpy;

    // Helper function to mock pool.request().input().query chain
    const mockQueryChain = (mockResult) => {
        mockPool.request.mockReturnThis(); // Allows chaining .request()
        mockPool.input.mockReturnThis(); // Allows chaining .input()
        mockPool.query.mockResolvedValue(mockResult); // Resolves the final query
    };

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Reset all mocks before each test
        jest.clearAllMocks();

        // Set up default mock implementation for auth for the current test
        auth.mockImplementation((req, res, next) => {
            req.user = { id: 1 }; // Default to user 1
            next();
        });

        // Define routes (matching routes/habitLogRoutes.js)
        app.get('/habit-log', auth, habitLogController.getHabitLogByDate);
        app.post('/habit-log', auth, habitLogController.submitSingleLog);
        app.delete('/habit-log', auth, habitLogController.deleteHabitLogEntry);
        app.post('/habit-log/choose-task', auth, habitLogController.chooseBehaviorTask);
        app.get('/habit-log/selected-tasks', auth, habitLogController.getSelectedTasksByDate);
        app.get('/habit-log/completed-tasks', auth, habitLogController.getCompletedTasksByDate);
        app.post('/habit-log/submit-task-points', auth, habitLogController.submitBehaviorTaskPoint);
        app.post('/habit-log/delete-task-log', auth, habitLogController.deleteBehaviorTaskLogEntry);
        // Add the new route for submitBehaviorTaskCompletion
        app.post('/habit-log/submit-task-completion', auth, habitLogController.submitBehaviorTaskCompletion);


        // Re-initialize mockPool for each test
        mockPool = {
            request: jest.fn(() => mockPool),
            input: jest.fn(() => mockPool),
            query: jest.fn(),
            connect: jest.fn().mockResolvedValue(mockPool),
            close: jest.fn().mockResolvedValue(),
        };
        sql.connect.mockResolvedValue(mockPool);

        // Mock console.error to prevent it from polluting test output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(async () => {
        // Ensure mockPool.close() is called to prevent open handles
        if (mockPool && mockPool.close) {
            await mockPool.close();
        }
        jest.restoreAllMocks(); // Restore all mocks after each test
        consoleErrorSpy.mockRestore(); // Restore original console.error
    });

    // =========================================================================
    // getUserLevel (internal helper function)
    // =========================================================================
    // This function is not exported, so we test it indirectly through functions that use it.
    // However, for completeness and direct testing if it were exported:
    // describe('getUserLevel', () => {
    //     it('should return "Beginner" for points < 100', () => {
    //         // Assuming getUserLevel is accessible, e.g., if exported
    //         // expect(habitLogController.getUserLevel(50)).toBe('Beginner');
    //     });
    //     it('should return "Intermediate" for points between 100 and 399', () => {
    //         // expect(habitLogController.getUserLevel(150)).toBe('Intermediate');
    //     });
    //     it('should return "Advanced" for points between 400 and 999', () => {
    //         // expect(habitLogController.getUserLevel(500)).toBe('Advanced');
    //     });
    //     it('should return "Master" for points >= 1000', () => {
    //         // expect(habitLogController.getUserLevel(1000)).toBe('Master');
    //     });
    // });

    // =========================================================================
    // GET /habit-log (getHabitLogByDate)
    // =========================================================================
    describe('GET /habit-log', () => {
        const testDate = '2025-07-25';

        it('should return habit log data and completed task count for a given date', async () => {
            // Mock HABIT_LOG query result
            mockPool.query
                .mockResolvedValueOnce({
                    recordset: [
                        { time_slot: 0, completed: true },
                        { time_slot: 2, completed: true },
                        { time_slot: 5, completed: false }, // Should not be counted in completedArray filter(Boolean)
                    ],
                })
                // Mock USER_BEHAVIOR_TASK_LOG query result
                .mockResolvedValueOnce({
                    recordset: [{ completedTasks: 2 }],
                });

            const res = await request(app).get(`/habit-log?date=${testDate}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([true, false, true, false, false, false, false, false, false]);
            expect(res.body.completedCount).toEqual(2); // From HABIT_LOG
            expect(res.body.completedTasks).toEqual(2); // From USER_BEHAVIOR_TASK_LOG
            expect(res.body.totalSlots).toEqual(9);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(2); // One for HABIT_LOG, one for USER_BEHAVIOR_TASK_LOG
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('log_date', sql.Date, testDate);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT time_slot, completed\s+FROM HABIT_LOG\s+WHERE user_id = @user_id AND log_date = @log_date\s+ORDER BY time_slot/is)
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT COUNT\(\*\) AS completedTasks\s+FROM USER_BEHAVIOR_TASK_LOG\s+WHERE user_id = @user_id AND log_date = @log_date AND is_completed = 1/is)
            );
        });

        it('should return default values if no habit log or behavior task log data exists', async () => {
            // Mock empty results for both queries
            mockPool.query
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] });

            const res = await request(app).get(`/habit-log?date=${testDate}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(Array(9).fill(false));
            expect(res.body.completedCount).toEqual(0);
            expect(res.body.completedTasks).toEqual(0);
            expect(res.body.totalSlots).toEqual(9);
        });

        it('should return 500 if date parameter is missing (as per controller behavior)', async () => {
            // As per the provided controller, the date validation happens implicitly during DB input.
            // The controller attempts to connect to the DB and then passes an undefined 'date' to sql.Date.
            // This will likely cause a database error, leading to the catch block and a 500 status.
            mockPool.query.mockRejectedValue(new Error('Input parameter "log_date" cannot be undefined.'));

            const res = await request(app).get('/habit-log'); // No date parameter

            expect(res.statusCode).toEqual(500); // Expect 500 as per controller's error handling
            expect(res.body).toEqual({ success: false, error: 'Lỗi máy chủ khi truy vấn habit log' });
            expect(auth).toHaveBeenCalledTimes(1);
            // Corrected: Check sql.connect instead of mockPool.connect
            expect(sql.connect).toHaveBeenCalledTimes(1); // Should attempt to connect to DB
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi khi truy vấn habit log:",
                expect.any(Error)
            );
        });

        it('should return 500 if there is a database error', async () => {
            // Ensure mockRejectedValue is set for this specific test
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get(`/habit-log?date=${testDate}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ success: false, error: 'Lỗi máy chủ khi truy vấn habit log' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi khi truy vấn habit log:",
                expect.any(Error)
            );
        });

        it('should return 401 if not authenticated', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app).get(`/habit-log?date=${testDate}`);

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
        });
    });

    // =========================================================================
    // POST /habit-log (submitSingleLog)
    // =========================================================================
    describe('POST /habit-log', () => {
        const testDate = '2025-07-25';
        const testTimeSlot = 1;
        const testCompleted = true;

        it('should successfully submit a single habit log and update score', async () => {
            // Mock queries for submitSingleLog
            mockPool.query
                .mockResolvedValueOnce({ recordset: [{ month_quit: 1 }] }) // For planRes
                .mockResolvedValueOnce({ recordset: [] }) // For merge operation (no specific result needed)
                .mockResolvedValueOnce({ recordset: [{ completed: true }] }) // For logOfDay (assuming 1 completed entry after merge)
                .mockResolvedValueOnce({ recordset: [] }) // For reset points (no specific result needed)
                .mockResolvedValueOnce({ recordset: [] }) // For assign new points (no specific result needed)
                .mockResolvedValueOnce({ recordset: [{ total_points: 50 }] }) // For USER_SCORE for current points
                .mockResolvedValueOnce({ recordset: [{ total: 10 }] }) // For HABIT_LOG for total points calculation
                .mockResolvedValueOnce({ recordset: [{ total: 5 }] }) // For USER_BEHAVIOR_TASK_LOG for total points calculation
                .mockResolvedValueOnce({ recordset: [] }); // For USER_SCORE for merge (no specific result needed)

            const res = await request(app)
                .post('/habit-log')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: testCompleted });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã lưu hành vi' });
            expect(auth).toHaveBeenCalledTimes(1);
            // Expected call count from 8 to 9
            expect(mockPool.request).toHaveBeenCalledTimes(9); // plan, merge, logOfDay, reset, assign, score, habitPoints, behaviorPoints, user_score merge
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('log_date', sql.Date, testDate);
            expect(mockPool.input).toHaveBeenCalledWith('time_slot', sql.Int, testTimeSlot);
            expect(mockPool.input).toHaveBeenCalledWith('completed', sql.Bit, testCompleted);
            // Check for points_awarded input (pointPerSlot will be ~0.37)
            expect(mockPool.input).toHaveBeenCalledWith('points_awarded', sql.Float, expect.any(Number));
            expect(mockPool.input).toHaveBeenCalledWith('total_points', sql.Float, expect.any(Number));
            expect(mockPool.input).toHaveBeenCalledWith('current_level', sql.VarChar, expect.any(String));
        });

        it('should handle completed as string "true"', async () => {
            // Mock queries for submitSingleLog
            mockPool.query
                .mockResolvedValueOnce({ recordset: [{ month_quit: 1 }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [{ completed: true }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [{ total_points: 50 }] })
                .mockResolvedValueOnce({ recordset: [{ total: 10 }] })
                .mockResolvedValueOnce({ recordset: [{ total: 5 }] })
                .mockResolvedValueOnce({ recordset: [] });

            const res = await request(app)
                .post('/habit-log')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: "true" });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã lưu hành vi' });
            expect(mockPool.input).toHaveBeenCalledWith('completed', sql.Bit, true);
        });

        it('should handle completed as 1', async () => {
            // Mock queries for submitSingleLog
            mockPool.query
                .mockResolvedValueOnce({ recordset: [{ month_quit: 1 }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [{ completed: true }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [{ total_points: 50 }] })
                .mockResolvedValueOnce({ recordset: [{ total: 10 }] })
                .mockResolvedValueOnce({ recordset: [{ total: 5 }] })
                .mockResolvedValueOnce({ recordset: [] });

            const res = await request(app)
                .post('/habit-log')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: 1 });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã lưu hành vi' });
            expect(mockPool.input).toHaveBeenCalledWith('completed', sql.Bit, true);
        });


        it('should return 400 if date or timeSlot is missing', async () => {
            const res1 = await request(app)
                .post('/habit-log')
                .send({ timeSlot: testTimeSlot, completed: testCompleted }); // Missing date

            expect(res1.statusCode).toEqual(400);
            expect(res1.body).toEqual({ success: false, message: 'Thiếu dữ liệu' });

            const res2 = await request(app)
                .post('/habit-log')
                .send({ date: testDate, completed: testCompleted }); // Missing timeSlot

            expect(res2.statusCode).toEqual(400);
            expect(res2.body).toEqual({ success: false, message: 'Thiếu dữ liệu' });
            expect(mockPool.connect).not.toHaveBeenCalled(); // Should not connect to DB if validation fails
        });

        it('should return 500 if there is a database error', async () => {
            // Ensure mockRejectedValue is set for this specific test
            mockPool.query.mockRejectedValue(new Error('Database error')); // Simulate error at any query

            const res = await request(app)
                .post('/habit-log')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: testCompleted });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ success: false, message: 'Lỗi server' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi ghi hành vi đơn:",
                expect.any(Error)
            );
        });

        it('should return 401 if not authenticated', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app)
                .post('/habit-log')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: testCompleted });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
        });
    });

    // =========================================================================
    // DELETE /habit-log (deleteHabitLogEntry)
    // =========================================================================
    describe('DELETE /habit-log', () => {
        const testDate = '2025-07-25';
        const testTimeSlot = 1;

        it('should successfully delete a habit log entry and update score', async () => {
            // Mock queries for deleteHabitLogEntry
            mockPool.query
                .mockResolvedValueOnce({ recordset: [] }) // For UPDATE HABIT_LOG
                .mockResolvedValueOnce({ recordset: [{ total: 10 }] }) // For HABIT_LOG SUM points
                .mockResolvedValueOnce({ recordset: [{ total: 5 }] }) // For USER_BEHAVIOR_TASK_LOG SUM points
                .mockResolvedValueOnce({ recordset: [] }); // For USER_SCORE MERGE

            const res = await request(app)
                .delete('/habit-log')
                .send({ date: testDate, timeSlot: testTimeSlot });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã bỏ tích hành vi và cập nhật điểm' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(4); // update, habit sum, behavior sum, user_score merge
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('log_date', sql.Date, testDate);
            expect(mockPool.input).toHaveBeenCalledWith('time_slot', sql.Int, testTimeSlot);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE HABIT_LOG\s+SET completed = 0, points_awarded = 0\s+WHERE user_id = @user_id AND log_date = @log_date AND time_slot = @time_slot/is)
            );
            expect(mockPool.input).toHaveBeenCalledWith('total_points', sql.Float, expect.any(Number));
            expect(mockPool.input).toHaveBeenCalledWith('current_level', sql.VarChar, expect.any(String));
        });

        it('should return 400 if date or timeSlot is missing/invalid', async () => {
            const res1 = await request(app)
                .delete('/habit-log')
                .send({ timeSlot: testTimeSlot }); // Missing date

            expect(res1.statusCode).toEqual(400);
            expect(res1.body).toEqual({ success: false, message: 'Thiếu ngày hoặc timeSlot không hợp lệ' });

            const res2 = await request(app)
                .delete('/habit-log')
                .send({ date: testDate }); // Missing timeSlot

            expect(res2.statusCode).toEqual(400);
            expect(res2.body).toEqual({ success: false, message: 'Thiếu ngày hoặc timeSlot không hợp lệ' });

            const res3 = await request(app)
                .delete('/habit-log')
                .send({ date: testDate, timeSlot: 'invalid' }); // Invalid timeSlot

            expect(res3.statusCode).toEqual(400);
            expect(res3.body).toEqual({ success: false, message: 'Thiếu ngày hoặc timeSlot không hợp lệ' });
            expect(mockPool.connect).not.toHaveBeenCalled(); // Should not connect to DB if validation fails
        });

        it('should return 500 if there is a database error', async () => {
            // Ensure mockRejectedValue is set for this specific test
            mockPool.query.mockRejectedValue(new Error('Database error')); // Simulate error at any query

            const res = await request(app)
                .delete('/habit-log')
                .send({ date: testDate, timeSlot: testTimeSlot });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ success: false, message: 'Lỗi server khi bỏ tích' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi khi bỏ tích habit log:",
                expect.any(Error)
            );
        });

        it('should return 401 if not authenticated', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app)
                .delete('/habit-log')
                .send({ date: testDate, timeSlot: testTimeSlot });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
        });
    });

    // =========================================================================
    // POST /habit-log/choose-task (chooseBehaviorTask)
    // =========================================================================
    describe('POST /habit-log/choose-task', () => {
        const testDate = '2025-07-25';
        const testTimeSlot = 0;
        const testTaskId = 'TASK001';

        beforeEach(() => {
            mockPool.query.mockResolvedValue({ recordset: [] }); // For MERGE USER_BEHAVIOR_TASK_LOG
        });

        it('should successfully choose a behavior task', async () => {
            const res = await request(app)
                .post('/habit-log/choose-task')
                .send({ date: testDate, timeSlot: testTimeSlot, taskId: testTaskId });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã lưu lựa chọn nhiệm vụ' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1);
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('log_date', sql.Date, testDate);
            expect(mockPool.input).toHaveBeenCalledWith('time_slot', sql.Int, testTimeSlot);
            expect(mockPool.input).toHaveBeenCalledWith('task_id', sql.NVarChar, testTaskId);
            // Updated regex to match the actual query in the controller
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/MERGE USER_BEHAVIOR_TASK_LOG AS target.*ON \(target\.user_id = source\.user_id AND target\.log_date = source\.log_date AND target\.time_slot = source\.time_slot\).*WHEN MATCHED THEN.*UPDATE SET task_id = @task_id.*WHEN NOT MATCHED THEN.*INSERT \(user_id, log_date, time_slot, task_id, is_completed\).*VALUES \(@user_id, @log_date, @time_slot, @task_id, 0\)/is)
            );
        });

        it('should return 400 if date, timeSlot, or taskId is missing', async () => {
            const res1 = await request(app)
                .post('/habit-log/choose-task')
                .send({ timeSlot: testTimeSlot, taskId: testTaskId }); // Missing date

            expect(res1.statusCode).toEqual(400);
            expect(res1.body).toEqual({ success: false, message: 'Thiếu dữ liệu chọn task' });

            const res2 = await request(app)
                .post('/habit-log/choose-task')
                .send({ date: testDate, taskId: testTaskId }); // Missing timeSlot

            expect(res2.statusCode).toEqual(400);
            expect(res2.body).toEqual({ success: false, message: 'Thiếu dữ liệu chọn task' });

            const res3 = await request(app)
                .post('/habit-log/choose-task')
                .send({ date: testDate, timeSlot: testTimeSlot }); // Missing taskId

            expect(res3.statusCode).toEqual(400);
            expect(res3.body).toEqual({ success: false, message: 'Thiếu dữ liệu chọn task' });
            expect(mockPool.connect).not.toHaveBeenCalled(); // Should not connect to DB if validation fails
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/habit-log/choose-task')
                .send({ date: testDate, timeSlot: testTimeSlot, taskId: testTaskId });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ success: false, message: 'Lỗi server' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi ghi task hành vi:",
                expect.any(Error)
            );
        });

        it('should return 401 if not authenticated', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app)
                .post('/habit-log/choose-task')
                .send({ date: testDate, timeSlot: testTimeSlot, taskId: testTaskId });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
        });
    });

    // =========================================================================
    // GET /habit-log/selected-tasks (getSelectedTasksByDate)
    // =========================================================================
    describe('GET /habit-log/selected-tasks', () => {
        const testDate = '2025-07-25';

        it('should return selected tasks for a given date', async () => {
            mockPool.query.mockResolvedValue({
                recordset: [
                    { time_slot: 0, task_id: 'TASK001' },
                    { time_slot: 3, task_id: 'TASK002' },
                ],
            });

            const res = await request(app).get(`/habit-log/selected-tasks?date=${testDate}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([
                { time_slot: 0, task_id: 'TASK001' },
                { time_slot: 3, task_id: 'TASK002' },
            ]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1);
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('log_date', sql.Date, testDate);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT time_slot, task_id\s+FROM USER_BEHAVIOR_TASK_LOG\s+WHERE user_id = @user_id AND log_date = @log_date\s+ORDER BY time_slot/is)
            );
        });

        it('should return empty array if no selected tasks', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get(`/habit-log/selected-tasks?date=${testDate}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([]);
        });

        it('should return 400 if date parameter is missing', async () => {
            const res = await request(app).get('/habit-log/selected-tasks');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ success: false, message: 'Thiếu ngày' });
            expect(mockPool.connect).not.toHaveBeenCalled();
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get(`/habit-log/selected-tasks?date=${testDate}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ success: false, message: 'Lỗi server' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi get selected-tasks:",
                expect.any(Error)
            );
        });

        it('should return 401 if not authenticated', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app).get(`/habit-log/selected-tasks?date=${testDate}`);

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
        });
    });

    // =========================================================================
    // GET /habit-log/completed-tasks (getCompletedTasksByDate)
    // =========================================================================
    describe('GET /habit-log/completed-tasks', () => {
        const testDate = '2025-07-25';

        it('should return completed tasks for a given date', async () => {
            mockPool.query.mockResolvedValue({
                recordset: [
                    { time_slot: 1, is_completed: true },
                    { time_slot: 4, is_completed: true },
                ],
            });

            const res = await request(app).get(`/habit-log/completed-tasks?date=${testDate}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([
                { time_slot: 1, is_completed: true },
                { time_slot: 4, is_completed: true },
            ]);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1);
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('log_date', sql.Date, testDate);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT time_slot, is_completed\s+FROM USER_BEHAVIOR_TASK_LOG\s+WHERE user_id = @user_id AND log_date = @log_date AND is_completed = 1\s+ORDER BY time_slot/is)
            );
        });

        it('should return empty array if no completed tasks', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get(`/habit-log/completed-tasks?date=${testDate}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([]);
        });

        it('should return 400 if date parameter is missing', async () => {
            const res = await request(app).get('/habit-log/completed-tasks');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ success: false, message: 'Thiếu ngày' });
            expect(mockPool.connect).not.toHaveBeenCalled();
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get(`/habit-log/completed-tasks?date=${testDate}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ success: false, message: 'Lỗi server' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi get completed-tasks:",
                expect.any(Error)
            );
        });

        it('should return 401 if not authenticated', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app).get(`/habit-log/completed-tasks?date=${testDate}`);

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
        });
    });

    // =========================================================================
    // POST /habit-log/submit-task-points (submitBehaviorTaskPoint)
    // =========================================================================
    describe('POST /habit-log/submit-task-points', () => {
        const testDate = '2025-07-25';

        it('should successfully update points for behavior tasks and user score', async () => {
            // Mock queries for submitBehaviorTaskPoint
            mockPool.query
                .mockResolvedValueOnce({ recordset: [{ month_quit: 1 }] }) // For planRes
                .mockResolvedValueOnce({ recordset: Array(5).fill({ is_completed: true }) }) // For completed tasks count (e.g., 5 tasks)
                .mockResolvedValueOnce({ recordset: [] }) // For reset points (no specific result needed)
                .mockResolvedValueOnce({ recordset: [] }) // For update points (no specific result needed)
                .mockResolvedValueOnce({ recordset: [{ total: 10 }] }) // For HABIT_LOG for total points calculation
                .mockResolvedValueOnce({ recordset: [{ total: 20 }] }) // For USER_BEHAVIOR_TASK_LOG for total points calculation
                .mockResolvedValueOnce({ recordset: [] }); // For USER_SCORE for merge (no specific result needed)

            const res = await request(app)
                .post('/habit-log/submit-task-points')
                .send({ date: testDate });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã cập nhật điểm cho nhiệm vụ hành vi' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(7); // plan, task count, reset, update, habit sum, behavior sum, user_score merge
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('log_date', sql.Date, testDate);
            expect(mockPool.input).toHaveBeenCalledWith('point', sql.Float, expect.any(Number)); // Check for a number
            expect(mockPool.input).toHaveBeenCalledWith('total_points', sql.Float, expect.any(Number));
            expect(mockPool.input).toHaveBeenCalledWith('current_level', sql.VarChar, expect.any(String));
        });

        it('should handle no completed tasks gracefully', async () => {
            // Mock empty results for completed tasks
            mockPool.query
                .mockResolvedValueOnce({ recordset: [{ month_quit: 1 }] }) // For planRes
                .mockResolvedValueOnce({ recordset: [] }) // For completed tasks count (0 tasks)
                .mockResolvedValueOnce({ recordset: [] }) // For reset points
                // The controller *will* call the UPDATE query, even if completedCount is 0.
                // It will pass NaN to sql.Float for 'point', which might be converted to NULL or 0 by the driver.
                .mockResolvedValueOnce({ recordset: [] }) // For update points (sets points_awarded to 0)
                .mockResolvedValueOnce({ recordset: [{ total: 10 }] }) // For HABIT_LOG SUM points
                .mockResolvedValueOnce({ recordset: [{ total: 0 }] }) // For USER_BEHAVIOR_TASK_LOG SUM points
                .mockResolvedValueOnce({ recordset: [] }); // For USER_SCORE MERGE

            const res = await request(app)
                .post('/habit-log/submit-task-points')
                .send({ date: testDate });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã cập nhật điểm cho nhiệm vụ hành vi' });
            // Expect the query to be called with the update.
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE USER_BEHAVIOR_TASK_LOG.*SET points_awarded = @point.*WHERE.*is_completed = 1/is)
            );
            // Expect 'point' input to be NaN because totalPointToday / completedCount will be NaN / 0 = NaN
            expect(mockPool.input).toHaveBeenCalledWith('point', sql.Float, NaN);
            expect(mockPool.input).toHaveBeenCalledWith('total_points', sql.Float, 10); // Only habit points
        });

        it('should return 400 if date parameter is missing', async () => {
            const res = await request(app)
                .post('/habit-log/submit-task-points')
                .send({}); // Missing date

            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ success: false, message: 'Thiếu ngày' });
            expect(mockPool.connect).not.toHaveBeenCalled();
        });

        it('should return 500 if there is a database error', async () => {
            // Ensure mockRejectedValue is set for this specific test
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/habit-log/submit-task-points')
                .send({ date: testDate });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ success: false, message: 'Lỗi server' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi tính điểm task hành vi:",
                expect.any(Error)
            );
        });

        it('should return 401 if not authenticated', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app)
                .post('/habit-log/submit-task-points')
                .send({ date: testDate });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
        });
    });

    // =========================================================================
    // POST /habit-log/delete-task-log (deleteBehaviorTaskLogEntry)
    // =========================================================================
    describe('POST /habit-log/delete-task-log', () => {
        const testDate = '2025-07-25';
        const testTimeSlot = 0;

        it('should successfully delete a behavior task log entry and update score', async () => {
            // Mock queries for deleteBehaviorTaskLogEntry
            mockPool.query
                .mockResolvedValueOnce({ recordset: [] }) // For UPDATE USER_BEHAVIOR_TASK_LOG (set is_completed = 0)
                .mockResolvedValueOnce({ recordset: [{ is_completed: true }, { is_completed: true }] }) // For completed tasks count (e.g., 2 tasks remaining)
                .mockResolvedValueOnce({ recordset: [{ month_quit: 1 }] }) // For planRes
                .mockResolvedValueOnce({ recordset: [] }) // For reset points (no specific result needed)
                .mockResolvedValueOnce({ recordset: [] }) // For update points (no specific result needed)
                .mockResolvedValueOnce({ recordset: [{ total: 10 }] }) // For HABIT_LOG for total points calculation
                .mockResolvedValueOnce({ recordset: [{ total: 5 }] }) // For USER_BEHAVIOR_TASK_LOG for total points calculation
                .mockResolvedValueOnce({ recordset: [] }); // For USER_SCORE for merge (no specific result needed)

            const res = await request(app)
                .post('/habit-log/delete-task-log')
                .send({ date: testDate, timeSlot: testTimeSlot });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã bỏ tích nhiệm vụ và cập nhật điểm' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(8); // update, task count, plan, reset, update points, habit sum, behavior sum, user_score merge
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('log_date', sql.Date, testDate);
            expect(mockPool.input).toHaveBeenCalledWith('time_slot', sql.Int, testTimeSlot);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE USER_BEHAVIOR_TASK_LOG\s+SET is_completed = 0, points_awarded = 0\s+WHERE user_id = @user_id AND log_date = @log_date AND time_slot = @time_slot/is)
            );
            expect(mockPool.input).toHaveBeenCalledWith('total_points', sql.Float, expect.any(Number));
            expect(mockPool.input).toHaveBeenCalledWith('current_level', sql.VarChar, expect.any(String));
        });

        it('should handle no remaining completed tasks gracefully', async () => {
            mockPool.query
                .mockResolvedValueOnce({ recordset: [] }) // For UPDATE USER_BEHAVIOR_TASK_LOG (set is_completed = 0)
                .mockResolvedValueOnce({ recordset: [] }) // For completed tasks count (0 tasks remaining)
                .mockResolvedValueOnce({ recordset: [{ month_quit: 1 }] }) // For planRes
                .mockResolvedValueOnce({ recordset: [] }) // For reset points
                .mockResolvedValueOnce({ recordset: [{ total: 10 }] }) // For HABIT_LOG SUM points
                .mockResolvedValueOnce({ recordset: [{ total: 0 }] }) // For USER_BEHAVIOR_TASK_LOG SUM points
                .mockResolvedValueOnce({ recordset: [] }); // For USER_SCORE MERGE

            const res = await request(app)
                .post('/habit-log/delete-task-log')
                .send({ date: testDate, timeSlot: testTimeSlot });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã bỏ tích nhiệm vụ và cập nhật điểm' });
            // Expect the query to *not* be called with the points_awarded update because completedCount is 0
            expect(mockPool.query).not.toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE USER_BEHAVIOR_TASK_LOG.*SET points_awarded = @point.*WHERE.*is_completed = 1/is)
            );
            // Expect 'point' input not to be called for this specific query
            expect(mockPool.input).not.toHaveBeenCalledWith('point', sql.Float, expect.any(Number));
            expect(mockPool.input).toHaveBeenCalledWith('total_points', sql.Float, 10); // Only habit points
        });

        it('should return 400 if date or timeSlot is missing/invalid', async () => {
            const res1 = await request(app)
                .post('/habit-log/delete-task-log')
                .send({ timeSlot: testTimeSlot }); // Missing date

            expect(res1.statusCode).toEqual(400);
            expect(res1.body).toEqual({ success: false, message: 'Thiếu ngày hoặc timeSlot không hợp lệ' });

            const res2 = await request(app)
                .post('/habit-log/delete-task-log')
                .send({ date: testDate }); // Missing timeSlot

            expect(res2.statusCode).toEqual(400);
            expect(res2.body).toEqual({ success: false, message: 'Thiếu ngày hoặc timeSlot không hợp lệ' });

            const res3 = await request(app)
                .post('/habit-log/delete-task-log')
                .send({ date: testDate, timeSlot: 'invalid' }); // Invalid timeSlot

            expect(res3.statusCode).toEqual(400);
            expect(res3.body).toEqual({ success: false, message: 'Thiếu ngày hoặc timeSlot không hợp lệ' });
            expect(mockPool.connect).not.toHaveBeenCalled();
        });

        it('should return 500 if there is a database error', async () => {
            // Ensure mockRejectedValue is set for this specific test
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/habit-log/delete-task-log')
                .send({ date: testDate, timeSlot: testTimeSlot });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ success: false, message: 'Lỗi server khi bỏ tích nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi khi bỏ tích task:",
                expect.any(Error)
            );
        });

        it('should return 401 if not authenticated', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app)
                .post('/habit-log/delete-task-log')
                .send({ date: testDate, timeSlot: testTimeSlot });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
        });
    });

    // =========================================================================
    // POST /habit-log/submit-task-completion (submitBehaviorTaskCompletion)
    // =========================================================================
    describe('POST /habit-log/submit-task-completion', () => {
        const testDate = '2025-07-25';
        const testTimeSlot = 0;
        const testCompleted = true;

        it('should successfully update is_completed for an existing task log', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] }); // For MERGE statement

            const res = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: testCompleted });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã cập nhật trạng thái hoàn thành nhiệm vụ' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1);
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('log_date', sql.Date, testDate);
            expect(mockPool.input).toHaveBeenCalledWith('time_slot', sql.Int, testTimeSlot);
            expect(mockPool.input).toHaveBeenCalledWith('is_completed', sql.Bit, testCompleted);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/MERGE USER_BEHAVIOR_TASK_LOG AS target.*ON \(target\.user_id = source\.user_id AND target\.log_date = source\.log_date AND target\.time_slot = source\.time_slot\).*WHEN MATCHED THEN.*UPDATE SET is_completed = @is_completed.*WHEN NOT MATCHED THEN.*INSERT \(user_id, log_date, time_slot, is_completed, task_id\).*VALUES \(@user_id, @log_date, @time_slot, @is_completed, NULL\)/is)
            );
        });

        it('should successfully insert a new task log with is_completed and NULL task_id if not exists', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] }); // For MERGE statement

            const res = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: false }); // Test with false/uncompleted

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ success: true, message: 'Đã cập nhật trạng thái hoàn thành nhiệm vụ' });
            expect(auth).toHaveBeenCalledTimes(1);
            expect(mockPool.input).toHaveBeenCalledWith('is_completed', sql.Bit, false);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/MERGE USER_BEHAVIOR_TASK_LOG AS target.*WHEN NOT MATCHED THEN.*INSERT \(user_id, log_date, time_slot, is_completed, task_id\).*VALUES \(@user_id, @log_date, @time_slot, @is_completed, NULL\)/is)
            );
        });

        it('should handle completed as string "true" or "false"', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const resTrue = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: "true" });
            expect(resTrue.statusCode).toEqual(200);
            expect(mockPool.input).toHaveBeenCalledWith('is_completed', sql.Bit, true);

            const resFalse = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: "false" });
            expect(resFalse.statusCode).toEqual(200);
            expect(mockPool.input).toHaveBeenCalledWith('is_completed', sql.Bit, false);
        });

        it('should handle completed as 1 or 0', async () => {
            mockPool.query.mockResolvedValue({ recordset: [] });

            const resOne = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: 1 });
            expect(resOne.statusCode).toEqual(200);
            expect(mockPool.input).toHaveBeenCalledWith('is_completed', sql.Bit, true);

            const resZero = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: 0 });
            expect(resZero.statusCode).toEqual(200);
            expect(mockPool.input).toHaveBeenCalledWith('is_completed', sql.Bit, false);
        });

        it('should return 400 if date or timeSlot is missing', async () => {
            const res1 = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ timeSlot: testTimeSlot, completed: testCompleted }); // Missing date

            expect(res1.statusCode).toEqual(400);
            expect(res1.body).toEqual({ success: false, message: 'Thiếu dữ liệu' });
            expect(mockPool.connect).not.toHaveBeenCalled();

            const res2 = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ date: testDate, completed: testCompleted }); // Missing timeSlot

            expect(res2.statusCode).toEqual(400);
            expect(res2.body).toEqual({ success: false, message: 'Thiếu dữ liệu' });
            expect(mockPool.connect).not.toHaveBeenCalled();
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: testCompleted });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ success: false, message: 'Lỗi server' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "❌ Lỗi tick nhiệm vụ hành vi:",
                expect.any(Error)
            );
        });

        it('should return 401 if not authenticated', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app)
                .post('/habit-log/submit-task-completion')
                .send({ date: testDate, timeSlot: testTimeSlot, completed: testCompleted });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
        });
    });
});
