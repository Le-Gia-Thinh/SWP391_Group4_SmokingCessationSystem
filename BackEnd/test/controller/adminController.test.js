// test/controllers/adminController.test.js
const request = require('supertest');
const express = require('express');
const adminController = require('../../controllers/adminController');
const { sql, dbConfig } = require('../../config/database');
const bcrypt = require('bcrypt');
const sendCoachCredentials = require('../../utils/sendCoachCredentials');
const { auth, authorize } = require('../../middleware/auth');

jest.mock('bcrypt');
jest.mock('../../utils/sendCoachCredentials');
jest.mock('../../config/database');

const app = express();
app.use(express.json());

// Mock middleware
const mockAuth = jest.fn((req, res, next) => {
    req.user = { user_id: 1, user_role: 'admin' };
    next();
});
const mockAuthorize = jest.fn((role) => (req, res, next) => {
    if (req.user.user_role === role) next();
    else res.status(403).json({ message: 'Forbidden' });
});

// Setup routes
app.post('/create-coach', mockAuth, mockAuthorize('admin'), adminController.createCoachAccount);
app.get('/get-coaches', mockAuth, mockAuthorize('admin'), adminController.getAllCoaches);
app.put('/update-coach/:coach_id', mockAuth, mockAuthorize('admin'), adminController.updateCoachInfo);
app.delete('/delete-coach/:coach_id', mockAuth, mockAuthorize('admin'), adminController.deleteCoach);
app.put('/restore-coach/:coach_id', mockAuth, mockAuthorize('admin'), adminController.restoreCoach);
app.get('/feedbacks/coach-violations', mockAuth, mockAuthorize('admin'), adminController.getCoachViolations);
app.get('/reports/member-no-shows', mockAuth, mockAuthorize('admin'), adminController.getMemberNoShowReports);

describe('Admin Controller', () => {
    let mockPool;

    beforeEach(() => {
        mockPool = {
            request: jest.fn(() => mockPool),
            input: jest.fn(() => mockPool),
            query: jest.fn(),
        };
        sql.connect.mockResolvedValue(mockPool);
        bcrypt.hash.mockResolvedValue('hashed_password');
        sendCoachCredentials.mockResolvedValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /create-coach', () => {
        it('should create a new coach successfully', async () => {
            const newCoach = {
                username: 'testcoach',
                full_name: 'Test Coach',
                email: 'coach@example.com',
                phone_number: '1234567890',
                date_of_birth: '1990-01-01',
                google_meet_link: 'https://meet.google.com/test',
            };

            const mockUser = {
                user_id: 1,
                username: 'testcoach',
                full_name: 'Test Coach',
                email: 'coach@example.com',
            };
            mockPool.query
                .mockResolvedValueOnce({ recordset: [mockUser] })
                .mockResolvedValueOnce({});

            const response = await request(app)
                .post('/create-coach')
                .send(newCoach);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                success: true,
                message: 'Tạo tài khoản coach thành công',
                data: mockUser,
            });
            expect(bcrypt.hash).toHaveBeenCalledWith('T123456', 10);
            expect(sendCoachCredentials).toHaveBeenCalledWith({
                to: 'coach@example.com',
                name: 'Test Coach',
                email: 'coach@example.com',
                password: 'T123456',
            });
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });

        it('should handle error during coach creation', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/create-coach')
                .send({
                    username: 'testcoach',
                    full_name: 'Test Coach',
                    email: 'coach@example.com',
                    phone_number: '1234567890',
                    date_of_birth: '1990-01-01',
                    google_meet_link: 'https://meet.google.com/test',
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Tạo coach thất bại',
            });
        });
    });

    describe('GET /get-coaches', () => {
        it('should return list of coaches', async () => {
            const mockCoaches = [
                {
                    user_id: 1,
                    username: 'coach1',
                    full_name: 'Coach One',
                    email: 'coach1@example.com',
                    phone_number: '1234567890',
                    account_status: 'active',
                    coach_id: 1,
                    google_meet_link: 'https://meet.google.com/test',
                    scheduleCount: 5,
                },
            ];

            mockPool.query.mockResolvedValue({ recordset: mockCoaches });

            const response = await request(app).get('/get-coaches');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: mockCoaches,
            });
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should handle error when fetching coaches', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/get-coaches');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Lỗi khi lấy danh sách coach',
            });
        });
    });

    describe('PUT /update-coach/:coach_id', () => {
        it('should update coach information successfully', async () => {
            mockPool.query.mockResolvedValue({});

            const response = await request(app)
                .put('/update-coach/1')
                .send({
                    full_name: 'Updated Coach',
                    phone_number: '0987654321',
                    account_status: 'active',
                    specialization: 'Fitness',
                    bio: 'Experienced coach',
                    experience_years: 5,
                    google_meet_link: 'https://meet.google.com/updated',
                    coach_status: 'active',
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'Cập nhật thông tin coach thành công',
            });
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });

        it('should handle error during coach update', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/update-coach/1')
                .send({
                    full_name: 'Updated Coach',
                    phone_number: '0987654321',
                    account_status: 'active',
                    specialization: 'Fitness',
                    bio: 'Experienced coach',
                    experience_years: 5,
                    google_meet_link: 'https://meet.google.com/updated',
                    coach_status: 'active',
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Cập nhật coach thất bại',
            });
        });
    });

    describe('DELETE /delete-coach/:coach_id', () => {
        it('should soft delete coach successfully', async () => {
            mockPool.query.mockResolvedValue({});

            const response = await request(app).delete('/delete-coach/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'Xóa coach thành công',
            });
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should handle error during coach deletion', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const response = await request(app).delete('/delete-coach/1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Xóa coach thất bại',
            });
        });
    });

    describe('PUT /restore-coach/:coach_id', () => {
        it('should restore coach successfully', async () => {
            mockPool.query.mockResolvedValue({});

            const response = await request(app).put('/restore-coach/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'Khôi phục coach thành công',
            });
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should handle error during coach restoration', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const response = await request(app).put('/restore-coach/1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Khôi phục coach thất bại',
            });
        });
    });

    describe('GET /feedbacks/coach-violations', () => {
        it('should return list of coach violations', async () => {
            const mockViolations = [
                {
                    feedback_id: 1,
                    user_id: 2,
                    reporter_name: 'Test User',
                    content: 'Inappropriate behavior',
                    submitted_at: '2025-07-25T16:24:00.000Z', // Sử dụng chuỗi ISO
                },
            ];

            mockPool.query.mockResolvedValue({ recordset: mockViolations });

            const response = await request(app).get('/feedbacks/coach-violations');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: mockViolations,
            });
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should handle error when fetching violations', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/feedbacks/coach-violations');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Lỗi khi lấy dữ liệu',
            });
        });
    });

    describe('GET /reports/member-no-shows', () => {
        it('should return list of member no-show reports', async () => {
            const mockReports = [
                {
                    session_id: 1,
                    user_id: 2,
                    member_name: 'Test Member',
                    coach_id: 1,
                    coach_name: 'Test Coach',
                    session_notes: 'Member vắng mặt',
                    scheduled_time: '2025-07-25T16:24:00.000Z', // Sử dụng chuỗi ISO
                },
            ];

            mockPool.query.mockResolvedValue({ recordset: mockReports });

            const response = await request(app).get('/reports/member-no-shows');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: mockReports,
            });
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });

        it('should handle error when fetching reports', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/reports/member-no-shows');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Lỗi khi truy vấn dữ liệu',
            });
        });
    });
});