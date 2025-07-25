    const request = require('supertest');
    const sinon = require('sinon');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const { sql } = require('../../config/database');
    const { app } = require('../../server');

    describe('Kiểm thử Auth Controller', () => {
        let sqlStub;

        const createMockSqlConnection = (queryResults = []) => {
            let call = 0;

            const request = {
                input: () => request,
                query: async () => {
                    return { recordset: queryResults[call++] || [] };
                },
            };

            return {
                request: () => request,
            };
        };

        beforeEach(() => {
            sqlStub = sinon.stub(sql, 'connect');
            // Set JWT_SECRET for testing
            process.env.JWT_SECRET = 'test-secret-key';
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('POST /api/auth/register', () => {
            it('should register a new user successfully', async () => {
                sqlStub.resolves(createMockSqlConnection([
                    [],                       // 1st query: check email
                    [{ user_id: 123 }]       // 2nd query: insert user
                ]));

                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'test@example.com',
                        password: '123456',
                        name: 'Test User',
                        phone_number: '0123456789'
                    });

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.user).toHaveProperty('id');
                expect(response.body.token).toBeDefined();
            });

            it('should return error for duplicate email', async () => {
                sqlStub.resolves(createMockSqlConnection([
                    [{ email: 'test@example.com' }]  // Email already exists
                ]));

                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'test@example.com',
                        password: '123456',
                        name: 'Test User',
                        phone_number: '0123456789'
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toContain('Email đã được sử dụng');
            });

            it('should return error for missing required fields', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'test@example.com'
                        // Missing required fields
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Vui lòng điền đầy đủ thông tin');
            });

            it('should return error for empty email', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: '   ',  // Empty email
                        password: '123456',
                        name: 'Test User',
                        phone_number: '0123456789'
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Vui lòng điền đầy đủ thông tin');
            });

            it('should return error for empty password', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'test@example.com',
                        password: '   ',  // Empty password
                        name: 'Test User',
                        phone_number: '0123456789'
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Vui lòng điền đầy đủ thông tin');
            });

            it('should return error for empty name', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'test@example.com',
                        password: '123456',
                        name: '   ',  // Empty name
                        phone_number: '0123456789'
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Vui lòng điền đầy đủ thông tin');
            });

            it('should return error for empty phone_number', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'test@example.com',
                        password: '123456',
                        name: 'Test User',
                        phone_number: '   '  // Empty phone
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Vui lòng điền đầy đủ thông tin');
            });

            it('should return error for invalid email format', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'invalid-email',
                        password: '123456',
                        name: 'Test User',
                        phone_number: '0123456789'
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Email không hợp lệ');
            });

            it('should return error for invalid phone number format', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'test@example.com',
                        password: '123456',
                        name: 'Test User',
                        phone_number: '123'  // Invalid phone format
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Số điện thoại không hợp lệ');
            });

            it('should return error for short password', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'test@example.com',
                        password: '123',  // Too short
                        name: 'Test User',
                        phone_number: '0123456789'
                    });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Mật khẩu phải có ít nhất 6 ký tự');
            });

            it('should handle database connection error', async () => {
                sqlStub.rejects(new Error('Database connection failed'));

                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'test@example.com',
                        password: '123456',
                        name: 'Test User',
                        phone_number: '0123456789'
                    });

                expect(response.status).toBe(500);
                expect(response.body.message).toBe('Lỗi server');
            });
        });

        describe('POST /api/auth/login', () => {
            it('should login successfully with valid credentials', async () => {
                const hashedPassword = await bcrypt.hash('123456', 10);

                sqlStub.resolves(createMockSqlConnection([
                    [{
                        user_id: 1,
                        email: 'test@example.com',
                        full_name: 'Test User',
                        password_hash: hashedPassword,
                        user_role: 'member'
                    }]
                ]));

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: '123456' });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.token).toBeDefined();
                expect(response.body.user).toHaveProperty('id');
                expect(response.body.user).toHaveProperty('role');
            });

            it('should login with plain text password (legacy support)', async () => {
                sqlStub.resolves(createMockSqlConnection([
                    [{
                        user_id: 1,
                        email: 'test@example.com',
                        full_name: 'Test User',
                        password_hash: '123456', // Plain text password
                        user_role: 'member'
                    }]
                ]));

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: '123456' });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should return error for non-existent email', async () => {
                sqlStub.resolves(createMockSqlConnection([
                    []  // No user found
                ]));

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'nonexistent@example.com', password: '123456' });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Email hoặc mật khẩu không đúng');
            });

            it('should return error for wrong password', async () => {
                const hashedPassword = await bcrypt.hash('correctpassword', 10);

                sqlStub.resolves(createMockSqlConnection([
                    [{
                        user_id: 1,
                        email: 'test@example.com',
                        password_hash: hashedPassword,
                        user_role: 'member'
                    }]
                ]));

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrongpassword' });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Email hoặc mật khẩu không đúng');
            });

            it('should return error for missing email', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ password: '123456' });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Vui lòng điền email và mật khẩu');
            });

            it('should return error for missing password', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com' });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Vui lòng điền email và mật khẩu');
            });

            it('should handle database error during login', async () => {
                sqlStub.rejects(new Error('Database error'));

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: '123456' });

                expect(response.status).toBe(500);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Lỗi server khi đăng nhập');
            });

            it('should login coach with coach_id', async () => {
                const hashedPassword = await bcrypt.hash('123456', 10);

                sqlStub.resolves(createMockSqlConnection([
                    [{
                        user_id: 2,
                        email: 'coach@example.com',
                        full_name: 'Coach User',
                        password_hash: hashedPassword,
                        user_role: 'coach'
                    }],
                    [{ coach_id: 10 }]  // Mock query lấy coach_id từ bảng COACH
                ]));

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'coach@example.com', password: '123456' });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.user.role).toBe('coach');
                expect(response.body.user.coach_id).toBe(10);
            });

            it('should login coach without coach_id in database', async () => {
                const hashedPassword = await bcrypt.hash('123456', 10);

                sqlStub.resolves(createMockSqlConnection([
                    [{
                        user_id: 2,
                        email: 'coach@example.com',
                        full_name: 'Coach User',
                        password_hash: hashedPassword,
                        user_role: 'coach'
                    }],
                    []  // No coach_id found
                ]));

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'coach@example.com', password: '123456' });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.user.role).toBe('coach');
                expect(response.body.user.coach_id).toBeUndefined();
            });
        });

        describe('GET /api/auth/me', () => {
            it('should return user info when authenticated', async () => {
                // Mock user data cho middleware auth
                sqlStub.resolves(createMockSqlConnection([
                    [{
                        id: 1,
                        email: 'test@example.com',
                        name: 'Test User',
                        role: 'member'
                    }]
                ]));

                const token = jwt.sign({ id: 1, role: 'member' }, process.env.JWT_SECRET);

                const response = await request(app)
                    .get('/api/auth/me')
                    .set('Authorization', `Bearer ${token}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.user).toBeDefined();
            });
        });

        describe('POST /api/auth/logout', () => {
            it('should logout successfully', () => {
                const req = {
                    session: {
                        destroy: (cb) => cb(null),
                    },
                };

                const res = {
                    clearCookie: jest.fn(),
                    json: jest.fn(),
                };

                const { logout } = require('../../controllers/authController');

                // Suppress console output
                const originalConsoleLog = console.log;
                console.log = jest.fn();

                logout(req, res);

                // Restore console
                console.log = originalConsoleLog;

                expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
                expect(res.json).toHaveBeenCalledWith({
                    success: true,
                    message: 'Đã đăng xuất thành công',
                });
            });

            it('should handle session destroy error', () => {
                const req = {
                    session: {
                        destroy: (cb) => cb(new Error('Session destroy failed')),
                    },
                };

                const res = {
                    status: jest.fn().mockReturnThis(),
                    clearCookie: jest.fn(),
                    json: jest.fn(),
                };

                const { logout } = require('../../controllers/authController');

                // Suppress console output for this test
                const originalConsoleError = console.error;
                const originalConsoleLog = console.log;
                console.error = jest.fn();
                console.log = jest.fn();

                logout(req, res);

                // Restore console
                console.error = originalConsoleError;
                console.log = originalConsoleLog;

                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Lỗi server khi đăng xuất',
                });
            });

            it('should handle missing session', () => {
                const req = {};

                const res = {
                    clearCookie: jest.fn(),
                    json: jest.fn(),
                };

                const { logout } = require('../../controllers/authController');

                // Suppress console output
                const originalConsoleLog = console.log;
                console.log = jest.fn();

                logout(req, res);

                // Restore console
                console.log = originalConsoleLog;

                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: 'Không có phiên đăng nhập',
                });
            });
        });

        describe('Google Success Handler', () => {
            it('should handle google success with valid user', () => {
                const req = {
                    user: {
                        id: 1,
                        email: 'test@gmail.com',
                        name: 'Test User',
                        role: 'member'
                    }
                };

                const res = {
                    redirect: jest.fn()
                };

                // Set environment variable
                process.env.CLIENT_URL = 'http://localhost:3000';

                const { googleSuccess } = require('../../controllers/authController');

                // Suppress console output
                const originalConsoleLog = console.log;
                console.log = jest.fn();

                googleSuccess(req, res);

                // Restore console
                console.log = originalConsoleLog;

                expect(res.redirect).toHaveBeenCalled();
                const redirectUrl = res.redirect.mock.calls[0][0];
                expect(redirectUrl).toContain('/auth/google/redirect?token=');
            });

            it('should handle google success without user', () => {
                const req = {}; // No user

                const res = {
                    redirect: jest.fn()
                };

                process.env.CLIENT_URL = 'http://localhost:3000';

                const { googleSuccess } = require('../../controllers/authController');

                // Suppress console output
                const originalConsoleLog = console.log;
                const originalConsoleError = console.error;
                console.log = jest.fn();
                console.error = jest.fn();

                googleSuccess(req, res);

                // Restore console
                console.log = originalConsoleLog;
                console.error = originalConsoleError;

                expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=auth_failed');
            });

            it('should handle google success with error', () => {
                const req = {
                    user: {
                        id: 1,
                        email: 'test@gmail.com',
                        name: 'Test User',
                        role: 'member'
                    }
                };

                const res = {
                    redirect: jest.fn()
                };

                // Remove JWT_SECRET to cause error
                delete process.env.JWT_SECRET;

                const { googleSuccess } = require('../../controllers/authController');

                // Suppress console output
                const originalConsoleLog = console.log;
                const originalConsoleError = console.error;
                console.log = jest.fn();
                console.error = jest.fn();

                googleSuccess(req, res);

                // Restore console and JWT_SECRET
                console.log = originalConsoleLog;
                console.error = originalConsoleError;
                process.env.JWT_SECRET = 'test-secret-key';

                expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=server_error');
            });
        });

        describe('Authentication Middleware Tests', () => {
            it('should validate JWT token correctly', async () => {
                // Mock user data cho middleware auth
                sqlStub.resolves(createMockSqlConnection([
                    [{
                        id: 1,
                        email: 'test@example.com',
                        name: 'Test User',
                        role: 'member'
                    }]
                ]));

                const token = jwt.sign({ id: 1, role: 'member' }, process.env.JWT_SECRET);

                const response = await request(app)
                    .get('/api/auth/me')
                    .set('Authorization', `Bearer ${token}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should reject invalid JWT token', async () => {
                const response = await request(app)
                    .get('/api/auth/me')
                    .set('Authorization', 'Bearer invalid-token');

                expect(response.status).toBe(401);
                expect(response.body.message).toContain('Token không hợp lệ');
            });

            it('should reject missing authorization header', async () => {
                const response = await request(app)
                    .get('/api/auth/me');

                expect(response.status).toBe(401);
                expect(response.body.message).toContain('Token không tồn tại');
            });
        });

        afterAll(() => {
            const { server } = require('../../server');
            if (server && server.close) server.close();
        });
    });