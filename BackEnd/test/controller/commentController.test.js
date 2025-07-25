// Mock the database module
jest.mock('../../config/database', () => {
    // We need to ensure that each test gets a fresh set of mocks.
    // This factory function will be called once per `jest.mock` execution.
    // The actual mock behavior needs to be controlled within `beforeEach`.
    return {
        sql: {
            ConnectionPool: jest.fn(), // Will be mocked further in beforeEach
            connect: jest.fn(),       // Will be mocked further in beforeEach
            Int: 'Int',
            VarChar: 'VarChar',
            NVarChar: 'NVarChar',
            Bit: 'Bit',
        },
        dbConfig: {},
    };
});

describe('Comment Controller', () => {
    let commentController;
    let sql; // This will hold the mocked sql object from '../../config/database'
    let mockReq, mockRes;
    let mockPoolInstance; // To hold the specific pool instance for the test
    let mockRequestInstances = []; // To hold specific request instances
    let consoleErrorSpy;

    beforeEach(() => {
        // Reset modules to ensure a fresh mock for database is loaded
        jest.resetModules();

        // Re-import the mocked database module
        // This gets the mock functions from the `jest.mock` factory above
        ({ sql } = require('../../config/database'));
        commentController = require('../../controllers/commentController');

        // Create a new mock pool instance for each test
        mockPoolInstance = {
            request: jest.fn(),
            connect: jest.fn().mockResolvedValue(true),
            close: jest.fn().mockResolvedValue(true),
        };

        // Mock sql.ConnectionPool constructor to return our specific mockPoolInstance
        sql.ConnectionPool.mockImplementation(() => mockPoolInstance);
        // Mock sql.connect to return our specific mockPoolInstance
        sql.connect.mockResolvedValue(mockPoolInstance);

        // Pre-create mockRequest instances for potential calls within tests
        // Max calls observed in tests for comment controller is 2 (e.g., lookup then update/delete).
        // Let's pre-create 5 instances to be safe for all controllers.
        mockRequestInstances = Array.from({ length: 5 }, () => ({
            input: jest.fn().mockReturnThis(),
            query: jest.fn(),
        }));

        let requestCallCount = 0;
        mockPoolInstance.request.mockImplementation(() => {
            // Return the next pre-created mockRequest instance
            const instance = mockRequestInstances[requestCallCount];
            // Clear mocks on the instance before returning it for a fresh start in each call
            instance.input.mockClear().mockReturnThis();
            instance.query.mockClear();
            requestCallCount++;
            return instance;
        });

        mockReq = {
            user: { id: 101, role: 'member' },
            body: {},
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
    // createComment
    // =========================================================================
    describe('createComment', () => {
        it('should create a comment successfully', async () => {
            mockReq.body = { post_id: 1, content: 'This is a test comment.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Successful insertion

            await commentController.createComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('post_id', sql.Int, 1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 101);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('content', sql.NVarChar, 'This is a test comment.');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('parent_comment_id', sql.Int, null);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO POST_COMMENT'));
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Bình luận đã được thêm' });
        });

        it('should create a reply comment successfully', async () => {
            mockReq.body = { post_id: 1, content: 'This is a reply.', parent_comment_id: 50 };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Successful insertion

            await commentController.createComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('post_id', sql.Int, 1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 101);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('content', sql.NVarChar, 'This is a reply.');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('parent_comment_id', sql.Int, 50);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO POST_COMMENT'));
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Bình luận đã được thêm' });
        });

        it('should handle database error during comment creation', async () => {
            mockReq.body = { post_id: 1, content: 'Error comment.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Insert Error'));

            await commentController.createComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi thêm bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error', async () => {
            mockReq.body = { post_id: 1, content: 'Connection error comment.' };
            mockReq.user.id = 101;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await commentController.createComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi thêm bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // getCommentsByPost
    // =========================================================================
    describe('getCommentsByPost', () => {
        it('should get comments for a post successfully', async () => {
            mockReq.params.postId = 1;
            const mockComments = [{ comment_id: 1, content: 'Comment 1', full_name: 'User A' }];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockComments });

            await commentController.getCommentsByPost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('post_id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('SELECT c.*, u.full_name FROM POST_COMMENT c'));
            expect(mockRes.json).toHaveBeenCalledWith(mockComments);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return empty array if no comments found for a post', async () => {
            mockReq.params.postId = 999;
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] });

            await commentController.getCommentsByPost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('post_id', sql.Int, 999);
            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during comment retrieval', async () => {
            mockReq.params.postId = 1;
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await commentController.getCommentsByPost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi khi lấy danh sách bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error during comment retrieval', async () => {
            mockReq.params.postId = 1;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await commentController.getCommentsByPost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi khi lấy danh sách bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // updateComment
    // =========================================================================
    describe('updateComment', () => {
        it('should update a comment successfully if user is owner', async () => {
            mockReq.params.id = 1;
            mockReq.body = { content: 'Updated comment content' };
            mockReq.user.id = 101; // User is the owner

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ comment_id: 1, user_id: 101, content: 'Old content' }] }); // Comment lookup
            mockRequestInstances[1].query.mockResolvedValueOnce({}); // Update query

            await commentController.updateComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM POST_COMMENT WHERE comment_id = @id'));
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('content', sql.NVarChar, 'Updated comment content');
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(expect.stringContaining('UPDATE POST_COMMENT SET content = @content WHERE comment_id = @id'));
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Đã cập nhật bình luận' });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 404 if comment not found during update', async () => {
            mockReq.params.id = 999;
            mockReq.body = { content: 'Updated content' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] }); // Comment not found

            await commentController.updateComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Không tìm thấy bình luận' });
        });

        it('should return 403 if user is not the owner during update', async () => {
            mockReq.params.id = 1;
            mockReq.body = { content: 'Updated content' };
            mockReq.user.id = 999; // Different user

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ comment_id: 1, user_id: 101, content: 'Old content' }] }); // Comment found, but owner is 101

            await commentController.updateComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Bạn không có quyền sửa bình luận này' });
        });

        it('should handle database error during comment lookup for update', async () => {
            mockReq.params.id = 1;
            mockReq.body = { content: 'Updated content' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Lookup Error'));

            await commentController.updateComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi cập nhật bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database error during comment update', async () => {
            mockReq.params.id = 1;
            mockReq.body = { content: 'Updated content' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ comment_id: 1, user_id: 101, content: 'Old content' }] });
            mockRequestInstances[1].query.mockRejectedValueOnce(new Error('DB Update Error'));

            await commentController.updateComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi cập nhật bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error during update', async () => {
            mockReq.params.id = 1;
            mockReq.body = { content: 'Updated content' };
            mockReq.user.id = 101;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await commentController.updateComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi cập nhật bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // deleteComment
    // =========================================================================
    describe('deleteComment', () => {
        it('should delete a comment successfully if user is owner', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 101;
            mockReq.user.role = 'member';

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ comment_id: 1, user_id: 101 }] }); // Comment lookup
            mockRequestInstances[1].query.mockResolvedValueOnce({}); // Delete query

            await commentController.deleteComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM POST_COMMENT WHERE comment_id = @id'));
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM POST_COMMENT WHERE comment_id = @id'));
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Đã xóa bình luận' });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should delete a comment successfully if user is admin', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 999; // Admin user ID
            mockReq.user.role = 'admin';

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ comment_id: 1, user_id: 101 }] }); // Comment lookup (owned by 101)
            mockRequestInstances[1].query.mockResolvedValueOnce({}); // Delete query

            await commentController.deleteComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Đã xóa bình luận' });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 404 if comment not found during delete', async () => {
            mockReq.params.id = 999;
            mockReq.user.id = 101;
            mockReq.user.role = 'member';

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] }); // Comment not found

            await commentController.deleteComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Không tìm thấy bình luận' });
        });

        it('should return 403 if user is not owner and not admin during delete', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 999; // Different user
            mockReq.user.role = 'member'; // Not admin

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ comment_id: 1, user_id: 101 }] }); // Comment found, owned by 101

            await commentController.deleteComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Bạn không có quyền xóa bình luận này' });
        });

        it('should handle database error during comment lookup for delete', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 101;
            mockReq.user.role = 'member';

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Lookup Error'));

            await commentController.deleteComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi xóa bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database error during comment deletion', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 101;
            mockReq.user.role = 'member';

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ comment_id: 1, user_id: 101 }] });
            mockRequestInstances[1].query.mockRejectedValueOnce(new Error('DB Delete Error'));

            await commentController.deleteComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi xóa bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error during delete', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 101;
            mockReq.user.role = 'member';
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await commentController.deleteComment(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi xóa bình luận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });
});
