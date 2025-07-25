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

describe('Topic Chat Controller', () => {
    let topicChatController;
    let sql;
    let mockReq, mockRes;
    let mockPoolInstance;
    let mockRequestInstances = [];
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();
        ({ sql } = require('../../config/database'));
        topicChatController = require('../../controllers/topicChatController');

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
            params: {},
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
    // createTopic
    // =========================================================================
    describe('createTopic', () => {
        it('should create a topic successfully', async () => {
            mockReq.body = { title: 'New Topic', description: 'Description for new topic.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Successful insertion

            await topicChatController.createTopic(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('creator_id', sql.Int, 101);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('title', sql.NVarChar, 'New Topic');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('description', sql.NVarChar, 'Description for new topic.');
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO CHAT_TOPIC (creator_id, title, description) VALUES (@creator_id, @title, @description)'));
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Chủ đề đã tạo' });
        });

        it('should handle database error during topic creation', async () => {
            mockReq.body = { title: 'Error Topic', description: 'Error description.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Insert Error'));

            await topicChatController.createTopic(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi tạo chủ đề' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle database connection error for createTopic', async () => {
            mockReq.body = { title: 'Conn Error Topic', description: 'Conn error description.' };
            mockReq.user.id = 101;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await topicChatController.createTopic(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi tạo chủ đề' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    // =========================================================================
    // getTopics
    // =========================================================================
    describe('getTopics', () => {
        it('should get all topics successfully', async () => {
            const mockTopics = [{ topic_id: 1, title: 'Topic 1', full_name: 'User A' }];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockTopics });

            await topicChatController.getTopics(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+t\.\*,\s+u\.full_name\s+FROM\s+CHAT_TOPIC\s+t\s+JOIN\s+CUSTOMER\s+u\s+ON\s+t\.creator_id\s*=\s*u\.user_id\s+ORDER\s+BY\s+created_at\s+DESC/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith(mockTopics);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return empty array if no topics found', async () => {
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] });

            await topicChatController.getTopics(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during topics retrieval', async () => {
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await topicChatController.getTopics(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi lấy danh sách chủ đề' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle database connection error for getTopics', async () => {
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await topicChatController.getTopics(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi lấy danh sách chủ đề' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    // =========================================================================
    // sendTopicMessage
    // =========================================================================
    describe('sendTopicMessage', () => {
        it('should send a topic message successfully and emit to socket', async () => {
            mockReq.body = { topic_id: 1, content: 'Message for topic 1!' };
            mockReq.user.id = 101;
            const sentAt = new Date();

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ full_name: 'Test User' }] }); // User lookup
            mockRequestInstances[1].query.mockResolvedValueOnce({ // Message insertion
                recordset: [{
                    topic_id: 1,
                    user_id: 101,
                    content: 'Message for topic 1!',
                    sent_at: sentAt,
                }]
            });

            await topicChatController.sendTopicMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2); // One for user lookup, one for message insert
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 101);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith('SELECT full_name FROM CUSTOMER WHERE user_id = @user_id');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('topic_id', sql.Int, 1);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('user_id', sql.Int, 101);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('content', sql.NVarChar, 'Message for topic 1!');
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO TOPIC_MESSAGE (topic_id, user_id, content) OUTPUT INSERTED.* VALUES (@topic_id, @user_id, @content)'));
            expect(mockReq.io.emit).toHaveBeenCalledWith('topicMessage', {
                topic_id: 1,
                user_id: 101,
                full_name: 'Test User',
                content: 'Message for topic 1!',
                sent_at: sentAt,
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Gửi tin nhắn thành công' });
        });

        it('should send a message with anonymous user if full_name is not found', async () => {
            mockReq.body = { topic_id: 1, content: 'Message for topic 1!' };
            mockReq.user.id = 101;
            const sentAt = new Date();

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] }); // User lookup returns empty
            mockRequestInstances[1].query.mockResolvedValueOnce({ // Message insertion
                recordset: [{
                    topic_id: 1,
                    user_id: 101,
                    content: 'Message for topic 1!',
                    sent_at: sentAt,
                }]
            });

            await topicChatController.sendTopicMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockReq.io.emit).toHaveBeenCalledWith('topicMessage', {
                topic_id: 1,
                user_id: 101,
                full_name: 'Ẩn danh', // Expect anonymous
                content: 'Message for topic 1!',
                sent_at: sentAt,
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Gửi tin nhắn thành công' });
        });

        it('should handle database error during user lookup for sendTopicMessage', async () => {
            mockReq.body = { topic_id: 1, content: 'Error message.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB User Lookup Error'));

            await topicChatController.sendTopicMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockReq.io.emit).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi gửi tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle database error during message insertion for sendTopicMessage', async () => {
            mockReq.body = { topic_id: 1, content: 'Error message.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ full_name: 'Test User' }] });
            mockRequestInstances[1].query.mockRejectedValueOnce(new Error('DB Insert Error'));

            await topicChatController.sendTopicMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockReq.io.emit).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi gửi tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle database connection error for sendTopicMessage', async () => {
            mockReq.body = { topic_id: 1, content: 'Connection error message.' };
            mockReq.user.id = 101;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await topicChatController.sendTopicMessage(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockReq.io.emit).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi gửi tin nhắn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    // =========================================================================
    // getTopicMessages
    // =========================================================================
    describe('getTopicMessages', () => {
        it('should get messages for a topic successfully', async () => {
            mockReq.params.topicId = 1;
            const mockMessages = [{ message_id: 1, content: 'Topic Msg 1', full_name: 'User A' }];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockMessages });

            await topicChatController.getTopicMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('topic_id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+m\.\*,\s+u\.full_name\s+FROM\s+TOPIC_MESSAGE\s+m\s+JOIN\s+CUSTOMER\s+u\s+ON\s+m\.user_id\s*=\s*u\.user_id\s+WHERE\s+m\.topic_id\s*=\s*@topic_id\s+ORDER\s+BY\s+sent_at\s+ASC/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith(mockMessages);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return empty array if no messages found for a topic', async () => {
            mockReq.params.topicId = 999;
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] });

            await topicChatController.getTopicMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('topic_id', sql.Int, 999);
            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during topic messages retrieval', async () => {
            mockReq.params.topicId = 1;
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await topicChatController.getTopicMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi lấy tin nhắn chủ đề' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle database connection error for getTopicMessages', async () => {
            mockReq.params.topicId = 1;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await topicChatController.getTopicMessages(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi lấy tin nhắn chủ đề' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
