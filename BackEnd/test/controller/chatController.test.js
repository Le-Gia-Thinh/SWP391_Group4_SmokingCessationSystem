// Import the actual chatController (will be re-imported inside beforeEach)
let chatController;
let sql; // Declare sql here to be assigned in beforeEach
let upload; // Declare upload here to be assigned in beforeEach

// Mock the database module
jest.mock('../../config/database', () => {
    // This factory function will be called every time the module is required
    // It should define how a new ConnectionPool behaves
    const createMockRequest = () => ({
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    });

    const createMockPool = () => {
        const pool = {
            request: jest.fn(createMockRequest), // Each call to request() returns a new mockRequest
            connect: jest.fn().mockResolvedValue(true),
            close: jest.fn().mockResolvedValue(true),
        };
        return pool;
    };

    return {
        sql: {
            ConnectionPool: jest.fn(createMockPool), // ConnectionPool constructor returns a new mockPool
            connect: jest.fn(() => createMockPool()), // sql.connect also returns a new mockPool
            Int: 'Int',
            VarChar: 'VarChar',
            NVarChar: 'NVarChar',
            Bit: 'Bit',
        },
        dbConfig: {}, // Mock dbConfig
    };
});

// Mock the chatUpload middleware
jest.mock('../../utils/chatUpload', () => {
    return {
        single: jest.fn((fieldName) => (req, res, next) => {
            // This mock middleware will simply call next()
            // req.file and req.body will be set directly in the test case's mockReq
            next();
        }),
    };
});

