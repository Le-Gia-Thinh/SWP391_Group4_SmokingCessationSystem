const request = require('supertest');
const express = require('express');
const achievementController = require('../../controllers/achievementController');
const { sql, dbConfig } = require('../../config/database'); // Đảm bảo đường dẫn đúng

// Mock module database để Jest không kết nối database thật
jest.mock('../../config/database');

describe('Achievement Controller', () => {
    let app;
    let mockPool;
    // Khai báo ở đây để chúng có thể được gán lại trong beforeEach
    let mockAuth;
    let adminAuthMiddleware; // Đây sẽ là mock middleware authorize cho admin

    beforeEach(() => {
        // Tạo một ứng dụng Express mới cho mỗi bài kiểm tra để đảm bảo trạng thái sạch
        app = express();
        app.use(express.json());

        // Khởi tạo lại các mock cho mỗi bài kiểm tra để đảm bảo chúng mới và được theo dõi đúng
        mockAuth = jest.fn((req, res, next) => {
            req.user = { id: 1, user_role: 'user' }; // Mặc định là user, có thể ghi đè trong các test cụ thể
            next();
        });

        // Tạo một mock middleware cụ thể cho vai trò 'admin'
        // Đây là hàm middleware thực sự sẽ được gọi khi route yêu cầu quyền admin
        adminAuthMiddleware = jest.fn((req, res, next) => {
            if (!req.user || req.user.user_role !== 'admin') {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        });

        // Đăng ký các route với các middleware mock
        // Quan trọng: Sử dụng các biến mockAuth và adminAuthMiddleware đã được định nghĩa ở trên
        app.get('/achievements', achievementController.getAllAchievements);
        app.get('/achievements/unlocked', mockAuth, achievementController.getUnlockedAchievements);
        // Đối với các route yêu cầu quyền admin, chúng ta truyền adminAuthMiddleware trực tiếp
        app.get('/achievements/:id', mockAuth, adminAuthMiddleware, achievementController.getAchievementById);
        app.post('/achievements', mockAuth, adminAuthMiddleware, achievementController.createAchievement);
        app.put('/achievements/:id', mockAuth, adminAuthMiddleware, achievementController.updateAchievement);
        app.delete('/achievements/:id', mockAuth, adminAuthMiddleware, achievementController.deleteAchievement);

        // Khởi tạo lại mockPool cho mỗi bài kiểm tra
        mockPool = {
            request: jest.fn(() => mockPool),
            input: jest.fn(() => mockPool),
            query: jest.fn(),
            connect: jest.fn().mockResolvedValue(mockPool),
            close: jest.fn().mockResolvedValue(), // Thêm close nếu controller của bạn dùng nó
        };
        sql.connect.mockResolvedValue(mockPool); // Đảm bảo sql.connect trả về mockPool của chúng ta

        // Xóa tất cả các mock trước mỗi bài kiểm tra để tránh ảnh hưởng giữa các test
        jest.clearAllMocks();
    });

    // Test GET /achievements
    describe('GET /achievements', () => {
        it('should return all achievements', async () => {
            const mockAchievements = [
                { achievement_id: 1, title: 'Achievement 1', description: 'Desc 1', badge_image: 'img1.png', achievement_type: 'typeA', difficulty_level: 1, phase: 1 },
                { achievement_id: 2, title: 'Achievement 2', description: 'Desc 2', badge_image: 'img2.png', achievement_type: 'typeB', difficulty_level: 2, phase: 1 },
            ];
            mockPool.query.mockResolvedValue({ recordset: mockAchievements });

            const res = await request(app).get('/achievements');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockAchievements);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            // Biểu thức chính quy linh hoạt hơn để khớp chính xác chuỗi SQL
            // Sử dụng \s* để khớp 0 hoặc nhiều khoảng trắng (bao gồm cả dòng mới)
            // Thêm ^ và $ để khớp toàn bộ chuỗi
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*SELECT achievement_id, title, description, badge_image,\s*achievement_type, difficulty_level, phase\s*FROM ACHIEVEMENT\s*ORDER BY phase, difficulty_level\s*$/i)
            );
        });

        it('should handle errors when fetching all achievements', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/achievements');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ message: 'Lỗi khi lấy dữ liệu thành tựu.' });
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });
    });

    // Test GET /achievements/unlocked
    describe('GET /achievements/unlocked', () => {
        it('should return unlocked achievements for a user', async () => {
            const mockUnlockedAchievements = [
                { achievement_id: 1, title: 'Ach 1', earned_date: null, is_shared: 0, unlocked: 1 },
                { achievement_id: 2, title: 'Ach 2', earned_date: '2025-07-25T00:00:00.000Z', is_shared: 1, unlocked: 0 },
            ];
            mockPool.query.mockResolvedValue({ recordset: mockUnlockedAchievements });

            const res = await request(app).get('/achievements/unlocked');

            expect(res.statusCode).toEqual(200);
            // Đảm bảo rằng unlocked đã được chuyển đổi thành boolean
            expect(res.body).toEqual([
                { achievement_id: 1, title: 'Ach 1', earned_date: null, is_shared: 0, unlocked: true },
                { achievement_id: 2, title: 'Ach 2', earned_date: '2025-07-25T00:00:00.000Z', is_shared: 1, unlocked: false },
            ]);
            expect(mockAuth).toHaveBeenCalledTimes(1); // Kiểm tra middleware auth đã được gọi
            expect(mockPool.request).toHaveBeenCalledTimes(1);
            expect(mockPool.input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*SELECT a\.\*,\s*ISNULL\(ua\.earned_date, NULL\) AS earned_date,\s*ISNULL\(ua\.is_shared, 0\) AS is_shared,\s*CASE WHEN ua\.user_id IS NOT NULL THEN 1 ELSE 0 END AS unlocked\s*FROM ACHIEVEMENT a\s*LEFT JOIN USER_ACHIEVEMENT ua\s*ON a\.achievement_id = ua\.achievement_id\s*AND ua\.user_id = @user_id\s*ORDER BY a\.achievement_id\s*$/i)
            );
        });

        it('should handle errors when fetching unlocked achievements', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/achievements/unlocked');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ message: 'Lỗi lấy danh sách thành tựu.' });
            expect(mockAuth).toHaveBeenCalledTimes(1);
        });
    });

    // Test GET /achievements/:id
    describe('GET /achievements/:id', () => {
        it('should return a specific achievement by ID for admin', async () => {
            // Ghi đè mockAuth để đặt user_role thành 'admin' cho test này
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            const mockAchievement = {
                achievement_id: 1, title: 'Achievement 1', description: 'Desc 1',
                badge_image: 'img1.png', achievement_type: 'typeA', difficulty_level: 1, phase: 1, check_code: 'CODE1'
            };
            mockPool.query.mockResolvedValue({ recordset: [mockAchievement] });

            const res = await request(app).get('/achievements/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockAchievement);
            expect(mockAuth).toHaveBeenCalledTimes(1);
            expect(adminAuthMiddleware).toHaveBeenCalledTimes(1); // Kiểm tra mock middleware authorize cụ thể
            expect(mockPool.input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*SELECT achievement_id,\s*title,\s*description,\s*badge_image,\s*achievement_type,\s*difficulty_level,\s*phase,\s*check_code\s+FROM ACHIEVEMENT\s+WHERE achievement_id = @id\s*$/i)
            );
        });

        it('should return 404 if achievement not found', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockResolvedValue({ recordset: [] });

            const res = await request(app).get('/achievements/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ message: 'Không tìm thấy thành tựu.' });
        });

        it('should return 403 if not authorized', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' }; // Không phải admin
                next();
            });

            const res = await request(app).get('/achievements/1');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ message: 'Forbidden' });
            expect(mockAuth).toHaveBeenCalledTimes(1);
            expect(adminAuthMiddleware).toHaveBeenCalledTimes(1); // Kiểm tra mock middleware authorize cụ thể
        });

        it('should handle errors when fetching achievement by ID', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).get('/achievements/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ message: 'Lỗi server.' });
        });
    });

    // Test POST /achievements
    describe('POST /achievements', () => {
        const newAchievement = {
            title: 'New Ach', description: 'New Desc', badge_image: 'new.png',
            achievement_type: 'typeC', difficulty_level: 3, phase: 2, check_code: 'NEWCODE'
        };

        it('should create a new achievement for admin', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockResolvedValue({ recordset: [{ achievement_id: 3 }] });

            const res = await request(app).post('/achievements').send(newAchievement);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toEqual({ achievement_id: 3 });
            expect(mockAuth).toHaveBeenCalledTimes(1);
            expect(adminAuthMiddleware).toHaveBeenCalledTimes(1);
            expect(mockPool.input).toHaveBeenCalledWith('title', sql.NVarChar, newAchievement.title);
            expect(mockPool.input).toHaveBeenCalledWith('description', sql.NVarChar, newAchievement.description);
            expect(mockPool.input).toHaveBeenCalledWith('badge_image', sql.NVarChar, newAchievement.badge_image);
            expect(mockPool.input).toHaveBeenCalledWith('achievement_type', sql.NVarChar, newAchievement.achievement_type);
            expect(mockPool.input).toHaveBeenCalledWith('difficulty_level', sql.Int, newAchievement.difficulty_level);
            expect(mockPool.input).toHaveBeenCalledWith('phase', sql.Int, newAchievement.phase);
            expect(mockPool.input).toHaveBeenCalledWith('check_code', sql.NVarChar, newAchievement.check_code);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*INSERT INTO ACHIEVEMENT\s+\(title, description, badge_image, achievement_type,\s*difficulty_level, phase, check_code\)\s+VALUES\s*\(@title, @description, @badge_image, @achievement_type,\s*@difficulty_level, @phase, @check_code\);\s*SELECT SCOPE_IDENTITY\(\) AS achievement_id;\s*$/i)
            );
        });

        it('should handle empty badge_image by setting it to null', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            const achWithEmptyImage = { ...newAchievement, badge_image: '   ' };
            mockPool.query.mockResolvedValue({ recordset: [{ achievement_id: 4 }] });

            const res = await request(app).post('/achievements').send(achWithEmptyImage);

            expect(res.statusCode).toEqual(201);
            expect(mockPool.input).toHaveBeenCalledWith('badge_image', sql.NVarChar, null);
        });

        it('should return 403 if not authorized', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' }; // Không phải admin
                next();
            });

            const res = await request(app).post('/achievements').send(newAchievement);

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ message: 'Forbidden' });
            expect(mockAuth).toHaveBeenCalledTimes(1);
            expect(adminAuthMiddleware).toHaveBeenCalledTimes(1);
        });

        it('should handle errors during achievement creation', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).post('/achievements').send(newAchievement);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ message: 'Lỗi khi tạo thành tựu.' });
        });
    });

    // Test PUT /achievements/:id
    describe('PUT /achievements/:id', () => {
        const updatedAchievement = {
            title: 'Updated Ach', description: 'Updated Desc', badge_image: 'updated.png',
            achievement_type: 'typeD', difficulty_level: 4, phase: 3, check_code: 'UPDATEDCODE'
        };

        it('should update an existing achievement for admin', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockResolvedValue({ rowsAffected: [1] }); // Mô phỏng 1 hàng bị ảnh hưởng

            const res = await request(app).put('/achievements/1').send(updatedAchievement);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Cập nhật thành tựu thành công.' });
            expect(mockAuth).toHaveBeenCalledTimes(1);
            expect(adminAuthMiddleware).toHaveBeenCalledTimes(1);
            expect(mockPool.input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockPool.input).toHaveBeenCalledWith('title', sql.NVarChar, updatedAchievement.title);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*UPDATE ACHIEVEMENT\s*SET title=@title,\s*description=@description,\s*badge_image=@badge_image,\s*achievement_type=@achievement_type,\s*difficulty_level=@difficulty_level,\s*phase=@phase,\s*check_code=@check_code\s*WHERE achievement_id=@id\s*$/i)
            );
        });

        it('should handle empty badge_image by setting it to null during update', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            const achWithEmptyImage = { ...updatedAchievement, badge_image: '' };
            mockPool.query.mockResolvedValue({ rowsAffected: [1] });

            const res = await request(app).put('/achievements/1').send(achWithEmptyImage);

            expect(res.statusCode).toEqual(200);
            expect(mockPool.input).toHaveBeenCalledWith('badge_image', sql.NVarChar, null);
        });


        it('should return 404 if achievement not found for update', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockResolvedValue({ rowsAffected: [0] }); // Mô phỏng 0 hàng bị ảnh hưởng

            const res = await request(app).put('/achievements/999').send(updatedAchievement);

            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ message: 'Không tìm thấy thành tựu.' });
        });

        it('should return 403 if not authorized', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' }; // Không phải admin
                next();
            });

            const res = await request(app).put('/achievements/1').send(updatedAchievement);

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ message: 'Forbidden' });
            expect(mockAuth).toHaveBeenCalledTimes(1);
            expect(adminAuthMiddleware).toHaveBeenCalledTimes(1);
        });

        it('should handle errors during achievement update', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).put('/achievements/1').send(updatedAchievement);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ message: 'Lỗi khi cập nhật thành tựu.' });
        });
    });

    // Test DELETE /achievements/:id
    describe('DELETE /achievements/:id', () => {
        it('should delete an achievement for admin', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockResolvedValue({ rowsAffected: [1] });

            const res = await request(app).delete('/achievements/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Xóa thành tựu thành công.' });
            expect(mockAuth).toHaveBeenCalledTimes(1);
            expect(adminAuthMiddleware).toHaveBeenCalledTimes(1);
            expect(mockPool.input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringMatching(/^\s*DELETE FROM ACHIEVEMENT\s*WHERE achievement_id=@id\s*$/i)
            );
        });

        it('should return 404 if achievement not found for deletion', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockResolvedValue({ rowsAffected: [0] });

            const res = await request(app).delete('/achievements/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ message: 'Không tìm thấy thành tựu.' });
        });

        it('should return 403 if not authorized', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'user' }; // Không phải admin
                next();
            });

            const res = await request(app).delete('/achievements/1');

            expect(res.statusCode).toEqual(403);
            expect(res.body).toEqual({ message: 'Forbidden' });
            expect(mockAuth).toHaveBeenCalledTimes(1);
            expect(adminAuthMiddleware).toHaveBeenCalledTimes(1);
        });

        it('should handle errors during achievement deletion', async () => {
            mockAuth.mockImplementationOnce((req, res, next) => {
                req.user = { id: 1, user_role: 'admin' };
                next();
            });
            mockPool.query.mockRejectedValue(new Error('Database error'));

            const res = await request(app).delete('/achievements/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ message: 'Lỗi khi xóa thành tựu.' });
        });
    });
});