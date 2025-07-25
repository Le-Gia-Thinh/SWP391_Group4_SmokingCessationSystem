// Mock external modules
jest.mock('moment-timezone', () => {
    const RealDate = Date; // Capture the real Date constructor

    // Mock for a moment instance (returned by moment() or moment.tz())
    const createMockMomentInstance = (initialDate) => {
        let _date = initialDate;

        const instance = {
            _date: _date, // Internal Date object
            toDate: jest.fn(function () { return this._date; }),
            add: jest.fn(function (amount, unit) {
                let newDate = new RealDate(this._date.getTime());
                if (unit === 'hours') {
                    newDate.setUTCHours(newDate.getUTCHours() + amount);
                } else if (unit === 'minutes') {
                    newDate.setUTCMinutes(newDate.getUTCMinutes() + amount);
                } else if (unit === 'days') {
                    newDate.setUTCDate(newDate.getUTCDate() + amount);
                }
                const newInstance = createMockMomentInstance(newDate); // Create new instance for chaining
                return newInstance;
            }),
            subtract: jest.fn(function (amount, unit) {
                let newDate = new RealDate(this._date.getTime());
                if (unit === 'days') {
                    newDate.setUTCDate(newDate.getUTCDate() - amount);
                } else if (unit === 'months') {
                    newDate.setUTCMonth(newDate.getUTCMonth() - amount);
                }
                const newInstance = createMockMomentInstance(newDate);
                return newInstance;
            }),
            startOf: jest.fn(function (unit) {
                let newDate = new RealDate(this._date.getTime());
                if (unit === 'week') {
                    const dayOfWeek = newDate.getUTCDay(); // 0 (Sunday) through 6 (Saturday)
                    const diff = newDate.getUTCDate() - dayOfWeek; // Go back to Sunday
                    newDate.setUTCDate(diff);
                    newDate.setUTCHours(0, 0, 0, 0);
                } else if (unit === 'day') { // Added for startOf('day')
                    newDate.setUTCHours(0, 0, 0, 0);
                } else if (unit === 'month') {
                    newDate.setUTCDate(1);
                    newDate.setUTCHours(0, 0, 0, 0);
                } else if (unit === 'year') {
                    newDate.setUTCMonth(0);
                    newDate.setUTCDate(1);
                    newDate.setUTCHours(0, 0, 0, 0);
                }
                const newInstance = createMockMomentInstance(newDate);
                return newInstance;
            }),
            endOf: jest.fn(function (unit) {
                let newDate = new RealDate(this._date.getTime());
                if (unit === 'week') {
                    const dayOfWeek = newDate.getUTCDay();
                    const diff = 6 - dayOfWeek; // Go forward to Saturday
                    newDate.setUTCDate(newDate.getUTCDate() + diff);
                    newDate.setUTCHours(23, 59, 59, 999);
                } else if (unit === 'day') { // Added for endOf('day')
                    newDate.setUTCHours(23, 59, 59, 999);
                } else if (unit === 'month') {
                    newDate.setUTCMonth(newDate.getUTCMonth() + 1);
                    newDate.setUTCDate(0); // Set to last day of previous month
                    newDate.setUTCHours(23, 59, 59, 999);
                }
                const newInstance = createMockMomentInstance(newDate);
                return newInstance;
            }),
            toISOString: jest.fn(function () { return this._date.toISOString(); }),
            day: jest.fn(function () { // Returns day of week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
                return this._date.getUTCDay();
            }),
            format: jest.fn(function (formatStr) {
                // Basic format implementation for common formats used in controller
                const year = this._date.getUTCFullYear();
                const month = String(this._date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(this._date.getUTCDate()).padStart(2, '0');
                const hours = String(this._date.getUTCHours()).padStart(2, '0');
                const minutes = String(this._date.getUTCMinutes()).padStart(2, '0');
                const seconds = String(this._date.getUTCSeconds()).padStart(2, '0');

                if (formatStr === 'YYYY-MM-DD HH:mm:ss') { // Added for pattern generation
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                }
                if (formatStr === 'YYYY-MM-DD') {
                    return `${year}-${month}-${day}`;
                }
                if (formatStr === 'dd-MM') {
                    return `${day}-${month}`;
                }
                if (formatStr === 'MM/yyyy') {
                    return `${month}/${year}`;
                }
                return this._date.toISOString(); // Fallback
            }),
            diff: jest.fn(function (otherMoment, unit) {
                const otherDate = otherMoment._date;
                const diffMs = this._date.getTime() - otherDate.getTime();
                if (unit === 'days') {
                    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
                }
                if (unit === 'minutes') { // Added for duration check
                    return Math.floor(diffMs / (1000 * 60));
                }
                return diffMs; // Default to milliseconds
            }),
            isSameOrBefore: jest.fn(function (otherMoment, unit) {
                const otherDate = otherMoment._date;
                if (unit === 'day') {
                    // Compare only date parts for 'day' unit
                    const thisDay = new RealDate(RealDate.UTC(this._date.getUTCFullYear(), this._date.getUTCMonth(), this._date.getUTCDate()));
                    const otherDay = new RealDate(RealDate.UTC(otherDate.getUTCFullYear(), otherDate.getUTCMonth(), otherDate.getUTCDate()));
                    return thisDay.getTime() <= otherDay.getTime();
                }
                return this._date.getTime() <= otherDate.getTime();
            }),
            isAfter: jest.fn(function (otherMoment, unit) {
                const otherDate = otherMoment._date;
                if (unit === 'day') {
                    const thisDay = new RealDate(RealDate.UTC(this._date.getUTCFullYear(), this._date.getUTCMonth(), this._date.getUTCDate()));
                    const otherDay = new RealDate(RealDate.UTC(otherDate.getUTCFullYear(), otherDate.getUTCMonth(), otherDate.getUTCDate()));
                    return thisDay.getTime() > otherDay.getTime();
                }
                return this._date.getTime() > otherDate.getTime();
            }),
        };
        return instance;
    };

    // The main moment function mock
    const momentMock = jest.fn((dateInput) => {
        let initialDate;
        if (dateInput instanceof RealDate) {
            initialDate = dateInput;
        } else if (typeof dateInput === 'string') {
            // Handle date strings like 'YYYY-MM-DD HH:mm:ss'
            // For moment(), it often expects local time or ISO string.
            // If it's a date-time string without Z, treat it as local time.
            if (dateInput.includes('T') && dateInput.endsWith('Z')) {
                initialDate = new RealDate(dateInput); // ISO string with Z
            } else if (dateInput.includes('T')) {
                initialDate = new RealDate(dateInput + 'Z'); // Assume local time for simplicity in mock
            } else {
                initialDate = new RealDate(dateInput); // Date string only
            }
        } else if (typeof dateInput === 'number') { // For timestamp
            initialDate = new RealDate(dateInput);
        }
        else {
            initialDate = new RealDate(); // Default to current mocked date
        }
        return createMockMomentInstance(initialDate);
    });

    // Mock for moment.tz specific calls
    momentMock.tz = jest.fn((dateString, timezone) => {
        // Parse dateString, assuming it's in the format 'YYYY-MM-DD HH:mm:ss' and represents a local time in the given timezone.
        // The controller then calls .add(7, 'hours').toDate().
        // So, if input is '2025-07-25 09:00:00' (UTC+7), the final Date object should represent 2025-07-25T09:00:00Z.
        // To achieve this, we create a RealDate UTC object directly from the parsed components.
        const [datePart, timePart] = dateString.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);

        // This creates a Date object whose UTC components match the input local time components.
        // This is crucial for how the controller's moment.tz().add(7, 'hours').toDate() works.
        const initialInternalDate = new RealDate(RealDate.UTC(year, month - 1, day, hour, minute, second));
        return createMockMomentInstance(initialInternalDate);
    });

    return momentMock;
});

