const request = require('supertest');
const sinon = require('sinon');
const { expect } = require('@jest/globals');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../../config/database');
const { app } = require('../../server'); // export từ file chính

describe('Auth API', () => {
    let dbMock;

    beforeEach(() => {
        dbMock = sinon.stub(sql, 'connect');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('POST /api/auth/register', () => {
        it('should return 400 if missing required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: '', password: '', name: '', phone_number: '' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Vui lòng điền đầy đủ thông tin');
        });

        it('should return 400 for invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalidemail',
                    password: '123456',
                    name: 'John',
                    phone_number: '0123456789'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email không hợp lệ');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 if missing email or password', async () => {
            const res = await request(app).post('/api/auth/login').send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Vui lòng điền email và mật khẩu');
        });

        it('should return 400 if email does not exist', async () => {
            const fakeRequest = {
                request: () => ({
                    input: () => ({
                        query: async () => ({ recordset: [] }),
                    }),
                }),
            };

            dbMock.resolves(fakeRequest);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'notfound@example.com', password: '123456' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email hoặc mật khẩu không đúng');
        });

        it('should login successfully with correct credentials', async () => {
            const passwordHash = await bcrypt.hash('123456', 10);
            const fakeUser = {
                user_id: 1,
                email: 'test@example.com',
                full_name: 'Test User',
                user_role: 'member',
                password_hash: passwordHash
            };

            const fakeRequest = {
                request: () => ({
                    input: () => ({
                        query: async () => ({ recordset: [fakeUser] }),
                    }),
                }),
            };

            dbMock.resolves(fakeRequest);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: '123456' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe('test@example.com');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return 401 if no token provided', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Token không tồn tại, quyền truy cập bị từ chối');
        });

        it('should return user info with valid token', async () => {
            const token = jwt.sign(
                { id: 1, email: 'test@example.com', name: 'Test User', role: 'member' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const fakeUser = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: 'member',
                avatar: null,
            };

            const fakeRequest = {
                request: () => ({
                    input: () => ({
                        query: async () => ({ recordset: [fakeUser] }),
                    }),
                }),
            };

            dbMock.resolves(fakeRequest);

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe('test@example.com');
        });
    });
});
