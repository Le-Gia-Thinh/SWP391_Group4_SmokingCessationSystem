// __tests__/controllers/userStatsController.test.js
const userStatsController = require('../../controllers/userStatsController');
const { sql, dbConfig } = require('../../config/database');

jest.mock('../../config/database');

describe('UserStatsController', () => {
    let mockPool, mockRequest, mockRes;

    beforeEach(() => {
        mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn()
        };

        mockPool = {
            request: jest.fn().mockReturnValue(mockRequest)
        };

        sql.connect = jest.fn().mockResolvedValue(mockPool);
        sql.Int = 'Int';
        sql.Date = 'Date';

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserSavings', () => {
        it('should calculate savings correctly with q4_value = 1', async () => {
            const startDate = new Date('2023-01-01');
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ q4_value: 1 }] }) // estimatedPerDay = 15
                .mockResolvedValueOnce({ recordset: [{ start_date: startDate }] })
                .mockResolvedValueOnce({
                    recordset: [
                        { total_cigarettes: 10 }, // reduced = 15-10 = 5, saved = 5*3000 = 15000
                        { total_cigarettes: 8 },  // reduced = 15-8 = 7, saved = 7*3000 = 21000
                        { total_cigarettes: 12 }  // reduced = 15-12 = 3, saved = 3*3000 = 9000
                    ]                          // total = 45000
                });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserSavings(mockReq, mockRes);

            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 1);
            expect(mockRequest.input).toHaveBeenCalledWith('start_date', 'Date', startDate);
            expect(mockRequest.input).toHaveBeenCalledWith('today', 'Date', expect.any(Date));

            expect(mockRes.json).toHaveBeenCalledWith({
                amount: 45000,
                startDate: startDate
            });
        });

        it('should handle different q4_value mappings', async () => {
            const startDate = new Date('2023-01-01');
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ q4_value: 0 }] }) // estimatedPerDay = 5
                .mockResolvedValueOnce({ recordset: [{ start_date: startDate }] })
                .mockResolvedValueOnce({
                    recordset: [
                        { total_cigarettes: 3 }  // reduced = 5-3 = 2, saved = 2*3000 = 6000
                    ]
                });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserSavings(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                amount: 6000,
                startDate: startDate
            });
        });

        it('should handle when actual cigarettes exceed estimated', async () => {
            const startDate = new Date('2023-01-01');
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ q4_value: 1 }] }) // estimatedPerDay = 15
                .mockResolvedValueOnce({ recordset: [{ start_date: startDate }] })
                .mockResolvedValueOnce({
                    recordset: [
                        { total_cigarettes: 20 } // reduced = Math.max(0, 15-20) = 0
                    ]
                });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserSavings(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                amount: 0,
                startDate: startDate
            });
        });

        it('should use default value for unknown q4_value', async () => {
            const startDate = new Date('2023-01-01');
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ q4_value: 99 }] }) // estimatedPerDay = 15 (default)
                .mockResolvedValueOnce({ recordset: [{ start_date: startDate }] })
                .mockResolvedValueOnce({
                    recordset: [
                        { total_cigarettes: 10 } // reduced = 15-10 = 5, saved = 5*3000 = 15000
                    ]
                });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserSavings(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                amount: 15000,
                startDate: startDate
            });
        });

        it('should return error when no FTND data', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserSavings(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Chưa có dữ liệu FTND."
            });
        });

        it('should return error when no cessation plan', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ q4_value: 1 }] })
                .mockResolvedValueOnce({ recordset: [] });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserSavings(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Chưa có kế hoạch cai thuốc."
            });
        });

        it('should handle database error', async () => {
            sql.connect.mockRejectedValue(new Error('Database connection failed'));

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserSavings(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Lỗi tính số tiền tiết kiệm"
            });
        });
    });

    describe('getUserFrequency', () => {
        it('should return frequency data successfully', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ frequency_per_day: 20 }] })
                .mockResolvedValueOnce({ recordset: [{ avg_cigs: 15 }] });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserFrequency(mockReq, mockRes);

            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 1);
            expect(mockRes.json).toHaveBeenCalledWith({
                initial: 20,
                current: 15,
                reductionRate: 25 // Math.round((1 - 15/20) * 100) = 25
            });
        });

        it('should handle null avg_cigs', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ frequency_per_day: 20 }] })
                .mockResolvedValueOnce({ recordset: [{ avg_cigs: null }] });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserFrequency(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                initial: 20,
                current: 0,
                reductionRate: 100 // Math.round((1 - 0/20) * 100) = 100
            });
        });

        it('should handle empty avg_cigs recordset', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ frequency_per_day: 20 }] })
                .mockResolvedValueOnce({ recordset: [] });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserFrequency(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                initial: 20,
                current: 0,
                reductionRate: 100
            });
        });

        it('should handle zero frequency_per_day (avoid division by zero)', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ frequency_per_day: 0 }] })
                .mockResolvedValueOnce({ recordset: [{ avg_cigs: 5 }] });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserFrequency(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                initial: 0,
                current: 5,
                reductionRate: -400 // Math.round((1 - 5/1) * 100) = -400 (uses fallback 1)
            });
        });

        it('should return error when no cessation plan', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserFrequency(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Chưa có kế hoạch cai thuốc.'
            });
        });

        it('should handle database error', async () => {
            sql.connect.mockRejectedValue(new Error('Database error'));

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserFrequency(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Lỗi lấy tần suất hút thuốc'
            });
        });
    });

    describe('getUserScore', () => {
        it('should return user score', async () => {
            mockRequest.query.mockResolvedValue({
                recordset: [{ total_points: 150.5 }]
            });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserScore(mockReq, mockRes);

            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 1);
            expect(mockRes.json).toHaveBeenCalledWith({ score: 150.5 });
        });

        it('should return 0 when no score found', async () => {
            mockRequest.query.mockResolvedValue({
                recordset: []
            });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserScore(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ score: 0 });
        });

        it('should return 0 when total_points is null', async () => {
            mockRequest.query.mockResolvedValue({
                recordset: [{ total_points: null }]
            });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserScore(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ score: 0 });
        });

        it('should handle database error', async () => {
            sql.connect.mockRejectedValue(new Error('Database error'));

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserScore(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Lỗi lấy điểm tích lũy'
            });
        });
    });

    describe('getUserAchievements', () => {
        it('should return user achievements successfully', async () => {
            const mockAchievements = [
                {
                    title: 'First Day Smoke Free',
                    description: 'Completed first day without smoking',
                    earned_date: '2023-01-02',
                    is_shared: true
                },
                {
                    title: 'Week Champion',
                    description: 'One week smoke free',
                    earned_date: '2023-01-08',
                    is_shared: false
                }
            ];

            mockRequest.query.mockResolvedValue({
                recordset: mockAchievements
            });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserAchievements(mockReq, mockRes);

            expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 1);
            expect(mockRes.json).toHaveBeenCalledWith({
                achievements: mockAchievements
            });
        });

        it('should return empty array when no achievements', async () => {
            mockRequest.query.mockResolvedValue({
                recordset: []
            });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserAchievements(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                achievements: []
            });
        });

        it('should handle database error', async () => {
            sql.connect.mockRejectedValue(new Error('Database error'));

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserAchievements(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Lỗi lấy danh sách thành tựu'
            });
        });
    });

    describe('getUserProgressSummary', () => {
        beforeEach(() => {
            // Mock Date constructor to have consistent "today"
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2023-01-10')); // 10 days after start
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should calculate progress summary correctly', async () => {
            const startDate = new Date('2023-01-01');
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{
                        start_date: startDate,
                        frequency_per_day: 20
                    }]
                })
                .mockResolvedValueOnce({
                    recordset: [{
                        total_actual: 100,  // Actually smoked 100 cigarettes
                        smoked_days: 5      // Smoked on 5 days
                    }]
                });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserProgressSummary(mockReq, mockRes);

            // totalDays = 10, freqPerDay = 20
            // Expected cigarettes = 10 * 20 = 200
            // Avoided = 200 - 100 = 100
            // Smoke free days = 10 - 5 = 5
            expect(mockRes.json).toHaveBeenCalledWith({
                avoidedCigarettes: 100,
                smokeFreeDays: 5
            });
        });

        it('should handle when avoided cigarettes would be negative', async () => {
            const startDate = new Date('2023-01-01');
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{
                        start_date: startDate,
                        frequency_per_day: 10
                    }]
                })
                .mockResolvedValueOnce({
                    recordset: [{
                        total_actual: 150,  // Smoked more than expected
                        smoked_days: 8
                    }]
                });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserProgressSummary(mockReq, mockRes);

            // Expected = 10 * 10 = 100, Actual = 150
            // Avoided = Math.max(0, 100 - 150) = 0
            expect(mockRes.json).toHaveBeenCalledWith({
                avoidedCigarettes: 0,
                smokeFreeDays: 2 // Math.max(0, 10 - 8) = 2
            });
        });

        it('should return 0 when plan hasnt started yet', async () => {
            const futureDate = new Date('2023-01-15'); // 5 days in future
            mockRequest.query.mockResolvedValueOnce({
                recordset: [{
                    start_date: futureDate,
                    frequency_per_day: 20
                }]
            });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserProgressSummary(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                avoidedCigarettes: 0,
                smokeFreeDays: 0
            });
        });

        it('should handle null values from database', async () => {
            const startDate = new Date('2023-01-01');
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{
                        start_date: startDate,
                        frequency_per_day: 15
                    }]
                })
                .mockResolvedValueOnce({
                    recordset: [{
                        total_actual: null,  // No data
                        smoked_days: null
                    }]
                });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserProgressSummary(mockReq, mockRes);

            // ISNULL should handle null total_actual as 0
            // SUM with CASE should handle null smoked_days as 0
            expect(mockRes.json).toHaveBeenCalledWith({
                avoidedCigarettes: 150, // 10 days * 15 per day - 0 actual = 150
                smokeFreeDays: 10       // 10 total days - 0 smoked days = 10
            });
        });

        it('should return error when no cessation plan', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserProgressSummary(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Chưa có kế hoạch cai thuốc đang hoạt động.'
            });
        });

        it('should handle database error', async () => {
            sql.connect.mockRejectedValue(new Error('Database error'));

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserProgressSummary(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Lỗi lấy tiến trình bỏ thuốc'
            });
        });

        it('should calculate correct days when start date is today', async () => {
            const todayDate = new Date('2023-01-10'); // Same as mocked "today"
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{
                        start_date: todayDate,
                        frequency_per_day: 10
                    }]
                })
                .mockResolvedValueOnce({
                    recordset: [{
                        total_actual: 5,
                        smoked_days: 1
                    }]
                });

            const mockReq = {
                user: { id: 1 }
            };

            await userStatsController.getUserProgressSummary(mockReq, mockRes);

            // totalDays should be 1 (same day)
            // Expected = 1 * 10 = 10, Actual = 5, Avoided = 5
            // Smoke free days = 1 - 1 = 0
            expect(mockRes.json).toHaveBeenCalledWith({
                avoidedCigarettes: 5,
                smokeFreeDays: 0
            });
        });
    });
});