// Mock the database module
jest.mock('../../config/database', () => {
    return {
        sql: {
            ConnectionPool: jest.fn(),
            connect: jest.fn(),
            Int: 'Int',
            VarChar: 'VarChar',
            NVarChar: 'NVarChar',
            DateTime: 'DateTime',
            Date: 'Date',
        },
        dbConfig: {},
    };
});

describe('Schedule Controller', () => {
    let scheduleController;
    let sql;
    let moment;
    let mockReq, mockRes;
    let mockPoolInstance;
    // Tăng số lượng mockRequestInstances để xử lý các bài kiểm tra tạo lịch hàng loạt lớn
    let mockRequestInstances = [];
    let consoleErrorSpy;
    let consoleWarnSpy;
    let consoleLogSpy;

    // Helper to get a specific mockRequest instance
    const getMockRequest = (index) => {
        if (!mockRequestInstances[index]) {
            mockRequestInstances[index] = {
                input: jest.fn().mockReturnThis(),
                query: jest.fn(),
            };
        }
        return mockRequestInstances[index];
    };

    beforeEach(() => {
        jest.resetModules(); // Clear module cache for fresh mocks

        // Re-import mocked modules
        ({ sql } = require('../../config/database'));
        moment = require('moment-timezone'); // Re-import moment-timezone after mock
        scheduleController = require('../../controllers/scheduleController'); // Load the controller after mocks

        // Reset mocks for external dependencies
        moment.tz.mockClear();

        // Setup mockPoolInstance and mockRequestInstances
        mockPoolInstance = {
            request: jest.fn(),
            connect: jest.fn().mockResolvedValue(true),
            close: jest.fn().mockResolvedValue(true),
        };
        sql.ConnectionPool.mockImplementation(() => mockPoolInstance);
        sql.connect.mockResolvedValue(mockPoolInstance);

        // Pre-create mockRequest instances (adjust length as needed for complex tests)
        // Đặt một số lượng lớn hơn để xử lý các kịch bản tạo lịch hàng loạt lớn
        mockRequestInstances = Array.from({ length: 700 }, () => ({
            input: jest.fn().mockReturnThis(),
            query: jest.fn(),
        }));

        let requestCallCount = 0;
        mockPoolInstance.request.mockImplementation(() => {
            const instance = mockRequestInstances[requestCallCount];
            // Clear mocks on the instance for each new request() call
            instance.input.mockClear().mockReturnThis();
            instance.query.mockClear();
            requestCallCount++;
            return instance;
        });

        mockReq = {
            body: {},
            params: {},
            user: { id: 101, coach_id: 101 } // Default user for authenticated routes
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        // Capture the original Date constructor before any mocks replace global.Date
        const RealDate = global.Date;

        // Mock Date.now() for consistent current time using the RealDate
        const MOCK_DATE_TIME = new RealDate('2025-07-25T10:00:00.000Z').getTime(); // Thursday
        jest.spyOn(RealDate, 'now').mockReturnValue(MOCK_DATE_TIME);

        // Mock the Date constructor itself to return a consistent date for new Date() calls
        // This should be done on global.Date
        jest.spyOn(global, 'Date').mockImplementation((dateString) => {
            if (dateString) {
                return new RealDate(dateString);
            }
            return new RealDate(MOCK_DATE_TIME);
        });
    });

    afterEach(async () => {
        if (mockPoolInstance && mockPoolInstance.close) {
            await mockPoolInstance.close();
        }
        jest.restoreAllMocks();
    });

    // =========================================================================
    // createBulkSchedules (Admin tạo lịch hàng loạt cho coach)
    // =========================================================================
    describe('createBulkSchedules', () => {

        it('should return 400 if missing coach_id', async () => {
            mockReq.body = { schedules: [{ start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T10:00:00' }] }; // Missing coach_id

            await scheduleController.createBulkSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Thiếu thông tin coach_id hoặc schedules/pattern' });
            expect(sql.connect).not.toHaveBeenCalled();
        });

        it('should return 400 if missing schedules and pattern', async () => {
            mockReq.body = { coach_id: 1 }; // Missing schedules and pattern

            await scheduleController.createBulkSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Thiếu thông tin coach_id hoặc schedules/pattern' });
            expect(sql.connect).not.toHaveBeenCalled();
        });

        it('should return 404 if coach not found', async () => {
            mockReq.body = {
                coach_id: 999,
                schedules: [{ start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T10:00:00' }],
            };
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [] }); // Coach not found

            await scheduleController.createBulkSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Không tìm thấy coach' });
        });

        it('should handle database error during coach existence check', async () => {
            mockReq.body = {
                coach_id: 1,
                schedules: [{ start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T10:00:00' }],
            };
            getMockRequest(0).query.mockRejectedValueOnce(new Error('DB Coach Check Error'));

            await scheduleController.createBulkSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi tạo lịch hàng loạt' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle database error during overlap check', async () => {
            mockReq.body = {
                coach_id: 1,
                schedules: [{ start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T10:00:00' }],
            };
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ coach_id: 1 }] });
            getMockRequest(1).query.mockRejectedValueOnce(new Error('DB Overlap Check Error'));

            await scheduleController.createBulkSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi tạo lịch hàng loạt' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle database error during slot insertion', async () => {
            mockReq.body = {
                coach_id: 1,
                schedules: [{ start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T10:00:00' }],
            };
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ coach_id: 1 }] });
            getMockRequest(1).query.mockResolvedValueOnce({ recordset: [] }); // No overlap
            getMockRequest(2).query.mockRejectedValueOnce(new Error('DB Insert Error'));

            await scheduleController.createBulkSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi tạo lịch hàng loạt' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should return 400 if duration is invalid (pattern)', async () => {
            mockReq.body = {
                coach_id: 1,
                pattern: {
                    startDate: '2025-07-25',
                    endDate: '2025-07-25',
                    startTime: '09:00:00',
                    endTime: '10:00:00',
                    daysOfWeek: [4],
                    duration: 10, // Invalid duration
                },
            };
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ coach_id: 1 }] }); // Coach exists

            await scheduleController.createBulkSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Thời lượng mỗi slot phải từ 15 đến 300 phút.' });
        });

        it('should return 201 and report invalid slots if duration is invalid (schedules)', async () => {
            mockReq.body = {
                coach_id: 1,
                schedules: [{ start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T09:10:00' }], // 10 min duration
            };
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ coach_id: 1 }] }); // Coach exists

            await scheduleController.createBulkSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201); // Still 201 because it reports invalid slots
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                createdCount: 0,
                slotInvalids: expect.arrayContaining([expect.objectContaining({
                    start_time: expect.any(String), // Changed to String
                    end_time: expect.any(String),   // Changed to String
                })]),
            }));
        });

    });

    // =========================================================================
    // createSchedulesForMultipleCoaches (Admin tạo lịch cho nhiều coach cùng lúc)
    // =========================================================================
    describe('createSchedulesForMultipleCoaches', () => {
        it('should create schedules for multiple coaches successfully', async () => {
            mockReq.body = {
                coachIds: [1, 2],
                schedules: [
                    { start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T10:00:00' },
                ],
            };
            // Mock coach existence check for coach 1
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ coach_id: 1 }] });
            // Mock isOverlap for coach 1
            getMockRequest(1).query.mockResolvedValueOnce({ recordset: [] });
            // Mock insert for coach 1
            getMockRequest(2).query.mockResolvedValueOnce({});

            // Mock coach existence check for coach 2
            getMockRequest(3).query.mockResolvedValueOnce({ recordset: [{ coach_id: 2 }] });
            // Mock isOverlap for coach 2
            getMockRequest(4).query.mockResolvedValueOnce({ recordset: [] });
            // Mock insert for coach 2
            getMockRequest(5).query.mockResolvedValueOnce({});

            await scheduleController.createSchedulesForMultipleCoaches(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã tạo thành công 2 lịch cho 2 coach. Trùng: 0, Lỗi dữ liệu: 0',
                totalCreated: 2,
                slotConflicts: [],
                slotInvalids: [],
            });
            expect(getMockRequest(0).input).toHaveBeenCalledWith('coach_id', sql.Int, 1);
            expect(getMockRequest(3).input).toHaveBeenCalledWith('coach_id', sql.Int, 2);
            expect(getMockRequest(2).input).toHaveBeenCalledWith('coach_id', sql.Int, 1);
            expect(getMockRequest(5).input).toHaveBeenCalledWith('coach_id', sql.Int, 2);
        });

        it('should skip non-existent coaches and report correctly', async () => {
            mockReq.body = {
                coachIds: [1, 999], // Coach 999 does not exist
                schedules: [
                    { start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T10:00:00' },
                ],
            };
            // Mock coach existence check for coach 1
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ coach_id: 1 }] });
            // Mock isOverlap for coach 1
            getMockRequest(1).query.mockResolvedValueOnce({ recordset: [] });
            // Mock insert for coach 1
            getMockRequest(2).query.mockResolvedValueOnce({});

            // Mock coach existence check for coach 999 (not found)
            getMockRequest(3).query.mockResolvedValueOnce({ recordset: [] });

            await scheduleController.createSchedulesForMultipleCoaches(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã tạo thành công 1 lịch cho 2 coach. Trùng: 0, Lỗi dữ liệu: 0',
                totalCreated: 1,
                slotConflicts: [],
                slotInvalids: [],
            });
            expect(consoleWarnSpy).toHaveBeenCalledWith('Coach ID 999 không tồn tại, bỏ qua');
        });

        it('should return 400 if missing coachIds', async () => {
            mockReq.body = { schedules: [{ start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T10:00:00' }] }; // Missing coachIds

            await scheduleController.createSchedulesForMultipleCoaches(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Thiếu danh sách coach_ids' });
            expect(sql.connect).not.toHaveBeenCalled();
        });

        it('should return 500 on database error during coach check', async () => {
            mockReq.body = {
                coachIds: [1],
                schedules: [{ start_time: '2025-08-01T09:00:00', end_time: '2025-08-01T10:00:00' }],
            };
            getMockRequest(0).query.mockRejectedValueOnce(new Error('DB Coach Check Error'));

            await scheduleController.createSchedulesForMultipleCoaches(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi tạo lịch cho nhiều coach' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle MAX_SLOTS exceeded for multiple coaches', async () => {
            const singleSlot = { start_time: '2025-09-01T09:00:00', end_time: '2025-09-01T09:30:00' };
            const coachIds = Array.from({ length: 201 }, (_, i) => i + 1); // 201 coaches, each creating 1 slot
            mockReq.body = { coachIds: coachIds, schedules: [singleSlot] };

            // Mock coach existence for all coaches
            // The number of calls to getMockRequest will be 3 * number of coaches.
            // We need to ensure that mockRequestInstances has enough pre-created mocks.
            // For 201 coaches, this is 201 * 3 = 603 calls.
            // The loop for mocking will go up to 201 * 3 - 1.
            for (let i = 0; i < coachIds.length; i++) {
                const currentCoachId = coachIds[i];
                // Coach existence check
                getMockRequest(i * 3).query.mockResolvedValueOnce({ recordset: [{ coach_id: currentCoachId }] });
                // isOverlap check
                getMockRequest(i * 3 + 1).query.mockResolvedValueOnce({ recordset: [] });
                // Insert (this will only be called for the first 200 successful slots)
                getMockRequest(i * 3 + 2).query.mockResolvedValueOnce({});
            }

            await scheduleController.createSchedulesForMultipleCoaches(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201); // Still 201 because it reports the limit
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining(`Đã tạo thành công 200 lịch cho 201 coach. Trùng: 0, Lỗi dữ liệu: 0`),
                totalCreated: 200, // Only 200 slots created
            }));
        });
    });

    // =========================================================================
    // getAvailableSchedules (Member xem lịch trống)
    // =========================================================================
    describe('getAvailableSchedules', () => {
        it('should return available schedules for a coach', async () => {
            mockReq.params.coachId = 1;
            const mockSchedules = [
                { schedule_id: 1, coach_id: 1, start_time: new Date(), end_time: new Date(), is_booked: 0 },
            ];
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: mockSchedules });

            await scheduleController.getAvailableSchedules(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockSchedules);
            expect(getMockRequest(0).input).toHaveBeenCalledWith('coach_id', sql.Int, 1);
            expect(getMockRequest(0).query).toHaveBeenCalledWith('SELECT * FROM COACH_SCHEDULE WHERE coach_id = @coach_id AND is_booked = 0');
        });

        it('should return empty array if no available schedules', async () => {
            mockReq.params.coachId = 1;
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [] });

            await scheduleController.getAvailableSchedules(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith([]);
        });

        it('should handle database error', async () => {
            mockReq.params.coachId = 1;
            getMockRequest(0).query.mockRejectedValueOnce(new Error('DB Error'));

            await scheduleController.getAvailableSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    // =========================================================================
    // deleteSchedule (Coach xóa lịch)
    // =========================================================================
    describe('deleteSchedule', () => {
        it('should delete an unbooked schedule successfully', async () => {
            mockReq.user.coach_id = 1;
            mockReq.params.scheduleId = 10;
            // Mock checkResult - schedule exists and is not booked
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ schedule_id: 10, coach_id: 1, is_booked: 0 }] });
            // Mock delete query
            getMockRequest(1).query.mockResolvedValueOnce({});

            await scheduleController.deleteSchedule(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Đã xóa lịch thành công' });
            expect(getMockRequest(0).input).toHaveBeenCalledWith('schedule_id', sql.Int, 10);
            expect(getMockRequest(0).input).toHaveBeenCalledWith('coach_id', sql.Int, 1);
            expect(getMockRequest(1).input).toHaveBeenCalledWith('schedule_id', sql.Int, 10);
            expect(getMockRequest(1).query).toHaveBeenCalledWith('DELETE FROM COACH_SCHEDULE WHERE schedule_id = @schedule_id');
        });

        it('should return 404 if schedule not found or not owned by coach', async () => {
            mockReq.user.coach_id = 1;
            mockReq.params.scheduleId = 999;
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [] }); // Schedule not found

            await scheduleController.deleteSchedule(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Không tìm thấy lịch hoặc không có quyền xóa' });
        });

        it('should return 400 if schedule is already booked', async () => {
            mockReq.user.coach_id = 1;
            mockReq.params.scheduleId = 10;
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ schedule_id: 10, coach_id: 1, is_booked: 1 }] }); // Booked

            await scheduleController.deleteSchedule(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Không thể xóa lịch đã được đặt' });
        });

        it('should handle database error during check', async () => {
            mockReq.user.coach_id = 1;
            mockReq.params.scheduleId = 10;
            getMockRequest(0).query.mockRejectedValueOnce(new Error('DB Check Error'));

            await scheduleController.deleteSchedule(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi xóa lịch' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle database error during delete', async () => {
            mockReq.user.coach_id = 1;
            mockReq.params.scheduleId = 10;
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ schedule_id: 10, coach_id: 1, is_booked: 0 }] });
            getMockRequest(1).query.mockRejectedValueOnce(new Error('DB Delete Error'));

            await scheduleController.deleteSchedule(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi xóa lịch' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    // =========================================================================
    // getMySchedules (Coach xem lịch của chính mình)
    // =========================================================================
    describe('getMySchedules', () => {
        it('should return schedules for the authenticated coach', async () => {
            mockReq.user.coach_id = 1;
            const mockSchedules = [
                { schedule_id: 1, coach_id: 1, start_time: new Date(), end_time: new Date(), is_booked: 0 },
            ];
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: mockSchedules });

            await scheduleController.getMySchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockSchedules });
            expect(getMockRequest(0).input).toHaveBeenCalledWith('coach_id', sql.Int, 1);
            expect(getMockRequest(0).query).toHaveBeenCalledWith(expect.stringMatching(/SELECT\s*\*\s*FROM COACH_SCHEDULE\s*WHERE coach_id\s*=\s*@coach_id\s*ORDER BY start_time DESC/is));
        });

        it('should return empty array if no schedules found for the coach', async () => {
            mockReq.user.coach_id = 999;
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [] });

            await scheduleController.getMySchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: [] });
        });

        it('should handle database error', async () => {
            mockReq.user.coach_id = 1;
            getMockRequest(0).query.mockRejectedValueOnce(new Error('DB Error'));

            await scheduleController.getMySchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi lấy lịch của coach' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Lỗi khi coach xem lịch của mình:', expect.any(Error));
        });
    });

    // =========================================================================
    // getAllSchedulesByCoachId (Admin xem tất cả lịch của một coach bất kỳ)
    // =========================================================================
    describe('getAllSchedulesByCoachId', () => {
        it('should return all schedules for a specific coach by admin', async () => {
            mockReq.params.coachId = 1;
            const mockSchedules = [
                { schedule_id: 1, coach_id: 1, start_time: new Date(), end_time: new Date(), is_booked: 0 },
            ];
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: mockSchedules });

            await scheduleController.getAllSchedulesByCoachId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockSchedules });
            expect(getMockRequest(0).input).toHaveBeenCalledWith('coach_id', sql.Int, 1);
            expect(getMockRequest(0).query).toHaveBeenCalledWith('SELECT * FROM COACH_SCHEDULE WHERE coach_id = @coach_id ORDER BY start_time DESC');
        });

        it('should return empty array if no schedules found for the coach', async () => {
            mockReq.params.coachId = 999;
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [] });

            await scheduleController.getAllSchedulesByCoachId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: [] });
        });

        it('should handle database error', async () => {
            mockReq.params.coachId = 1;
            getMockRequest(0).query.mockRejectedValueOnce(new Error('DB Error'));

            await scheduleController.getAllSchedulesByCoachId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi server khi lấy lịch coach' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
