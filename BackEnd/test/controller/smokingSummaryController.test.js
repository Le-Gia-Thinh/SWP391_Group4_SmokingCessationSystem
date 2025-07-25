// Mock the database module
jest.mock('../../config/database', () => {
    return {
        sql: {
            ConnectionPool: jest.fn(),
            connect: jest.fn(),
            Int: 'Int',
            VarChar: 'VarChar',
            NVarChar: 'NVarChar',
            Date: 'Date',
        },
        dbConfig: {},
    };
});

describe('Smoking Summary Controller', () => {
    let smokingSummaryController;
    let sql;
    let mockReq, mockRes;
    let mockPoolInstance;
    let mockRequestInstances = [];
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();
        ({ sql } = require('../../config/database'));
        smokingSummaryController = require('../../controllers/smokingSummaryController');

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
            user: { id: 101 },
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
    // submitSingleSmokingSummary
    // =========================================================================
    describe('submitSingleSmokingSummary', () => {
        it('should submit smoking summary successfully (MERGE)', async () => {
            mockReq.body = { date: '2023-01-15', total_cigarettes: 5 };
            mockReq.user.id = 1;

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Successful MERGE

            await smokingSummaryController.submitSingleSmokingSummary(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('date', sql.Date, '2023-01-15');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('total_cigarettes', sql.Int, 5);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/MERGE\s+DAILY_SMOKING_SUMMARY\s+AS\s+target\s+USING\s+\(SELECT\s+@user_id\s+AS\s+user_id,\s+@date\s+AS\s+date\)\s+AS\s+source\s+ON\s+target\.user_id\s*=\s+source\.user_id\s+AND\s+target\.date\s*=\s+source\.date\s+WHEN\s+MATCHED\s+THEN\s+UPDATE\s+SET\s+total_cigarettes\s*=\s*@total_cigarettes\s+WHEN\s+NOT\s+MATCHED\s+THEN\s+INSERT\s+\(user_id,\s+date,\s+total_cigarettes\)\s+VALUES\s+\(@user_id,\s+@date,\s+@total_cigarettes\)/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Đã ghi nhận số điếu thuốc' });
            expect(mockRes.status).not.toHaveBeenCalled(); // Default to 200 OK
        });

        it('should return 400 if missing date', async () => {
            mockReq.body = { total_cigarettes: 5 }; // Missing date
            mockReq.user.id = 1;

            await smokingSummaryController.submitSingleSmokingSummary(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Thiếu ngày hoặc số điếu thuốc' });
            expect(sql.connect).not.toHaveBeenCalled();
        });

        it('should return 400 if missing total_cigarettes', async () => {
            mockReq.body = { date: '2023-01-15' }; // Missing total_cigarettes
            mockReq.user.id = 1;

            await smokingSummaryController.submitSingleSmokingSummary(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Thiếu ngày hoặc số điếu thuốc' });
            expect(sql.connect).not.toHaveBeenCalled();
        });

        it('should handle database error during submission', async () => {
            mockReq.body = { date: '2023-01-15', total_cigarettes: 5 };
            mockReq.user.id = 1;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB MERGE Error'));

            await smokingSummaryController.submitSingleSmokingSummary(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi máy chủ khi ghi nhận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi ghi nhận số điếu:', expect.any(Error));
        });

        it('should handle database connection error for submitSingleSmokingSummary', async () => {
            mockReq.body = { date: '2023-01-15', total_cigarettes: 5 };
            mockReq.user.id = 1;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await smokingSummaryController.submitSingleSmokingSummary(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi máy chủ khi ghi nhận' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi ghi nhận số điếu:', expect.any(Error));
        });
    });

    // =========================================================================
    // getAllSmokingSummary
    // =========================================================================
    describe('getAllSmokingSummary', () => {
        it('should get all smoking summaries for a user successfully', async () => {
            mockReq.params.user_id = 1;
            const mockSummaries = [
                { date: new Date('2023-01-01'), total_cigarettes: 10 },
                { date: new Date('2023-01-02'), total_cigarettes: 8 },
            ];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockSummaries });

            await smokingSummaryController.getAllSmokingSummary(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+date,\s+total_cigarettes\s+FROM\s+DAILY_SMOKING_SUMMARY\s+WHERE\s+user_id\s*=\s*@user_id\s+ORDER\s+BY\s+date/i)
            );
            expect(mockRes.json).toHaveBeenCalledWith(mockSummaries);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return empty array if no smoking summaries found for the user', async () => {
            mockReq.params.user_id = 999;
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [] });

            await smokingSummaryController.getAllSmokingSummary(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 999);
            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database error during smoking summaries retrieval', async () => {
            mockReq.params.user_id = 1;
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await smokingSummaryController.getAllSmokingSummary(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi máy chủ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy số điếu:', expect.any(Error));
        });

        it('should handle database connection error for getAllSmokingSummary', async () => {
            mockReq.params.user_id = 1;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await smokingSummaryController.getAllSmokingSummary(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi máy chủ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy số điếu:', expect.any(Error));
        });
    });
});
