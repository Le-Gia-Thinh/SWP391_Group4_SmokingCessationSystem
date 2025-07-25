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

describe('Community Post Controller', () => {
    let communityPostController;
    let sql;
    let mockReq, mockRes;
    let mockPoolInstance;
    let mockRequestInstances = [];
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();
        ({ sql } = require('../../config/database'));
        communityPostController = require('../../controllers/communityPostController');

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
            user: { id: 101, role: 'member' }, // Default user role
            body: {},
            params: {},
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
    // createPost
    // =========================================================================
    describe('createPost', () => {
        it('should create a post successfully', async () => {
            mockReq.body = { title: 'Test Post', content: 'This is a test post content.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Successful insertion

            await communityPostController.createPost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 101);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('title', sql.NVarChar, 'Test Post');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('content', sql.NVarChar, 'This is a test post content.');
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO COMMUNITY_POST'));
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Tạo bài viết thành công' });
        });

        it('should handle database error during post creation', async () => {
            mockReq.body = { title: 'Error Post', content: 'Content.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Insert Error'));

            await communityPostController.createPost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi tạo bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error for createPost', async () => {
            mockReq.body = { title: 'Connection Error Post', content: 'Content.' };
            mockReq.user.id = 101;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await communityPostController.createPost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi tạo bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // getAllPosts
    // =========================================================================
    describe('getAllPosts', () => {
        it('should get all approved posts successfully', async () => {
            const mockPosts = [{ post_id: 1, title: 'Approved Post', is_approved: 1, full_name: 'User A' }];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockPosts });

            await communityPostController.getAllPosts(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            // Use regex to match the full query including JOIN and handle whitespace
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+p\.\*,\s+c\.full_name\s+FROM\s+COMMUNITY_POST\s+p\s+LEFT\s+JOIN\s+CUSTOMER\s+c\s+ON\s+p\.user_id\s*=\s*c\.user_id\s+WHERE\s+p\.is_approved\s*=\s*1\s+ORDER\s+BY\s+created_at\s+DESC/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith(mockPosts);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return empty array if no approved posts found', async () => {
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] });

            await communityPostController.getAllPosts(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during approved posts retrieval', async () => {
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await communityPostController.getAllPosts(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi lấy danh sách bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error for getAllPosts', async () => {
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await communityPostController.getAllPosts(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi lấy danh sách bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // getPendingPosts
    // =========================================================================
    describe('getPendingPosts', () => {
        it('should get all pending posts successfully', async () => {
            mockReq.user.role = 'admin'; // Ensure admin role for this test
            const mockPosts = [{ post_id: 2, title: 'Pending Post', is_approved: 0, full_name: 'User B' }];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockPosts });

            await communityPostController.getPendingPosts(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            // Use regex to match the full query including JOIN and handle whitespace
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+p\.\*,\s+c\.full_name\s+FROM\s+COMMUNITY_POST\s+p\s+LEFT\s+JOIN\s+CUSTOMER\s+c\s+ON\s+p\.user_id\s*=\s*c\.user_id\s+WHERE\s+p\.is_approved\s*=\s*0\s+OR\s+p\.is_approved\s+IS\s+NULL\s+ORDER\s+BY\s+created_at\s+ASC/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith(mockPosts);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return empty array if no pending posts found', async () => {
            mockReq.user.role = 'admin';
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] });

            await communityPostController.getPendingPosts(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during pending posts retrieval', async () => {
            mockReq.user.role = 'admin';
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await communityPostController.getPendingPosts(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi lấy bài viết chờ duyệt' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error for getPendingPosts', async () => {
            mockReq.user.role = 'admin';
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await communityPostController.getPendingPosts(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi lấy bài viết chờ duyệt' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // updatePost
    // =========================================================================
    describe('updatePost', () => {
        it('should update a post successfully if user is owner', async () => {
            mockReq.params.id = 1;
            mockReq.body = { title: 'Updated Title', content: 'Updated content.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ post_id: 1, user_id: 101 }] }); // Post lookup
            mockRequestInstances[1].query.mockResolvedValueOnce({}); // Update query

            await communityPostController.updatePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith('SELECT * FROM COMMUNITY_POST WHERE post_id = @id');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('title', sql.NVarChar, 'Updated Title');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('content', sql.NVarChar, 'Updated content.');
            // Use regex to match the full update query including last_updated and handle whitespace
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE\s+COMMUNITY_POST\s+SET\s+title\s*=\s*@title,\s+content\s*=\s*@content,\s+last_updated\s*=\s*GETDATE\(\)\s+WHERE\s+post_id\s*=\s*@id/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cập nhật bài viết thành công' });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 403 if post not found or user is not owner during update', async () => {
            mockReq.params.id = 999; // Non-existent post
            mockReq.body = { title: 'Updated Title', content: 'Updated content.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] }); // Post not found

            await communityPostController.updatePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(403); // Controller returns 403 if post not found or user doesn't own it
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Bạn không có quyền sửa bài viết này' });
        });

        it('should return 403 if user is not the owner during update', async () => {
            mockReq.params.id = 1;
            mockReq.body = { title: 'Updated Title', content: 'Updated content.' };
            mockReq.user.id = 999; // Different user

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ post_id: 1, user_id: 101 }] }); // Post found, but owned by 101

            await communityPostController.updatePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Bạn không có quyền sửa bài viết này' });
        });

        it('should handle database error during post lookup for update', async () => {
            mockReq.params.id = 1;
            mockReq.body = { title: 'Updated Title', content: 'Updated content.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Lookup Error'));

            await communityPostController.updatePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi cập nhật bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database error during post update', async () => {
            mockReq.params.id = 1;
            mockReq.body = { title: 'Updated Title', content: 'Updated content.' };
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ post_id: 1, user_id: 101 }] });
            mockRequestInstances[1].query.mockRejectedValueOnce(new Error('DB Update Error'));

            await communityPostController.updatePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi cập nhật bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error during update', async () => {
            mockReq.params.id = 1;
            mockReq.body = { title: 'Updated Title', content: 'Updated content.' };
            mockReq.user.id = 101;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await communityPostController.updatePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi cập nhật bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // deletePost
    // =========================================================================
    describe('deletePost', () => {
        it('should delete a post successfully if user is owner', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ post_id: 1, user_id: 101 }] }); // Post lookup
            mockRequestInstances[1].query.mockResolvedValueOnce({}); // Delete query

            await communityPostController.deletePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith('SELECT * FROM COMMUNITY_POST WHERE post_id = @id');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith('DELETE FROM COMMUNITY_POST WHERE post_id = @id');
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Đã xóa bài viết' });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 403 if post not found or user is not owner during delete', async () => {
            mockReq.params.id = 999;
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] }); // Post not found

            await communityPostController.deletePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Bạn không có quyền xóa bài viết này' });
        });

        it('should return 403 if user is not the owner during delete', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 999; // Different user

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ post_id: 1, user_id: 101 }] }); // Post found, owned by 101

            await communityPostController.deletePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Bạn không có quyền xóa bài viết này' });
        });

        it('should handle database error during post lookup for delete', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Lookup Error'));

            await communityPostController.deletePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi xóa bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database error during post deletion', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 101;

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ post_id: 1, user_id: 101 }] });
            mockRequestInstances[1].query.mockRejectedValueOnce(new Error('DB Delete Error'));

            await communityPostController.deletePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi xóa bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error during delete', async () => {
            mockReq.params.id = 1;
            mockReq.user.id = 101;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await communityPostController.deletePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi xóa bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // adminDeletePost
    // =========================================================================
    describe('adminDeletePost', () => {
        it('should delete a post successfully by admin', async () => {
            mockReq.params.id = 1;
            // No user role check needed here, as it's handled by middleware (authorize('admin'))

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Delete query

            await communityPostController.adminDeletePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith('DELETE FROM COMMUNITY_POST WHERE post_id = @id');
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Đã xóa bài viết' });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during admin deletion', async () => {
            mockReq.params.id = 1;
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Delete Error'));

            await communityPostController.adminDeletePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi xóa bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error during admin deletion', async () => {
            mockReq.params.id = 1;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await communityPostController.adminDeletePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server khi xóa bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });

    // =========================================================================
    // approvePost
    // =========================================================================
    describe('approvePost', () => {
        it('should approve a post successfully', async () => {
            mockReq.params.id = 1;

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Update query

            await communityPostController.approvePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('id', sql.Int, 1);
            // Use regex to match the update query and handle whitespace
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE\s+COMMUNITY_POST\s+SET\s+is_approved\s*=\s*1\s+WHERE\s+post_id\s*=\s*@id/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Bài viết đã được duyệt' });
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during post approval', async () => {
            mockReq.params.id = 1;
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Update Error'));

            await communityPostController.approvePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi duyệt bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });

        it('should handle database connection error during post approval', async () => {
            mockReq.params.id = 1;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await communityPostController.approvePost(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi duyệt bài viết' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error)); // Corrected assertion
        });
    });
});