describe('Chat Controller', () => {
    let mockReq, mockRes, mockNext;
    let mockPool;
    let mockRequestInstances = []; // Array to hold mockRequest instances created by mockPool.request()
    let consoleErrorSpy, consoleLogSpy;

    beforeEach(() => {
        // Reset modules to ensure a fresh mock for database and upload is loaded
        jest.resetModules();

        // Re-import the mocked modules to get their fresh instances
        ({ sql } = require('../../config/database')); // Re-assign sql here
        upload = require('../../utils/chatUpload'); // Get the mocked upload

        // Instantiate the mocked ConnectionPool
        mockPool = new sql.ConnectionPool();

        // Pre-create mockRequest instances for potential calls within tests
        // Max calls observed in tests is 3 for sendGuidedMessage (coach role) and getGuidedMessages (coach role).
        // Let's pre-create 5 instances to be safe.
        mockRequestInstances = Array.from({ length: 5 }, () => ({
            input: jest.fn().mockReturnThis(),
            query: jest.fn(),
        }));

        let requestCallCount = 0;
        mockPool.request.mockClear();
        mockPool.request.mockImplementation(() => {
            // Return the next pre-created mockRequest instance
            const instance = mockRequestInstances[requestCallCount];
            // Clear mocks on the instance before returning it for a fresh start in each call
            instance.input.mockClear().mockReturnThis();
            instance.query.mockClear();
            requestCallCount++;
            return instance;
        });

        // Clear and reset sql.connect for each test
        sql.connect.mockClear().mockResolvedValue(mockPool);
        mockPool.connect.mockClear().mockResolvedValue(true);
        mockPool.close.mockClear().mockResolvedValue(true);

        // Reset the upload mock implementation for each test
        upload.single.mockClear();
        upload.single.mockImplementation((fieldName) => (req, res, next) => {
            // The test case will set req.file and req.body as needed
            next();
        });

        // Re-import the chatController AFTER all mocks are set up
        chatController = require('../../controllers/chatController');

        mockReq = {
            user: { id: 1, role: 'member' }, // Default user
            body: {},
            params: {},
            query: {},
            io: { // Mock Socket.IO
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // =========================================================================
    // sendGuidedMessage
    // =========================================================================
    describe('sendGuidedMessage', () => {
        it('should send a text message from member to coach successfully', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.body = { recipient_id: 202, message: 'Hello coach!' };
            mockReq.file = null; // Explicitly set no file

            // Mock the first request call (for thread lookup)
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ thread_id: 1 }] });
            // Mock the second request call (for message insertion)
            mockRequestInstances[1].query.mockResolvedValueOnce({
                recordset: [{
                    message_id: 100,
                    thread_id: 1,
                    sender_id: 101,
                    sender_role: 'member',
                    message: 'Hello coach!',
                    file_url: null,
                    is_read: 0,
                    sent_at: new Date().toISOString(),
                }]
            });

            // Manually call the middleware and then the controller
            await new Promise(resolve => upload.single('file')(mockReq, mockRes, resolve));
            await chatController.sendGuidedMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1); // Check sql.connect
            expect(mockPool.request).toHaveBeenCalledTimes(2); // One for thread lookup, one for message insert

            // Verify inputs and queries on the correct mockRequest instances
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('member_id', sql.Int, 101);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('coach_id', sql.Int, 202);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('SELECT thread_id FROM DIRECT_CHAT_THREAD'));

            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('thread_id', sql.Int, 1);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('sender_id', sql.Int, 101);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('sender_role', sql.VarChar, 'member');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('message', sql.NVarChar, 'Hello coach!');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('file_url', sql.NVarChar, null);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('is_read', sql.Bit, 0);
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO DIRECT_MESSAGE'));

            expect(mockReq.io.to).toHaveBeenCalledWith('chat-1');
            expect(mockReq.io.emit).toHaveBeenCalledWith('receiveGuidedMessage', expect.any(Object));
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Đã gửi tin nhắn', data: expect.any(Object) });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should send a file message from coach to member successfully', async () => {
            mockReq.user = { id: 202, role: 'coach' };
            mockReq.body = { recipient_id: 101, message: '' };
            mockReq.file = { filename: 'test_file.jpg' }; // Set file directly in mockReq

            // Mock the first request call (for coach ID lookup)
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ coach_id: 500 }] });
            // Mock the second request call (for thread lookup)
            mockRequestInstances[1].query.mockResolvedValueOnce({ recordset: [{ thread_id: 2 }] });
            // Mock the third request call (for message insertion)
            mockRequestInstances[2].query.mockResolvedValueOnce({
                recordset: [{
                    message_id: 101,
                    thread_id: 2,
                    sender_id: 202,
                    sender_role: 'coach',
                    message: '',
                    file_url: '/uploads/chat/test_file.jpg',
                    is_read: 0,
                    sent_at: new Date().toISOString(),
                }]
            });

            // Manually call the middleware and then the controller
            await new Promise(resolve => upload.single('file')(mockReq, mockRes, resolve));
            await chatController.sendGuidedMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(3); // One for coach lookup, one for thread lookup, one for message insert

            // Verify inputs and queries on the correct mockRequest instances
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 202);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('SELECT coach_id FROM COACH'));

            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('member_id', sql.Int, 101);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('coach_id', sql.Int, 500);
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(expect.stringContaining('SELECT thread_id FROM DIRECT_CHAT_THREAD'));

            expect(mockRequestInstances[2].input).toHaveBeenCalledWith('file_url', sql.NVarChar, '/uploads/chat/test_file.jpg');
            expect(mockRequestInstances[2].input).toHaveBeenCalledWith('message', sql.NVarChar, ''); // Ensure message is empty string
            expect(mockRequestInstances[2].query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO DIRECT_MESSAGE'));


            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Đã gửi tin nhắn', data: expect.any(Object) });
        });

        it('should return 400 if no message or file is provided', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.body = { recipient_id: 202, message: '' };
            mockReq.file = null;

            // Manually call the middleware and then the controller
            await new Promise(resolve => upload.single('file')(mockReq, mockRes, resolve));
            await chatController.sendGuidedMessage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Phải có tin nhắn hoặc tệp đính kèm' });
            expect(sql.connect).not.toHaveBeenCalled(); // Should not attempt database connection
        });

        it('should return 403 if sender role is invalid', async () => {
            mockReq.user = { id: 101, role: 'admin' };
            mockReq.body = { recipient_id: 202, message: 'Test' };
            mockReq.file = null;

            // Manually call the middleware and then the controller
            await new Promise(resolve => upload.single('file')(mockReq, mockRes, resolve));
            await chatController.sendGuidedMessage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Vai trò không hợp lệ' });
            expect(sql.connect).toHaveBeenCalledTimes(1); // Controller attempts connect before role check
        });

        it('should return 400 if no chat thread exists', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.body = { recipient_id: 202, message: 'Test' };
            mockReq.file = null;

            // Mock the first request call (for thread lookup) to return empty
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] });

            // Manually call the middleware and then the controller
            await new Promise(resolve => upload.single('file')(mockReq, mockRes, resolve));
            await chatController.sendGuidedMessage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Chưa có box chat giữa 2 người này. Vui lòng đặt lịch trước.' });
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // Only one request call for thread lookup
        });

        it('should handle database error during thread lookup', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.body = { recipient_id: 202, message: 'Test' };
            mockReq.file = null;

            // Mock the first request call (for thread lookup) to reject
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Error'));

            // Manually call the middleware and then the controller
            await new Promise(resolve => upload.single('file')(mockReq, mockRes, resolve));
            await chatController.sendGuidedMessage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi gửi tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi gửi tin nhắn:', expect.any(Error));
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // Only one request call for thread lookup
        });

        it('should handle database error during message insertion', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.body = { recipient_id: 202, message: 'Test' };
            mockReq.file = null;

            // Mock the first request call (for thread lookup)
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ thread_id: 1 }] });
            // Mock the second request call (for message insertion) to reject
            mockRequestInstances[1].query.mockRejectedValueOnce(new Error('Insert Error'));

            // Manually call the middleware and then the controller
            await new Promise(resolve => upload.single('file')(mockReq, mockRes, resolve));
            await chatController.sendGuidedMessage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi gửi tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi gửi tin nhắn:', expect.any(Error));
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(2); // Two request calls (thread lookup + message insert attempt)
        });

        it('should handle database connection error', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.body = { recipient_id: 202, message: 'Test' };
            mockReq.file = null;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed')); // Mock sql.connect directly

            // Manually call the middleware and then the controller
            await new Promise(resolve => upload.single('file')(mockReq, mockRes, resolve));
            await chatController.sendGuidedMessage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi gửi tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi gửi tin nhắn:', expect.any(Error));
            expect(sql.connect).toHaveBeenCalledTimes(1); // Connection attempt is made
            expect(mockPool.request).not.toHaveBeenCalled(); // No request should be made if connection fails
        });
    });

    // =========================================================================
    // getGuidedMessages
    // =========================================================================
    describe('getGuidedMessages', () => {
        it('should get messages for a member successfully', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.params = { partner_id: '202' };

            // Mock the first request call (for thread lookup)
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ thread_id: 1 }] });
            // Mock the second request call (for messages)
            mockRequestInstances[1].query.mockResolvedValueOnce({ recordset: [{ message: 'Hi', sender_id: 202 }] });

            await chatController.getGuidedMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(2); // One for thread lookup, one for messages

            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('member_id', sql.Int, 101);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('coach_id', sql.Int, 202);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('SELECT thread_id FROM DIRECT_CHAT_THREAD'));

            // Use regex for stringMatching to ignore whitespace differences
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('thread_id', sql.Int, 1);
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+message_id,\s+thread_id,\s+sender_id,\s+sender_role,\s+message,\s+file_url,\s+sent_at,\s+is_read\s+FROM\s+DIRECT_MESSAGE\s+WHERE\s+thread_id\s*=\s*@thread_id\s+ORDER\s+BY\s+sent_at\s+ASC/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: [{ message: 'Hi', sender_id: 202 }] });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should get messages for a coach successfully', async () => {
            mockReq.user = { id: 202, role: 'coach' };
            mockReq.params = { partner_id: '101' };

            // Mock the first request call (for coach ID lookup)
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ coach_id: 500 }] });
            // Mock the second request call (for thread lookup)
            mockRequestInstances[1].query.mockResolvedValueOnce({ recordset: [{ thread_id: 2 }] });
            // Mock the third request call (for messages)
            mockRequestInstances[2].query.mockResolvedValueOnce({ recordset: [{ message: 'Hello', sender_id: 101 }] });

            await chatController.getGuidedMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(3); // One for coach lookup, one for thread lookup, one for messages

            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 202);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('SELECT coach_id FROM COACH'));

            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('member_id', sql.Int, 101);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('coach_id', sql.Int, 500);
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(expect.stringContaining('SELECT thread_id FROM DIRECT_CHAT_THREAD'));

            // Use regex for stringMatching to ignore whitespace differences
            expect(mockRequestInstances[2].input).toHaveBeenCalledWith('thread_id', sql.Int, 2);
            expect(mockRequestInstances[2].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+message_id,\s+thread_id,\s+sender_id,\s+sender_role,\s+message,\s+file_url,\s+sent_at,\s+is_read\s+FROM\s+DIRECT_MESSAGE\s+WHERE\s+thread_id\s*=\s*@thread_id\s+ORDER\s+BY\s+sent_at\s+ASC/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: [{ message: 'Hello', sender_id: 101 }] });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 403 if role is invalid', async () => {
            mockReq.user = { id: 1, role: 'admin' };
            mockReq.params = { partner_id: '2' };

            await chatController.getGuidedMessages(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Vai trò không hợp lệ' });
            expect(sql.connect).toHaveBeenCalledTimes(1); // Controller attempts connect before role check
            expect(mockPool.request).not.toHaveBeenCalled(); // No request should be made after role check
        });

        it('should return 404 if no chat thread found', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.params = { partner_id: '202' };

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] }); // No thread found

            await chatController.getGuidedMessages(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Chưa có box chat nào giữa 2 người này' });
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // Only one request call for thread lookup
        });

        it('should handle database error during thread lookup', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.params = { partner_id: '202' };

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Error'));

            await chatController.getGuidedMessages(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi truy xuất tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy tin nhắn:', expect.any(Error));
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // Only one request call for thread lookup
        });

        it('should handle database error during message retrieval', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.params = { partner_id: '202' };

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ thread_id: 1 }] });
            mockRequestInstances[1].query.mockRejectedValueOnce(new Error('Message retrieval error'));

            await chatController.getGuidedMessages(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi truy xuất tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy tin nhắn:', expect.any(Error));
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(2); // Two request calls (thread lookup + message retrieval attempt)
        });

        it('should handle database connection error', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockReq.params = { partner_id: '202' };
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await chatController.getGuidedMessages(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi truy xuất tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy tin nhắn:', expect.any(Error));
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).not.toHaveBeenCalled(); // No request should be made if connection fails
        });
    });

    // =========================================================================
    // markGuidedAsRead
    // =========================================================================
    describe('markGuidedAsRead', () => {
        it('should mark messages as read successfully', async () => {
            mockReq.user = { id: 101 };
            mockReq.params = { thread_id: '1' };

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Successful update

            await chatController.markGuidedAsRead(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // One request call for update

            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('thread_id', sql.Int, 1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 101);
            // Use regex for stringMatching to ignore whitespace differences
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE\s+DIRECT_MESSAGE\s+SET\s+is_read\s*=\s*1\s+WHERE\s+thread_id\s*=\s*@thread_id\s+AND\s+sender_id\s*<>\s*@user_id\s+AND\s+is_read\s*=\s*0/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Đã đánh dấu là đã đọc' });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error', async () => {
            mockReq.user = { id: 101 };
            mockReq.params = { thread_id: '1' };

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Error'));

            await chatController.markGuidedAsRead(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi đánh dấu đã đọc' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi đánh dấu đã đọc:', expect.any(Error));
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // One request call for update attempt
        });

        it('should handle database connection error', async () => {
            mockReq.user = { id: 101 };
            mockReq.params = { thread_id: '1' };
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await chatController.markGuidedAsRead(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi đánh dấu đã đọc' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi đánh dấu đã đọc:', expect.any(Error));
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).not.toHaveBeenCalled(); // No request should be made if connection fails
        });
    });

    // =========================================================================
    // getChatThreads
    // =========================================================================
    describe('getChatThreads', () => {
        it('should get chat threads for a member successfully', async () => {
            mockReq.user = { id: 101, role: 'member' };
            const mockThreads = [
                { thread_id: 1, coach_id: 202, coach_name: 'Coach A', last_message: 'Hi', last_time: new Date().toISOString() }
            ];

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockThreads });

            await chatController.getChatThreads(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // One request call for threads

            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('userId', sql.Int, 101);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringMatching(/FROM\s+DIRECT_CHAT_THREAD\s+t\s+JOIN\s+COACH\s+co\s+ON\s+t\.coach_id\s*=\s*co\.coach_id\s+JOIN\s+CUSTOMER\s+c\s+ON\s+co\.user_id\s*=\s*c\.user_id\s+WHERE\s+t\.member_id\s*=\s*@userId/i));
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockThreads });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should get chat threads for a coach successfully', async () => {
            mockReq.user = { id: 202, role: 'coach' };
            const mockThreads = [
                { thread_id: 2, member_id: 101, member_name: 'Member B', last_message: 'Ok', last_time: new Date().toISOString() }
            ];

            // Mock the first request call (for coach ID lookup)
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ coach_id: 500 }] });
            // Mock the second request call (for threads)
            mockRequestInstances[1].query.mockResolvedValueOnce({ recordset: mockThreads });

            await chatController.getChatThreads(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(2); // One for coach lookup, one for threads

            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 202);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('SELECT coach_id FROM COACH'));

            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('userId', sql.Int, 202); // userId is used in the final query input
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(expect.stringMatching(/FROM\s+DIRECT_CHAT_THREAD\s+t\s+JOIN\s+CUSTOMER\s+c\s+ON\s+t\.member_id\s*=\s*c\.user_id\s+WHERE\s+t\.coach_id\s*=\s*500/i));
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockThreads });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 403 if role is invalid', async () => {
            mockReq.user = { id: 1, role: 'admin' };

            await chatController.getChatThreads(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Vai trò không hợp lệ' });
            expect(sql.connect).toHaveBeenCalledTimes(1); // Controller attempts connect before role check
            expect(mockPool.request).not.toHaveBeenCalled(); // No request should be made after role check
        });

        it('should handle database error during coach ID lookup for coach role', async () => {
            mockReq.user = { id: 202, role: 'coach' };
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('Coach lookup error'));

            await chatController.getChatThreads(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi truy xuất danh sách box chat' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy danh sách box chat:', expect.any(Error)); // Corrected space
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // One request call for coach lookup attempt
        });

        it('should handle database error during thread retrieval', async () => {
            mockReq.user = { id: 101, role: 'member' };
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('Threads retrieval error'));

            await chatController.getChatThreads(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi truy xuất danh sách box chat' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy danh sách box chat:', expect.any(Error)); // Corrected space
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).toHaveBeenCalledTimes(1); // One request call for thread retrieval attempt
        });

        it('should handle database connection error', async () => {
            mockReq.user = { id: 101, role: 'member' };
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await chatController.getChatThreads(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi truy xuất danh sách box chat' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy danh sách box chat:', expect.any(Error)); // Corrected space
            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPool.request).not.toHaveBeenCalled(); // No request should be made if connection fails
        });
    });
});
