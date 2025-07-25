// Mock the database module
jest.mock('../../config/database', () => {
    return {
        sql: {
            ConnectionPool: jest.fn(),
            connect: jest.fn(),
            Int: 'Int',
            VarChar: 'VarChar',
            NVarChar: 'NVarChar',
        },
        dbConfig: {},
    };
});

// Mock the middleware/auth module
jest.mock('../../middleware/auth', () => ({
    auth: jest.fn((req, res, next) => {
        req.user = { id: 1 }; // Default mock user
        next();
    }),
    authorize: jest.fn((roles) => (req, res, next) => {
        // This controller doesn't use authorize, but mock it for consistency
        next();
    }),
}));

describe('Notification Controller', () => {
    let notificationController;
    let sql;
    let mockReq, mockRes;
    let mockPoolInstance;
    let mockRequestInstances = [];
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();
        ({ sql } = require('../../config/database'));
        notificationController = require('../../controllers/notificationController');

        mockPoolInstance = {
            request: jest.fn(),
            connect: jest.fn().mockResolvedValue(true),
            close: jest.fn().mockResolvedValue(true),
        };

        sql.ConnectionPool.mockImplementation(() => mockPoolInstance);
        sql.connect.mockResolvedValue(mockPoolInstance);

        mockRequestInstances = Array.from({ length: 5 }, () => ({
            input: jest.fn().mockReturnThis(),
            query: jest.fn(),
        }));

        let requestCallCount = 0;
        mockPoolInstance.request.mockImplementation(() => {
            const instance = mockRequestInstances[requestCallCount];
            instance.input.mockClear().mockReturnThis();
            instance.query.mockClear();
            requestCallCount++;
            return instance;
        });

        mockReq = {
            user: { id: 1 },
            params: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // =========================================================================
    // getUserNotifications
    // =========================================================================
    describe('getUserNotifications', () => {
        it('should get user notifications successfully', async () => {
            mockReq.user.id = 1;
            const mockNotifications = [
                { id: 1, user_id: 1, message: 'Notification 1', created_at: new Date() },
                { id: 2, user_id: 1, message: 'Notification 2', created_at: new Date() },
            ];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockNotifications });

            await notificationController.getUserNotifications(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+TOP\s+20\s+\*\s+FROM\s+NOTIFICATION\s+WHERE\s+user_id\s*=\s*@user_id\s+ORDER\s+BY\s+created_at\s+DESC/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith(mockNotifications);
            expect(mockRes.status).not.toHaveBeenCalled(); // Should not call status for 200 OK
        });

        it('should return empty array if no notifications found for the user', async () => {
            mockReq.user.id = 999;
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] });

            await notificationController.getUserNotifications(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 999);
            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during notifications retrieval', async () => {
            mockReq.user.id = 1;
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await notificationController.getUserNotifications(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi máy chủ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi lấy thông báo:', expect.any(Error));
        });

        it('should handle database connection error for getUserNotifications', async () => {
            mockReq.user.id = 1;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await notificationController.getUserNotifications(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi máy chủ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi lấy thông báo:', expect.any(Error));
        });
    });
});
