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

// Mock the middleware/auth module
jest.mock('../../middleware/auth', () => ({
    auth: jest.fn((req, res, next) => {
        req.user = { user_id: 1, user_role: 'member' }; // Default mock user
        next();
    }),
    authorize: jest.fn((roles) => (req, res, next) => {
        if (!req.user || !req.user.user_role) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (allowedRoles.includes(req.user.user_role)) {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Forbidden' });
        }
    }),
}));

describe('Member Controller', () => {
    let memberController;
    let sql;
    let mockReq, mockRes;
    let mockPoolInstance;
    let mockRequestInstances = [];
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();
        ({ sql } = require('../../config/database'));
        memberController = require('../../controllers/memberController');

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
            user: { user_id: 1, user_role: 'member' },
            body: {},
            params: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // =========================================================================
    // updateProfile
    // =========================================================================
    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            mockReq.body = {
                full_name: 'New Full Name',
                email: 'new@example.com',
                phone_number: '1234567890',
                date_of_birth: '2000-01-01',
            };
            mockReq.user.user_id = 1;

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Successful update

            await memberController.updateProfile(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('user_id', sql.Int, 1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('full_name', sql.NVarChar, 'New Full Name');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('email', sql.VarChar, 'new@example.com');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('phone_number', sql.VarChar, '1234567890');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('date_of_birth', sql.Date, '2000-01-01');
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE\s+CUSTOMER\s+SET\s+full_name\s*=\s*@full_name,\s+email\s*=\s*@email,\s+phone_number\s*=\s*@phone_number,\s+date_of_birth\s*=\s*@date_of_birth\s+WHERE\s+user_id\s*=\s*@user_id/i)
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Cập nhật thành công' });
        });

        it('should handle database error during profile update', async () => {
            mockReq.body = {
                full_name: 'New Full Name',
                email: 'new@example.com',
                phone_number: '1234567890',
                date_of_birth: '2000-01-01',
            };
            mockReq.user.user_id = 1;

            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Update Error'));

            await memberController.updateProfile(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi máy chủ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi cập nhật hồ sơ:', expect.any(Error));
        });

        it('should handle database connection error for updateProfile', async () => {
            mockReq.body = {
                full_name: 'New Full Name',
                email: 'new@example.com',
                phone_number: '1234567890',
                date_of_birth: '2000-01-01',
            };
            mockReq.user.user_id = 1;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await memberController.updateProfile(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi máy chủ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Lỗi cập nhật hồ sơ:', expect.any(Error));
        });
    });
});
