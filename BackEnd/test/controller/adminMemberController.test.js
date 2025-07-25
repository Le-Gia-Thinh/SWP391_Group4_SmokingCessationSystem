const request = require('supertest');
const express = require('express');
const adminMemberController = require('../../controllers/adminMemberController');
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


describe('Admin Member Controller', () => {
    let app;
    let mockPool;

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
        app.get('/admin/members', auth, authorize('admin'), adminMemberController.getAllMembers);
        app.put('/admin/members/:user_id', auth, authorize('admin'), adminMemberController.updateMember);
        app.patch('/admin/members/:user_id/lock', auth, authorize('admin'), adminMemberController.lockMember);
        app.patch('/admin/members/:user_id/unlock', auth, authorize('admin'), adminMemberController.unlockMember);
        app.delete('/admin/members/:user_id', auth, authorize('admin'), adminMemberController.softDeleteMember);


        // Re-initialize mockPool for each test
        mockPool = {
            request: jest.fn(() => mockPool),
            input: jest.fn(() => mockPool),
            query: jest.fn(),
            connect: jest.fn().mockResolvedValue(mockPool),
            close: jest.fn().mockResolvedValue(),
        };
        sql.connect.mockResolvedValue(mockPool);
    });

    // =========================================================================
    // GET /admin/members
    // =========================================================================
    describe('GET /admin/members', () => {
        it('should return all members for admin', async () => {
            const mockMembers = [
                { user_id: 1, username: 'member1', full_name: 'Member One', email: 'm1@example.com', phone_number: '111', account_status: 'active', date_of_birth: '2000-01-01', registration_date: '2023-01-01' },
                { user_id: 2, username: 'member2', full_name: 'Member Two', email: 'm2@example.com', phone_number: '222', account_status: 'inactive', date_of_birth: '2001-02-02', registration_date: '2023-02-02' },
            ];
            mockPool.query.mockResolvedValue({ recordset: mockMembers });

            const authorizeMiddlewareForGet = authorize.mock.results[0].value;

            const res = await request(app).get('/admin/members');

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockMembers);
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForGet).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*SELECT\s*user_id,\s*username,\s*full_name,\s*email,\s*phone_number,\s*account_status,\s*date_of_birth,\s*registration_date\s*FROM CUSTOMER\s*WHERE user_role = 'member' AND account_status != 'deleted'\s*ORDER BY created_at DESC\s*$/i)
            );
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));
            const authorizeMiddlewareForGet = authorize.mock.results[0].value;

            const res = await request(app).get('/admin/members');

            expect(res.statusCode).toEqual(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Lỗi khi lấy danh sách member');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForGet).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });
            const authorizeMiddlewareForGet = authorize.mock.results[0].value;

            const res = await request(app).get('/admin/members');

            expect(res.statusCode).toEqual(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Forbidden');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForGet).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
        });
    });

    // =========================================================================
    // PUT /admin/members/:user_id
    // =========================================================================
    describe('PUT /admin/members/:user_id', () => {
        const memberId = 1; // memberId is a number
        const updatedMemberData = {
            full_name: 'Updated Member Name',
            phone_number: '999888777',
            email: 'updated@example.com',
            date_of_birth: '1995-05-05',
            account_status: 'inactive'
        };

        it('should update member information for admin', async () => {
            mockPool.query.mockResolvedValue({ rowsAffected: [1] });

            const authorizeMiddlewareForPut = authorize.mock.results[1].value;

            const res = await request(app)
                .put(`/admin/members/${memberId}`)
                .send(updatedMemberData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toEqual('Cập nhật member thành công');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForPut).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
            // FIX for "Received: ... "1"" - expect the string version of memberId
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, memberId.toString());
            expect(mockPool.input).toHaveBeenCalledWith('full_name', sql.NVarChar, updatedMemberData.full_name);
            expect(mockPool.input).toHaveBeenCalledWith('phone_number', sql.VarChar, updatedMemberData.phone_number);
            expect(mockPool.input).toHaveBeenCalledWith('email', sql.VarChar, updatedMemberData.email);
            expect(mockPool.input).toHaveBeenCalledWith('date_of_birth', sql.Date, updatedMemberData.date_of_birth);
            expect(mockPool.input).toHaveBeenCalledWith('account_status', sql.NVarChar, updatedMemberData.account_status);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*UPDATE CUSTOMER\s*SET\s*full_name\s*=\s*@full_name,\s*phone_number\s*=\s*@phone_number,\s*email\s*=\s*@email,\s*date_of_birth\s*=\s*@date_of_birth,\s*account_status\s*=\s*@account_status\s*WHERE user_id\s*=\s*@user_id AND user_role = 'member'\s*$/i)
            );
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));
            const authorizeMiddlewareForPut = authorize.mock.results[1].value;

            const res = await request(app)
                .put(`/admin/members/${memberId}`)
                .send(updatedMemberData);

            expect(res.statusCode).toEqual(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Cập nhật member thất bại');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForPut).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });
            const authorizeMiddlewareForPut = authorize.mock.results[1].value;

            const res = await request(app)
                .put(`/admin/members/${memberId}`)
                .send(updatedMemberData);

            expect(res.statusCode).toEqual(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Forbidden');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForPut).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // PATCH /admin/members/:user_id/lock
    // =========================================================================
    describe('PATCH /admin/members/:user_id/lock', () => {
        const memberId = 1;

        it('should lock a member account for admin', async () => {
            mockPool.query.mockResolvedValue({ rowsAffected: [1] });
            const authorizeMiddlewareForLock = authorize.mock.results[2].value;

            const res = await request(app).patch(`/admin/members/${memberId}/lock`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toEqual('Đã khóa tài khoản member');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForLock).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
            // FIX for "Received: ... "1"" - expect the string version of memberId
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, memberId.toString());
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*UPDATE CUSTOMER SET account_status = 'inactive'\s*WHERE user_id = @user_id AND user_role = 'member'\s*$/i)
            );
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));
            const authorizeMiddlewareForLock = authorize.mock.results[2].value;

            const res = await request(app).patch(`/admin/members/${memberId}/lock`);

            expect(res.statusCode).toEqual(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Lỗi khi khóa tài khoản member');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForLock).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });
            const authorizeMiddlewareForLock = authorize.mock.results[2].value;

            const res = await request(app).patch(`/admin/members/${memberId}/lock`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Forbidden');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForLock).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // PATCH /admin/members/:user_id/unlock
    // =========================================================================
    describe('PATCH /admin/members/:user_id/unlock', () => {
        const memberId = 1;

        it('should unlock a member account for admin', async () => {
            mockPool.query.mockResolvedValue({ rowsAffected: [1] });
            const authorizeMiddlewareForUnlock = authorize.mock.results[3].value;

            const res = await request(app).patch(`/admin/members/${memberId}/unlock`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toEqual('Đã mở khóa tài khoản member');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForUnlock).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
            // FIX for "Received: ... "1"" - expect the string version of memberId
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, memberId.toString());
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*UPDATE CUSTOMER SET account_status = 'active'\s*WHERE user_id = @user_id AND user_role = 'member'\s*$/i)
            );
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));
            const authorizeMiddlewareForUnlock = authorize.mock.results[3].value;

            const res = await request(app).patch(`/admin/members/${memberId}/unlock`);

            expect(res.statusCode).toEqual(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Lỗi khi mở khóa tài khoản member');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForUnlock).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });
            const authorizeMiddlewareForUnlock = authorize.mock.results[3].value;

            const res = await request(app).patch(`/admin/members/${memberId}/unlock`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Forbidden');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForUnlock).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // DELETE /admin/members/:user_id
    // =========================================================================
    describe('DELETE /admin/members/:user_id', () => {
        const memberId = 1;

        it('should soft delete a member for admin', async () => {
            mockPool.query.mockResolvedValue({ rowsAffected: [1] });
            const authorizeMiddlewareForDelete = authorize.mock.results[4].value;

            const res = await request(app).delete(`/admin/members/${memberId}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toEqual('Đã xóa member (soft delete)');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForDelete).toHaveBeenCalledTimes(1);
            expect(authorize).toHaveBeenCalledWith('admin');
            // FIX for "Received: ... "1"" - expect the string version of memberId
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, memberId.toString());
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*UPDATE CUSTOMER SET account_status = 'banned'\s*WHERE user_id = @user_id AND user_role = 'member'\s*$/i)
            );
        });

        it('should return 500 if there is a database error', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));
            const authorizeMiddlewareForDelete = authorize.mock.results[4].value;

            const res = await request(app).delete(`/admin/members/${memberId}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Lỗi khi xóa member');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForDelete).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should return 403 if not authorized', async () => {
            auth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' };
                next();
            });
            const authorizeMiddlewareForDelete = authorize.mock.results[4].value;

            const res = await request(app).delete(`/admin/members/${memberId}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toEqual('Forbidden');
            expect(auth).toHaveBeenCalledTimes(1);
            expect(authorizeMiddlewareForDelete).toHaveBeenCalledTimes(1);
        });
    });
});