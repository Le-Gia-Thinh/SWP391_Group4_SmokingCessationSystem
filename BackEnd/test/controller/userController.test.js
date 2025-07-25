// __tests__/controllers/userController.test.js
const userController = require('../../controllers/userController');
const { sql, dbConfig } = require('../../config/database');

// Mock dependencies
jest.mock('../../config/database');

describe('UserController', () => {
    let mockPool, mockRequest, mockRes;

    beforeEach(() => {
        // Mock pool and request
        mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn()
        };

        mockPool = {
            request: jest.fn().mockReturnValue(mockRequest)
        };

        sql.connect = jest.fn().mockResolvedValue(mockPool);
        sql.Int = 'Int';
        sql.VarChar = jest.fn().mockReturnValue('VarChar');
        sql.Date = 'Date';
        sql.NVarChar = jest.fn().mockReturnValue('NVarChar');

        // Mock response object
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getMe', () => {
        it('should return user data successfully', async () => {
            const mockUserData = {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                phone_number: '0123456789',
                ftnd_level: 'High',
                avatar_url: 'avatar.jpg',
                user_role: 'user',
                account_status: 'active',
                registration_date: '2023-01-01',
                date_of_birth: '1990-01-01',
                total_points: 100,
                current_level: 'Beginner',
                last_updated: '2023-12-01'
            };

            mockRequest.query.mockResolvedValue({
                recordset: [mockUserData]
            });

            const mockReq = {
                user: { id: 1 }
            };

            await userController.getMe(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledWith(dbConfig);
            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockUserData);
        });

        it('should return 404 when user not found', async () => {
            mockRequest.query.mockResolvedValue({
                recordset: []
            });

            const mockReq = {
                user: { id: 999 }
            };

            await userController.getMe(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it('should handle database errors', async () => {
            mockRequest.query.mockRejectedValue(new Error('Database error'));

            const mockReq = {
                user: { id: 1 }
            };

            await userController.getMe(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Server error" });
        });
    });

    describe('updateProfile', () => {
        it('should update profile successfully with all fields', async () => {
            mockRequest.query.mockResolvedValue({});

            const mockReq = {
                user: { id: 1 },
                body: {
                    avatar_url: 'new-avatar.jpg',
                    phone_number: '0987654321',
                    date_of_birth: '1985-05-15',
                    ftnd_level: 'Medium'
                }
            };

            await userController.updateProfile(mockReq, mockRes);

            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 1);
            expect(mockRequest.input).toHaveBeenCalledWith('avatar_url', expect.anything(), 'new-avatar.jpg');
            expect(mockRequest.input).toHaveBeenCalledWith('phone_number', expect.anything(), '0987654321');
            expect(mockRequest.input).toHaveBeenCalledWith('date_of_birth', 'Date', '1985-05-15');
            expect(mockRequest.input).toHaveBeenCalledWith('ftnd_level', expect.anything(), 'Medium');

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Cập nhật thành công"
            });
        });

        it('should update profile with partial fields', async () => {
            mockRequest.query.mockResolvedValue({});

            const mockReq = {
                user: { id: 1 },
                body: {
                    avatar_url: 'new-avatar.jpg',
                    phone_number: '0987654321'
                }
            };

            await userController.updateProfile(mockReq, mockRes);

            expect(mockRequest.input).toHaveBeenCalledWith('avatar_url', expect.anything(), 'new-avatar.jpg');
            expect(mockRequest.input).toHaveBeenCalledWith('phone_number', expect.anything(), '0987654321');
            expect(mockRequest.input).not.toHaveBeenCalledWith('date_of_birth', expect.anything(), expect.anything());
            expect(mockRequest.input).not.toHaveBeenCalledWith('ftnd_level', expect.anything(), expect.anything());
        });

        it('should handle empty avatar_url', async () => {
            mockRequest.query.mockResolvedValue({});

            const mockReq = {
                user: { id: 1 },
                body: {
                    avatar_url: '   ',
                    phone_number: '0987654321'
                }
            };

            await userController.updateProfile(mockReq, mockRes);

            expect(mockRequest.input).not.toHaveBeenCalledWith('avatar_url', expect.anything(), expect.anything());
            expect(mockRequest.input).toHaveBeenCalledWith('phone_number', expect.anything(), '0987654321');
        });

        it('should return error when no fields to update', async () => {
            const mockReq = {
                user: { id: 1 },
                body: {}
            };

            await userController.updateProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Không có dữ liệu để cập nhật."
            });
        });

        it('should handle database error', async () => {
            mockRequest.query.mockRejectedValue(new Error('Update failed'));

            const mockReq = {
                user: { id: 1 },
                body: {
                    phone_number: '0987654321'
                }
            };

            await userController.updateProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Lỗi khi cập nhật hồ sơ"
            });
        });
    });
});