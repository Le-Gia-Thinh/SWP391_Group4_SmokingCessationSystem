// Mock the database module
jest.mock('../../config/database', () => {
    return {
        sql: {
            ConnectionPool: jest.fn(),
            connect: jest.fn(),
            Int: 'Int',
            VarChar: 'VarChar',
            NVarChar: 'NVarChar',
            Bit: 'Bit',
        },
        dbConfig: {},
    };
});

describe('Community Chat Controller', () => {
    let communityChatController;
    let sql;
    let mockReq, mockRes;
    let mockPoolInstance;
    let mockRequestInstances = [];
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();
        ({ sql } = require('../../config/database'));
        communityChatController = require('../../controllers/communityChatController');

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
            user: { id: 101 },
            body: {},
            io: {
                emit: jest.fn(),
            },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // =========================================================================
    // sendMessage
    // =========================================================================
    describe('sendMessage', () => {
        it('should send a message successfully and emit to socket', async () => {
            mockReq.body = { content: 'Hello everyone!' };
            mockReq.user.id = 101;
            const sentAt = new Date();

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ full_name: 'Test User' }] }); // User lookup
            mockRequestInstances[1].query.mockResolvedValueOnce({ // Message insertion
                recordset: [{
                    user_id: 101,
                    content: 'Hello everyone!',
                    sent_at: sentAt,
                }]
            });

            await communityChatController.sendMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2); // One for user lookup, one for message insert
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 101);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith('SELECT full_name FROM CUSTOMER WHERE user_id = @user_id');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('user_id', sql.Int, 101);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('content', sql.NVarChar, mockReq.body.content); // Use mockReq.body.content
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO COMMUNITY_CHAT (user_id, content) OUTPUT INSERTED.* VALUES (@user_id, @content)'));
            expect(mockReq.io.emit).toHaveBeenCalledWith('communityMessage', {
                user_id: 101,
                full_name: 'Test User',
                content: 'Hello everyone!',
                sent_at: sentAt,
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Đã gửi tin nhắn' });
        });

        it('should send a message successfully with anonymous user if full_name is not found', async () => {
            mockReq.body = { content: 'Hello everyone!' };
            mockReq.user.id = 101;
            const sentAt = new Date();

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] }); // User lookup returns empty
            mockRequestInstances[1].query.mockResolvedValueOnce({ // Message insertion
                recordset: [{
                    user_id: 101,
                    content: 'Hello everyone!',
                    sent_at: sentAt,
                }]
            });

            await communityChatController.sendMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockReq.io.emit).toHaveBeenCalledWith('communityMessage', {
                user_id: 101,
                full_name: 'Ẩn danh', // Expect anonymous
                content: 'Hello everyone!',
                sent_at: sentAt,
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Đã gửi tin nhắn' });
        });

        it('should handle database error during user lookup for sendMessage', async () => {
            mockReq.body = { content: 'Error message.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB User Lookup Error'));

            await communityChatController.sendMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockReq.io.emit).not.toHaveBeenCalled(); // No emit on error
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi gửi tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database error during message insertion for sendMessage', async () => {
            mockReq.body = { content: 'Error message.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ full_name: 'Test User' }] });
            mockRequestInstances[1].query.mockRejectedValueOnce(new Error('DB Insert Error'));

            await communityChatController.sendMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockReq.io.emit).not.toHaveBeenCalled(); // No emit on error
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi gửi tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error for sendMessage', async () => {
            mockReq.body = { content: 'Connection error message.' };
            mockReq.user.id = 101;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await communityChatController.sendMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockReq.io.emit).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi gửi tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // getMessages
    // =========================================================================
    describe('getMessages', () => {
        it('should get all messages successfully', async () => {
            const mockMessages = [{ chat_id: 1, content: 'Msg 1', full_name: 'User A' }];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockMessages });

            await communityChatController.getMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('SELECT c.*, u.full_name FROM COMMUNITY_CHAT c'));
            expect(mockRes.json).toHaveBeenCalledWith(mockMessages);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return empty array if no messages found', async () => {
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] });

            await communityChatController.getMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during message retrieval', async () => {
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await communityChatController.getMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi lấy tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error for getMessages', async () => {
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await communityChatController.getMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi lấy tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });
});
