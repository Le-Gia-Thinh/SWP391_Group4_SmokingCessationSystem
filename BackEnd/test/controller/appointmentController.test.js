// test/controller/appointmentController.test.js
const appointmentController = require('../../controllers/appointmentController');
const { sql, dbConfig } = require('../../config/database');

// Mock database module BEFORE importing controller
jest.mock('../../config/database', () => ({
    sql: {
        connect: jest.fn(),
        Int: 'Int',
        DateTime: 'DateTime',
        VarChar: 'VarChar',
        NVarChar: 'NVarChar'
    },
    dbConfig: {}
}));

describe('📅 Appointment Controller - Direct Function Tests', () => {
    let mockReq, mockRes, mockPool, mockRequest;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock request object với input chaining
        mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn()
        };

        // Mock pool
        mockPool = {
            request: jest.fn().mockReturnValue(mockRequest)
        };

        // Mock sql.connect
        sql.connect.mockResolvedValue(mockPool);

        // Mock response object
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // Mock request object
        mockReq = {
            user: { id: 1, role: 'member', coach_id: 10 },
            body: {},
            params: {}
        };
    });

    describe('🔥 bookAppointment - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { id: 1, role: 'member' };
            mockReq.body = { schedule_id: 1 };
        });

        it('✅ Đặt lịch thành công - All code paths', async () => {
            const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const endTime = new Date(futureTime.getTime() + 60 * 60 * 1000);

            // Mock tất cả queries theo thứ tự trong code
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ session_count: 1 }] }) // Count check
                .mockResolvedValueOnce({ recordset: [{ coach_id: 10, start_time: futureTime, end_time: endTime }] }) // Slot check
                .mockResolvedValueOnce({ recordset: [] }) // Overlap check
                .mockResolvedValueOnce({ recordset: [] }) // Insert session
                .mockResolvedValueOnce({ recordset: [] }) // Existing thread check
                .mockResolvedValueOnce({ recordset: [] }) // Create thread
                .mockResolvedValueOnce({ recordset: [] }); // Update schedule

            await appointmentController.bookAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đặt lịch thành công'
            });
            expect(mockRequest.query).toHaveBeenCalledTimes(7);
        });

        it('❌ Quá 3 lịch trong tuần', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [{ session_count: 3 }] });

            await appointmentController.bookAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('3 buổi')
            });
        });

        it('❌ Lịch đã được đặt', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ session_count: 1 }] })
                .mockResolvedValueOnce({ recordset: [] }); // Empty = booked

            await appointmentController.bookAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lịch đã được đặt'
            });
        });

        it('❌ Đặt lịch trong vòng 1 giờ', async () => {
            const nearTime = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
            const endTime = new Date(nearTime.getTime() + 60 * 60 * 1000);

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ session_count: 1 }] })
                .mockResolvedValueOnce({ recordset: [{ coach_id: 10, start_time: nearTime, end_time: endTime }] });

            await appointmentController.bookAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Không thể đặt lịch trong vòng 1 tiếng sắp tới.'
            });
        });

        it('❌ Trùng lịch với appointment khác', async () => {
            const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const endTime = new Date(futureTime.getTime() + 60 * 60 * 1000);

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ session_count: 1 }] })
                .mockResolvedValueOnce({ recordset: [{ coach_id: 10, start_time: futureTime, end_time: endTime }] })
                .mockResolvedValueOnce({ recordset: [{ session_id: 1 }] }); // Overlap found

            await appointmentController.bookAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Bạn đã có lịch hẹn khác trùng giờ. Vui lòng chọn thời gian khác.'
            });
        });

        it('❌ Database error handling', async () => {
            mockRequest.query.mockRejectedValueOnce(new Error('Database error'));

            await appointmentController.bookAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi server'
            });
        });

        it('✅ Existing chat thread - không tạo mới', async () => {
            const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const endTime = new Date(futureTime.getTime() + 60 * 60 * 1000);

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ session_count: 1 }] })
                .mockResolvedValueOnce({ recordset: [{ coach_id: 10, start_time: futureTime, end_time: endTime }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [{ thread_id: 1 }] }) // Existing thread
                .mockResolvedValueOnce({ recordset: [] }); // Update schedule only

            await appointmentController.bookAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRequest.query).toHaveBeenCalledTimes(6); // One less call (no thread creation)
        });
    });

    describe('🔥 acceptAppointment - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { coach_id: 10 };
            mockReq.params = { id: '1' };
        });

        it('✅ Duyệt lịch thành công', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ user_id: 1, coach_id: 10 }] }) // Ownership check
                .mockResolvedValueOnce({ recordset: [{ google_meet_link: 'https://meet.google.com/test' }] }) // Get meet link
                .mockResolvedValueOnce({ recordset: [] }) // Update session
                .mockResolvedValueOnce({ recordset: [] }); // Send message

            await appointmentController.acceptAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã duyệt lịch hẹn và gửi link Meet'
            });
        });

        it('❌ Không có quyền duyệt - wrong coach_id', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [{ user_id: 1, coach_id: 999 }] });

            await appointmentController.acceptAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Không có quyền duyệt phiên này'
            });
        });

        it('❌ Session không tồn tại', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await appointmentController.acceptAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('✅ Coach_id = 0 handling', async () => {
            mockReq.user.coach_id = 0;

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ user_id: 1, coach_id: null }] })
                .mockResolvedValueOnce({ recordset: [{ google_meet_link: 'https://meet.google.com/test' }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] });

            await appointmentController.acceptAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã duyệt lịch hẹn và gửi link Meet'
            });
        });

        it('✅ Meet link null handling', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ user_id: 1, coach_id: 10 }] })
                .mockResolvedValueOnce({ recordset: [{ google_meet_link: null }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] });

            await appointmentController.acceptAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã duyệt lịch hẹn và gửi link Meet'
            });
        });
    });

    describe('🔥 rejectAppointment - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { coach_id: 10 };
            mockReq.params = { id: '1' };
        });

        it('✅ Từ chối lịch thành công', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ user_id: 1, coach_id: 10 }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] });

            await appointmentController.rejectAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã từ chối lịch hẹn'
            });
        });

        it('❌ Không có quyền từ chối', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [{ user_id: 1, coach_id: 999 }] });

            await appointmentController.rejectAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('✅ Coach_id undefined handling', async () => {
            mockReq.user.coach_id = undefined;

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ user_id: 1, coach_id: null }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] });

            await appointmentController.rejectAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã từ chối lịch hẹn'
            });
        });
    });

    describe('🔥 cancelAppointment - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { id: 1 };
            mockReq.params = { id: '1' };
        });

        it('✅ Hủy lịch thành công - có schedule_id', async () => {
            const futureTime = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours future

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ user_id: 1, scheduled_time: futureTime, schedule_id: 1 }] })
                .mockResolvedValueOnce({ recordset: [] }) // Update session
                .mockResolvedValueOnce({ recordset: [] }) // Update schedule
                .mockResolvedValueOnce({ recordset: [] }); // Insert message

            await appointmentController.cancelAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã huỷ lịch hẹn'
            });
        });

        it('✅ Hủy lịch thành công - không có schedule_id', async () => {
            const futureTime = new Date(Date.now() + 3 * 60 * 60 * 1000);

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ user_id: 1, scheduled_time: futureTime, schedule_id: null }] })
                .mockResolvedValueOnce({ recordset: [] }) // Update session
                .mockResolvedValueOnce({ recordset: [] }); // Insert message

            await appointmentController.cancelAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã huỷ lịch hẹn'
            });
            expect(mockRequest.query).toHaveBeenCalledTimes(3); // No schedule update
        });

        it('❌ Hủy lịch trong vòng 2 giờ', async () => {
            const soonTime = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour future

            mockRequest.query.mockResolvedValueOnce({
                recordset: [{ user_id: 1, scheduled_time: soonTime, schedule_id: 1 }]
            });

            await appointmentController.cancelAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Không thể hủy lịch hẹn. Chỉ có thể hủy trước 2 giờ so với giờ hẹn.'
            });
        });

        it('❌ Không có quyền hủy', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [{ user_id: 999, scheduled_time: new Date() }] });

            await appointmentController.cancelAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('❌ Session không tồn tại', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await appointmentController.cancelAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('✅ Late cancellation - status cancelled', async () => {
            const futureTime = new Date(Date.now() + 2.1 * 60 * 60 * 1000); // 2.1 hours (close to 2h limit)

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ user_id: 1, scheduled_time: futureTime, schedule_id: 1 }] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [] });

            await appointmentController.cancelAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã huỷ lịch hẹn'
            });
        });
    });

    describe('🔥 getPendingAppointments - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { coach_id: 10 };
        });

        it('✅ Lấy danh sách pending thành công', async () => {
            const pendingData = [
                { session_id: 1, session_status: 'pending' },
                { session_id: 2, session_status: 'pending' }
            ];

            mockRequest.query.mockResolvedValueOnce({ recordset: pendingData });

            await appointmentController.getPendingAppointments(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(pendingData);
        });

        it('✅ Danh sách trống', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await appointmentController.getPendingAppointments(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith([]);
        });
    });

    describe('🔥 getMyAppointments - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { id: 1 };
        });

        it('✅ Lấy danh sách appointments thành công', async () => {
            const appointmentData = [
                { session_id: 1, coach_name: 'Coach A', session_status: 'accepted' }
            ];

            mockRequest.query.mockResolvedValueOnce({ recordset: appointmentData });

            await appointmentController.getMyAppointments(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: appointmentData
            });
        });

        it('❌ Database error', async () => {
            mockRequest.query.mockRejectedValueOnce(new Error('DB Error'));

            await appointmentController.getMyAppointments(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi server khi lấy lịch đã đặt'
            });
        });
    });

    describe('🔥 getCoachAllSchedules - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { coach_id: 10 };
        });

        it('✅ Lấy tất cả schedules thành công', async () => {
            const scheduleData = [
                { schedule_id: 1, is_booked: 0 },
                { schedule_id: 2, is_booked: 1 }
            ];

            mockRequest.query.mockResolvedValueOnce({ recordset: scheduleData });

            await appointmentController.getCoachAllSchedules(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(scheduleData);
        });

        it('❌ Database error', async () => {
            mockRequest.query.mockRejectedValueOnce(new Error('DB Error'));

            await appointmentController.getCoachAllSchedules(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi server khi lấy lịch của coach'
            });
        });
    });

    describe('🔥 getCoachAllAppointments - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { coach_id: 10 };
        });

        it('✅ Lấy tất cả appointments thành công', async () => {
            const appointmentData = [
                { session_id: 1, member_name: 'Member A' }
            ];

            mockRequest.query.mockResolvedValueOnce({ recordset: appointmentData });

            await appointmentController.getCoachAllAppointments(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: appointmentData
            });
        });
    });

    describe('🔥 completeAppointment - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { coach_id: 10 };
            mockReq.params = { id: '1' };
            mockReq.body = { notes: 'Completed successfully' };
        });

        it('✅ Hoàn thành với notes', async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ coach_id: 10 }] })
                .mockResolvedValueOnce({ recordset: [] });

            await appointmentController.completeAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã hoàn thành phiên coaching'
            });
        });

        it('✅ Hoàn thành không có notes', async () => {
            mockReq.body = {};

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ coach_id: 10 }] })
                .mockResolvedValueOnce({ recordset: [] });

            await appointmentController.completeAppointment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã hoàn thành phiên coaching'
            });
        });

        it('❌ Không có quyền', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [{ coach_id: 999 }] });

            await appointmentController.completeAppointment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });
    });

    describe('🔥 reportMissingMember - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { coach_id: 10 };
            mockReq.params = { id: '1' };
            mockReq.body = { reason: 'Member không tham dự' };
        });

        it('✅ Báo cáo thành công', async () => {
            const pastTime = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ coach_id: 10, scheduled_time: pastTime }] })
                .mockResolvedValueOnce({ recordset: [] });

            await appointmentController.reportMissingMember(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã lưu lý do member không tham dự'
            });
        });

        it('❌ Báo cáo trước giờ hẹn', async () => {
            const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

            mockRequest.query.mockResolvedValueOnce({
                recordset: [{ coach_id: 10, scheduled_time: futureTime }]
            });

            await appointmentController.reportMissingMember(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Chỉ được báo cáo sau giờ hẹn'
            });
        });

        it('❌ Báo cáo trước 15 phút', async () => {
            const recentTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

            mockRequest.query.mockResolvedValueOnce({
                recordset: [{ coach_id: 10, scheduled_time: recentTime }]
            });

            await appointmentController.reportMissingMember(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Chỉ được báo cáo sau 15 phút kể từ giờ hẹn'
            });
        });

        it('❌ Không có quyền', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [{ coach_id: 999, scheduled_time: new Date() }] });

            await appointmentController.reportMissingMember(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });
    });

    describe('🔥 reportMissingCoach - Direct Function Test', () => {
        beforeEach(() => {
            mockReq.user = { id: 1 };
            mockReq.body = { session_id: 1, reason: 'Coach không tham gia' };
        });

        it('✅ Báo cáo coach vắng mặt thành công', async () => {
            const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [{ scheduled_time: pastTime }] })
                .mockResolvedValueOnce({ recordset: [] });

            await appointmentController.reportMissingCoach(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Đã gửi phản hồi về việc coach vắng mặt'
            });
        });

        it('❌ Báo cáo trước giờ hẹn', async () => {
            const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

            mockRequest.query.mockResolvedValueOnce({ recordset: [{ scheduled_time: futureTime }] });

            await appointmentController.reportMissingCoach(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Chỉ được báo cáo sau giờ hẹn'
            });
        });

        it('❌ Không có quyền báo cáo', async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await appointmentController.reportMissingCoach(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Không có quyền báo cáo phiên này'
            });
        });
    });
});