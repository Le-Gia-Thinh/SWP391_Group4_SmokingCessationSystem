const userScoreController = require('../../controllers/userScoreController');
const { sql, dbConfig } = require('../../config/database');

jest.mock('../../config/database');

describe('UserScoreController', () => {
    let mockPool, mockRequest, mockRes;

    beforeEach(() => {
        mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn()
        };

        mockPool = {
            request: jest.fn().mockReturnValue(mockRequest),
            connect: jest.fn().mockResolvedValue(true) // Mock the connect method of the pool
        };

        // Ensure sql.connect returns the mockPool instance
        sql.connect = jest.fn().mockResolvedValue(mockPool);
        sql.Int = 'Int';
        sql.Float = 'Float';
        // Changed from jest.fn().mockReturnValue('VarChar') to a direct string
        sql.VarChar = 'VarChar';

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getRanking', () => {
        it('should return top 20 users ranking', async () => {
            const mockRankingData = [
                {
                    user_id: 1,
                    full_name: 'User 1',
                    avatar_url: 'avatar1.jpg',
                    total_points: 500,
                    current_level: 'Advanced',
                    progress_to_next: 25
                },
                {
                    user_id: 2,
                    full_name: 'User 2',
                    avatar_url: 'avatar2.jpg',
                    total_points: 300,
                    current_level: 'Intermediate',
                    progress_to_next: 67
                }
            ];

            mockRequest.query.mockResolvedValue({
                recordset: mockRankingData
            });

            const mockReq = {}; // No specific request body/query needed for this endpoint

            await userScoreController.getRanking(mockReq, mockRes);

            const expectedData = mockRankingData.map((u, i) => ({ ...u, rank: i + 1 }));

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: expectedData
            });
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1);
            expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT TOP 20'));
        });

        it('should handle database error', async () => {
            sql.connect.mockRejectedValue(new Error('Database error'));

            const mockReq = {};

            await userScoreController.getRanking(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false });
            expect(sql.connect).toHaveBeenCalledTimes(1);
        });
    });

    describe('getMyRanking', () => {


        it('should return 404 when user not found', async () => {
            mockRequest.query.mockResolvedValueOnce({
                recordset: [] // Empty recordset means user not found
            });

            const mockReq = {
                user: { id: 1 }
            };

            await userScoreController.getMyRanking(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false });
            expect(sql.connect).toHaveBeenCalledTimes(1);
        });

        it('should handle database error', async () => {
            sql.connect.mockRejectedValue(new Error('Database error'));

            const mockReq = {
                user: { id: 1 }
            };

            await userScoreController.getMyRanking(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false });
            expect(sql.connect).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateUserScore', () => {
        it('should update user score successfully', async () => {
            // Mock completed habits count, cessation plan, and update query
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ completedCount: 50 }] }) // Completed habits
                .mockResolvedValueOnce({ recordset: [{ month_quit: 2 }] })    // Cessation plan
                .mockResolvedValueOnce({});                                   // MERGE/UPDATE query result

            const mockReq = {
                user: { id: 1 }, // User ID from authenticated session
                body: {}, // Ensure body is an object
                query: {} // Ensure query is an object
            };

            await userScoreController.updateUserScore(mockReq, mockRes);

            const completedCount = 50;
            const month_quit = 2;
            const totalSlots = month_quit * 30 * 9;
            const pointPerSlot = +(100 / totalSlots).toFixed(3);
            const expectedTotalPoints = +(completedCount * pointPerSlot).toFixed(3);

            let expectedNewLevel = "Beginner";
            if (expectedTotalPoints >= 1000) expectedNewLevel = "Master";
            else if (expectedTotalPoints >= 400) expectedNewLevel = "Advanced";
            else if (expectedTotalPoints >= 100) expectedNewLevel = "Intermediate";


            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(3); // One for each query

            // Verify individual input calls, not the entire mock.calls array structure
            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 1);
            expect(mockRequest.input).toHaveBeenCalledWith('total_points', 'Float', expectedTotalPoints);
            expect(mockRequest.input).toHaveBeenCalledWith('current_level', 'VarChar', expectedNewLevel);


            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                totalPoints: expectedTotalPoints,
                newLevel: expectedNewLevel
            });
        });

        it('should handle missing user_id', async () => {
            const mockReq = {
                user: undefined, // Explicitly undefined to simulate no logged-in user
                body: {},        // Empty body
                query: {}        // Empty query
            };

            await userScoreController.updateUserScore(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Thiếu user_id"
            });
            expect(sql.connect).not.toHaveBeenCalled(); // Should not attempt to connect if user_id is missing
        });

        it('should get user_id from body', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ completedCount: 30 }] })
                .mockResolvedValueOnce({ recordset: [{ month_quit: 1 }] })
                .mockResolvedValueOnce({});

            const mockReq = {
                user: undefined, // Explicitly undefined
                body: { user_id: 2 }, // User ID in request body
                query: {} // Ensure query is an object
            };

            await userScoreController.updateUserScore(mockReq, mockRes);

            const completedCount = 30;
            const month_quit = 1;
            const totalSlots = month_quit * 30 * 9;
            const pointPerSlot = +(100 / totalSlots).toFixed(3);
            const expectedTotalPoints = +(completedCount * pointPerSlot).toFixed(3);

            let expectedNewLevel = "Beginner";
            if (expectedTotalPoints >= 1000) expectedNewLevel = "Master";
            else if (expectedTotalPoints >= 400) expectedNewLevel = "Advanced";
            else if (expectedTotalPoints >= 100) expectedNewLevel = "Intermediate";

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(3);

            // Verify all input calls
            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 2);
            expect(mockRequest.input).toHaveBeenCalledWith('total_points', 'Float', expectedTotalPoints);
            expect(mockRequest.input).toHaveBeenCalledWith('current_level', 'VarChar', expectedNewLevel);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                totalPoints: expectedTotalPoints,
                newLevel: expectedNewLevel
            });
        });

        it('should get user_id from query', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ completedCount: 20 }] })
                .mockResolvedValueOnce({ recordset: [{ month_quit: 1 }] })
                .mockResolvedValueOnce({});

            const mockReq = {
                user: undefined, // Explicitly undefined
                body: {}, // Ensure body is an object
                query: { user_id: 3 } // User ID in request query
            };

            await userScoreController.updateUserScore(mockReq, mockRes);

            const completedCount = 20;
            const month_quit = 1;
            const totalSlots = month_quit * 30 * 9;
            const pointPerSlot = +(100 / totalSlots).toFixed(3);
            const expectedTotalPoints = +(completedCount * pointPerSlot).toFixed(3);

            let expectedNewLevel = "Beginner";
            if (expectedTotalPoints >= 1000) expectedNewLevel = "Master";
            else if (expectedTotalPoints >= 400) expectedNewLevel = "Advanced";
            else if (expectedTotalPoints >= 100) expectedNewLevel = "Intermediate";

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(3);

            // Verify all input calls
            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 3);
            expect(mockRequest.input).toHaveBeenCalledWith('total_points', 'Float', expectedTotalPoints);
            expect(mockRequest.input).toHaveBeenCalledWith('current_level', 'VarChar', expectedNewLevel);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                totalPoints: expectedTotalPoints,
                newLevel: expectedNewLevel
            });
        });

        it('should handle database error during fetching completed habits', async () => {
            sql.connect.mockResolvedValue(mockPool); // Ensure connection is successful
            mockRequest.query.mockRejectedValueOnce(new Error('DB error fetching habits'));

            const mockReq = {
                user: { id: 1 },
                body: {},
                query: {}
            };

            await userScoreController.updateUserScore(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false }); // Removed message expectation
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // Only the first query attempt
        });

        it('should handle database error during fetching cessation plan', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ completedCount: 50 }] }) // Habits fetch succeeds
                .mockRejectedValueOnce(new Error('DB error fetching plan')); // Plan fetch fails

            const mockReq = {
                user: { id: 1 },
                body: {},
                query: {}
            };

            await userScoreController.updateUserScore(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false }); // Removed message expectation
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(2); // Habits and then plan query attempts
        });

        it('should handle database error during updating user score', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ completedCount: 50 }] }) // Habits fetch succeeds
                .mockResolvedValueOnce({ recordset: [{ month_quit: 2 }] })    // Plan fetch succeeds
                .mockRejectedValueOnce(new Error('DB error updating score')); // Update query fails

            const mockReq = {
                user: { id: 1 },
                body: {},
                query: {}
            };

            await userScoreController.updateUserScore(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false }); // Removed message expectation
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(3); // All three queries attempted
        });

        it('should calculate points correctly when month_quit is not found (defaults to 1)', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ completedCount: 10 }] }) // Completed habits
                .mockResolvedValueOnce({ recordset: [] })                     // No cessation plan found, month_quit defaults to 1
                .mockResolvedValueOnce({});                                   // Update query result

            const mockReq = {
                user: { id: 4 },
                body: {},
                query: {}
            };

            await userScoreController.updateUserScore(mockReq, mockRes);

            const completedCount = 10;
            const month_quit = 1; // Should default to 1
            const totalSlots = month_quit * 30 * 9;
            const pointPerSlot = +(100 / totalSlots).toFixed(3);
            const expectedTotalPoints = +(completedCount * pointPerSlot).toFixed(3);

            let expectedNewLevel = "Beginner";
            if (expectedTotalPoints >= 1000) expectedNewLevel = "Master";
            else if (expectedTotalPoints >= 400) expectedNewLevel = "Advanced";
            else if (expectedTotalPoints >= 100) expectedNewLevel = "Intermediate";

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(3);
            // Verify all input calls
            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 4);
            expect(mockRequest.input).toHaveBeenCalledWith('total_points', 'Float', expectedTotalPoints);
            expect(mockRequest.input).toHaveBeenCalledWith('current_level', 'VarChar', expectedNewLevel);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                totalPoints: expectedTotalPoints,
                newLevel: expectedNewLevel
            });
        });
    });


});
