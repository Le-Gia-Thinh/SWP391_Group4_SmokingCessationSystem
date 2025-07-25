// Mock external modules
jest.mock('crypto', () => ({
    randomBytes: jest.fn(() => ({
        toString: jest.fn(() => 'mockResetTokenHex'),
    })),
}));
jest.mock('bcrypt', () => ({
    hash: jest.fn(async (password) => `hashed_${password}`),
}));
jest.mock('../../utils/mailer', () => jest.fn()); // Mock sendResetEmail - Corrected path

// Mock the database module
jest.mock('../../config/database', () => { // Corrected path here
    return {
        sql: {
            ConnectionPool: jest.fn(),
            connect: jest.fn(),
            Int: 'Int',
            VarChar: 'VarChar',
            NVarChar: 'NVarChar',
            DateTime: 'DateTime',
            Date: 'Date', // Add Date type if used in the controller
        },
        dbConfig: {},
    };
});

describe('Reset Password Controller', () => {
    let resetPasswordController;
    let sql;
    let crypto;
    let bcrypt;
    let sendResetEmail;
    let mockReq, mockRes;
    let mockPoolInstance;
    let mockRequestInstances = [];
    let consoleErrorSpy; // Keep this for other tests if needed, but the problematic one will use a local spy
    let consoleLogSpy;

    // Helper to get a specific mockRequest instance
    const getMockRequest = (index) => {
        if (!mockRequestInstances[index]) {
            // This should ideally not happen if pre-created correctly, but as a fallback
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
        ({ sql } = require('../../config/database')); // Corrected path here as well
        crypto = require('crypto');
        bcrypt = require('bcrypt');
        sendResetEmail = require('../../utils/mailer');
        resetPasswordController = require('../../controllers/resetPassword'); // Corrected path here
        // Load the controller after mocks

        // Reset mocks for external dependencies
        crypto.randomBytes.mockClear();
        bcrypt.hash.mockClear();
        sendResetEmail.mockClear();

        // Setup mockPoolInstance and mockRequestInstances
        mockPoolInstance = {
            request: jest.fn(),
            connect: jest.fn().mockResolvedValue(true),
            close: jest.fn().mockResolvedValue(true),
        };
        sql.ConnectionPool.mockImplementation(() => mockPoolInstance);
        sql.connect.mockResolvedValue(mockPoolInstance);

        // Pre-create mockRequest instances
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
            body: {},
            params: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        // Global consoleErrorSpy for other tests that might need it
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // =========================================================================
    // requestResetPassword
    // =========================================================================
    describe('requestResetPassword', () => {
        it('should send a reset password link successfully', async () => {
            mockReq.body = { email: 'test@example.com' };

            // Mock checkUserExists (first query in saveResetToken)
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ user_id: 101, email: 'test@example.com', login_provider: 'local' }] });
            // Mock saveResetToken (second query)
            getMockRequest(1).query.mockResolvedValueOnce({});

            await resetPasswordController.requestResetPassword(mockReq, mockRes);

            expect(crypto.randomBytes).toHaveBeenCalledWith(32);
            expect(sendResetEmail).toHaveBeenCalledWith('test@example.com', 'http://localhost:5173/reset-password/mockResetTokenHex');
            expect(getMockRequest(0).query).toHaveBeenCalledWith(expect.stringMatching(/SELECT\s+\*\s+FROM\s+CUSTOMER\s+WHERE\s+email\s*=\s*@email/i));
            expect(getMockRequest(1).input).toHaveBeenCalledWith('user_id', sql.Int, 101);
            expect(getMockRequest(1).input).toHaveBeenCalledWith('token', sql.VarChar, 'mockResetTokenHex');
            expect(getMockRequest(1).input).toHaveBeenCalledWith('expires_at', sql.DateTime, expect.any(Date));
            expect(getMockRequest(1).query).toHaveBeenCalledWith(expect.stringMatching(/INSERT\s+INTO\s+RESET_TOKENS\s+\(user_id,\s+token,\s+expires_at\)\s+VALUES\s+\(@user_id,\s+@token,\s+@expires_at\)/i));
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Đã gửi link reset (tạm thời)', resetLink: 'http://localhost:5173/reset-password/mockResetTokenHex' });
            expect(consoleLogSpy).toHaveBeenCalledWith('📩 Email gửi reset:', 'test@example.com');
            expect(consoleLogSpy).toHaveBeenCalledWith('🔗 Reset link:', 'http://localhost:5173/reset-password/mockResetTokenHex');
        });

        it('should handle error if email does not belong to a local account during requestResetPassword', async () => {
            mockReq.body = { email: 'google@example.com' };

            // Mock checkUserExists to return a non-local user or no user
            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [] }); // User not found (or not local)

            await resetPasswordController.requestResetPassword(mockReq, mockRes);

            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Email không thuộc tài khoản local: google@example.com');
            expect(mockRes.status).toHaveBeenCalledWith(500); // The controller catches the thrown error and returns 500
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server trong reset password' });
        });

        it('should handle database error during saveResetToken', async () => {
            mockReq.body = { email: 'test@example.com' };

            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [{ user_id: 101, email: 'test@example.com', login_provider: 'local' }] });
            getMockRequest(1).query.mockRejectedValueOnce(new Error('DB Save Token Error'));

            await resetPasswordController.requestResetPassword(mockReq, mockRes);

            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi trong requestResetPassword:', expect.any(Error));
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server trong reset password' });
        });

        it('should handle database connection error for requestResetPassword', async () => {
            mockReq.body = { email: 'test@example.com' };
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await resetPasswordController.requestResetPassword(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi server trong reset password' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi trong requestResetPassword:', expect.any(Error));
        });
    });

    // =========================================================================
    // resetPassword
    // =========================================================================
    describe('resetPassword', () => {
        it('should reset password successfully with a valid token', async () => {
            mockReq.params = { token: 'validToken' };
            mockReq.body = { newPassword: 'newSecurePassword' };
            const expiresAt = new Date(Date.now() + 3600000); // Token not expired

            // Mock getTokenInfo
            getMockRequest(0).query.mockResolvedValueOnce({
                recordset: [{ token: 'validToken', used: 0, expiresAt: expiresAt, email: 'user@example.com' }]
            });
            // Mock updatePassword (check query)
            getMockRequest(1).query.mockResolvedValueOnce({ recordset: [{ user_id: 101, login_provider: 'local' }] }); // Local account check
            // Mock updatePassword (update query)
            getMockRequest(2).query.mockResolvedValueOnce({ rowsAffected: [1] });
            // Mock markTokenUsed
            getMockRequest(3).query.mockResolvedValueOnce({});

            await resetPasswordController.resetPassword(mockReq, mockRes);

            expect(getMockRequest(0).query).toHaveBeenCalledWith(expect.stringMatching(/SELECT\s+t\.\*,\s+c\.email\s+FROM\s+RESET_TOKENS\s+t\s+JOIN\s+CUSTOMER\s+c\s+ON\s+t\.user_id\s*=\s*c\.user_id\s+WHERE\s+t\.token\s*=\s*@token/i));
            expect(getMockRequest(0).input).toHaveBeenCalledWith('token', sql.VarChar, 'validToken');
            expect(bcrypt.hash).toHaveBeenCalledWith('newSecurePassword', 10);
            expect(getMockRequest(1).query).toHaveBeenCalledWith(expect.stringMatching(/SELECT\s+\*\s+FROM\s+CUSTOMER\s+WHERE\s+user_id\s*=\s*\(SELECT\s+user_id\s+FROM\s+CUSTOMER\s+WHERE\s+email\s*=\s*@email\)\s+AND\s+login_provider\s*=\s*'local'/i));
            expect(getMockRequest(2).query).toHaveBeenCalledWith(expect.stringMatching(/UPDATE\s+CUSTOMER\s+SET\s+password_hash\s*=\s*@hashed\s+WHERE\s+user_id\s*=\s*\(SELECT\s+user_id\s+FROM\s+CUSTOMER\s+WHERE\s+email\s*=\s*@email\)\s+AND\s+login_provider\s*=\s*'local'/i));
            expect(getMockRequest(3).query).toHaveBeenCalledWith(expect.stringMatching(/UPDATE\s+RESET_TOKENS\s+SET\s+used\s*=\s*1\s+WHERE\s+token\s*=\s*@token/i));
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Đặt lại mật khẩu thành công' });
            expect(consoleLogSpy).toHaveBeenCalledWith("✅ UPDATE thành công, rowsAffected =", [1]);
        });

        it('should return 400 if token is invalid (not found)', async () => {
            mockReq.params = { token: 'invalidToken' };
            mockReq.body = { newPassword: 'newSecurePassword' };

            getMockRequest(0).query.mockResolvedValueOnce({ recordset: [] }); // Token not found

            await resetPasswordController.resetPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token không hợp lệ hoặc đã hết hạn' });
            expect(bcrypt.hash).not.toHaveBeenCalled(); // Should not proceed to hash password
        });

        it('should return 400 if token is already used', async () => {
            mockReq.params = { token: 'usedToken' };
            mockReq.body = { newPassword: 'newSecurePassword' };
            const expiresAt = new Date(Date.now() + 3600000);

            getMockRequest(0).query.mockResolvedValueOnce({
                recordset: [{ token: 'usedToken', used: 1, expiresAt: expiresAt, email: 'user@example.com' }]
            }); // Token used

            await resetPasswordController.resetPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token không hợp lệ hoặc đã hết hạn' });
            expect(bcrypt.hash).not.toHaveBeenCalled();
        });

        it('should return 400 if token is expired', async () => {
            mockReq.params = { token: 'expiredToken' };
            mockReq.body = { newPassword: 'newSecurePassword' };
            const expiresAt = new Date(Date.now() - 3600000); // Token expired

            getMockRequest(0).query.mockResolvedValueOnce({
                recordset: [{ token: 'expiredToken', used: 0, expiresAt: expiresAt, email: 'user@example.com' }]
            }); // Token expired

            await resetPasswordController.resetPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token không hợp lệ hoặc đã hết hạn' });
            expect(bcrypt.hash).not.toHaveBeenCalled();
        });

        it('should handle database error during getTokenInfo', async () => {
            mockReq.params = { token: 'validToken' };
            mockReq.body = { newPassword: 'newSecurePassword' };

            // Changed to mockImplementationOnce to directly throw an error
            getMockRequest(0).query.mockImplementationOnce(() => { throw new Error('DB Get Token Error'); });

            await expect(resetPasswordController.resetPassword(mockReq, mockRes)).rejects.toThrow('DB Get Token Error');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('should handle error if email does not belong to a local account during updatePassword', async () => {
            mockReq.params = { token: 'validToken' };
            mockReq.body = { newPassword: 'newSecurePassword' };
            const expiresAt = new Date(Date.now() + 3600000);

            // Create a local spy for console.error for this specific test
            const localConsoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Mock getTokenInfo
            getMockRequest(0).query.mockResolvedValueOnce({
                recordset: [{ token: 'validToken', used: 0, expiresAt: expiresAt, email: 'user@example.com' }]
            });
            // Mock updatePassword (check query) to return non-local account
            getMockRequest(1).query.mockResolvedValueOnce({ recordset: [] }); // This will cause updatePassword to throw

            await expect(resetPasswordController.resetPassword(mockReq, mockRes)).rejects.toThrow('Không thể cập nhật mật khẩu – tài khoản không phải local');
            expect(localConsoleErrorSpy).toHaveBeenCalledWith("❌ Không tìm thấy tài khoản local để cập nhật mật khẩu");
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();

            localConsoleErrorSpy.mockRestore(); // Restore the local spy
        });

        it('should handle database error during updatePassword', async () => {
            mockReq.params = { token: 'validToken' };
            mockReq.body = { newPassword: 'newSecurePassword' };
            const expiresAt = new Date(Date.now() + 3600000);

            getMockRequest(0).query.mockResolvedValueOnce({
                recordset: [{ token: 'validToken', used: 0, expiresAt: expiresAt, email: 'user@example.com' }]
            });
            getMockRequest(1).query.mockResolvedValueOnce({ recordset: [{ user_id: 101, login_provider: 'local' }] });
            // Changed to mockImplementationOnce to directly throw an error
            getMockRequest(2).query.mockImplementationOnce(() => { throw new Error('DB Update Password Error'); });

            await expect(resetPasswordController.resetPassword(mockReq, mockRes)).rejects.toThrow('DB Update Password Error');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('should handle database error during markTokenUsed', async () => {
            mockReq.params = { token: 'validToken' };
            mockReq.body = { newPassword: 'newSecurePassword' };
            const expiresAt = new Date(Date.now() + 3600000);

            getMockRequest(0).query.mockResolvedValueOnce({
                recordset: [{ token: 'validToken', used: 0, expiresAt: expiresAt, email: 'user@example.com' }]
            });
            getMockRequest(1).query.mockResolvedValueOnce({ recordset: [{ user_id: 101, login_provider: 'local' }] });
            getMockRequest(2).query.mockResolvedValueOnce({ rowsAffected: [1] });
            // Changed to mockImplementationOnce to directly throw an error
            getMockRequest(3).query.mockImplementationOnce(() => { throw new Error('DB Mark Token Used Error'); });

            await expect(resetPasswordController.resetPassword(mockReq, mockRes)).rejects.toThrow('DB Mark Token Used Error');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('should handle database connection error for resetPassword', async () => {
            mockReq.params = { token: 'validToken' };
            mockReq.body = { newPassword: 'newSecurePassword' };
            // Changed to mockImplementationOnce to directly throw an error
            sql.connect.mockImplementationOnce(() => { throw new Error('Connection failed'); });

            await expect(resetPasswordController.resetPassword(mockReq, mockRes)).rejects.toThrow('Connection failed');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });
});
