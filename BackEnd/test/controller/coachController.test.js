// test/controllers/coachController.test.js - Improved version
const coachController = require('../../controllers/coachController');
const { sql, dbConfig } = require('../../config/database');

// Mock database
jest.mock('../../config/database', () => ({
  sql: {
    connect: jest.fn(),
    Int: 'Int',
    VarChar: 'VarChar'
  },
  dbConfig: {}
}));

describe('Coach Controller - Improved Coverage', () => {
  let mockPool;
  let mockRequest;
  let req, res;

  beforeEach(() => {
    // Mock pool và request
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };
    
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest)
    };
    
    sql.connect.mockResolvedValue(mockPool);

    // Mock req, res objects
    req = {
      body: {},
      user: { id: 1 }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('updateMeetLink', () => {
    // Test validation cases
    it('should return 400 if meet_link is not provided', async () => {
      req.body = {};
      await coachController.updateMeetLink(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Meet link is required'
      });
    });

    it('should return 400 if meet_link is empty string', async () => {
      req.body = { meet_link: '' };
      await coachController.updateMeetLink(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Meet link is required'
      });
    });

    it('should return 400 if meet_link is null', async () => {
      req.body = { meet_link: null };
      await coachController.updateMeetLink(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Meet link is required'
      });
    });

    it('should return 400 if meet_link is undefined', async () => {
      req.body = { meet_link: undefined };
      await coachController.updateMeetLink(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Meet link is required'
      });
    });

    // Test coach not found
    it('should return 404 if coach not found', async () => {
      req.body = { meet_link: 'https://meet.google.com/test' };
      mockRequest.query.mockResolvedValueOnce({
        recordset: []
      });

      await coachController.updateMeetLink(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Không tìm thấy Coach'
      });
    });

    // Test successful update
    it('should successfully update meet link', async () => {
      req.body = { meet_link: 'https://meet.google.com/test' };
      
      mockRequest.query
        .mockResolvedValueOnce({
          recordset: [{ coach_id: 123 }]
        })
        .mockResolvedValueOnce({}); // Mock update query

      await coachController.updateMeetLink(req, res);

      expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 1);
      expect(mockRequest.input).toHaveBeenCalledWith('link', 'VarChar', 'https://meet.google.com/test');
      expect(mockRequest.input).toHaveBeenCalledWith('coach_id', 'Int', 123);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cập nhật Meet link thành công'
      });
    });

    // Test database connection error
    it('should handle database connection errors', async () => {
      req.body = { meet_link: 'https://meet.google.com/test' };
      sql.connect.mockRejectedValue(new Error('Database connection failed'));

      await coachController.updateMeetLink(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi server khi cập nhật Meet link'
      });
    });

    // Test SQL query error in first query
    it('should handle SQL error in coach lookup query', async () => {
      req.body = { meet_link: 'https://meet.google.com/test' };
      mockRequest.query.mockRejectedValue(new Error('SQL query failed'));

      await coachController.updateMeetLink(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi server khi cập nhật Meet link'
      });
    });

    // Test SQL error in update query
    it('should handle SQL error in update query', async () => {
      req.body = { meet_link: 'https://meet.google.com/test' };
      
      mockRequest.query
        .mockResolvedValueOnce({
          recordset: [{ coach_id: 123 }]
        })
        .mockRejectedValueOnce(new Error('Update query failed'));

      await coachController.updateMeetLink(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi server khi cập nhật Meet link'
      });
    });

    // Test with different user IDs
    it('should handle different user IDs', async () => {
      req.user.id = 999;
      req.body = { meet_link: 'https://meet.google.com/test999' };
      
      mockRequest.query
        .mockResolvedValueOnce({
          recordset: [{ coach_id: 999 }]
        })
        .mockResolvedValueOnce({});

      await coachController.updateMeetLink(req, res);

      expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 999);
      expect(mockRequest.input).toHaveBeenCalledWith('coach_id', 'Int', 999);
    });

    // Test with long meet link
    it('should handle long meet links', async () => {
      const longLink = 'https://meet.google.com/very-long-meeting-link-' + 'a'.repeat(100);
      req.body = { meet_link: longLink };
      
      mockRequest.query
        .mockResolvedValueOnce({
          recordset: [{ coach_id: 123 }]
        })
        .mockResolvedValueOnce({});

      await coachController.updateMeetLink(req, res);

      expect(mockRequest.input).toHaveBeenCalledWith('link', 'VarChar', longLink);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cập nhật Meet link thành công'
      });
    });
  });

  describe('getAllCoaches', () => {
    // Test successful retrieval
    it('should return list of active coaches', async () => {
      const mockCoaches = [
        {
          user_id: 1,
          full_name: 'Coach 1',
          email: 'coach1@example.com',
          coach_id: 1,
          specialization: 'Fitness',
          bio: 'Bio 1',
          experience_years: 5,
          coach_status: 'active',
          google_meet_link: 'https://meet.google.com/coach1'
        },
        {
          user_id: 2,
          full_name: 'Coach 2',
          email: 'coach2@example.com',
          coach_id: 2,
          specialization: 'Yoga',
          bio: 'Bio 2',
          experience_years: 3,
          coach_status: 'active',
          google_meet_link: 'https://meet.google.com/coach2'
        }
      ];

      mockRequest.query.mockResolvedValue({
        recordset: mockCoaches
      });

      await coachController.getAllCoaches(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCoaches
      });
    });

    // Test empty result
    it('should return empty array when no coaches found', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      await coachController.getAllCoaches(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    // Test database connection error
    it('should handle database connection errors', async () => {
      sql.connect.mockRejectedValue(new Error('Database error'));

      await coachController.getAllCoaches(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi khi lấy danh sách coach'
      });
    });

    // Test SQL query error
    it('should handle SQL query errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('SQL query failed'));

      await coachController.getAllCoaches(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi khi lấy danh sách coach'
      });
    });

    // Test with single coach
    it('should return single coach in array', async () => {
      const singleCoach = [{
        user_id: 1,
        full_name: 'Solo Coach',
        email: 'solo@example.com',
        coach_id: 1,
        specialization: 'Personal Training',
        bio: 'Solo coach bio',
        experience_years: 10,
        coach_status: 'active',
        google_meet_link: 'https://meet.google.com/solo'
      }];

      mockRequest.query.mockResolvedValue({
        recordset: singleCoach
      });

      await coachController.getAllCoaches(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: singleCoach
      });
    });

    // Test console.error is called on error
    it('should log error to console on database error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test database error');
      
      sql.connect.mockRejectedValue(testError);

      await coachController.getAllCoaches(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy danh sách coach:', testError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentCoach', () => {
    // Test successful retrieval
    it('should return current coach information', async () => {
      const mockCoach = {
        user_id: 1,
        full_name: 'Current Coach',
        email: 'current@example.com',
        coach_id: 1,
        specialization: 'Fitness',
        bio: 'Current coach bio',
        experience_years: 5,
        coach_status: 'active',
        google_meet_link: 'https://meet.google.com/current'
      };

      mockRequest.query.mockResolvedValue({
        recordset: [mockCoach]
      });

      await coachController.getCurrentCoach(req, res);

      expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCoach
      });
    });

    // Test coach not found
    it('should return 404 if coach not found', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      await coachController.getCurrentCoach(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Coach not found'
      });
    });

    // Test database connection error
    it('should handle database connection errors', async () => {
      sql.connect.mockRejectedValue(new Error('Database error'));

      await coachController.getCurrentCoach(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi server khi lấy thông tin coach'
      });
    });

    // Test SQL query error
    it('should handle SQL query errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('SQL query failed'));

      await coachController.getCurrentCoach(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Lỗi server khi lấy thông tin coach'
      });
    });

    // Test with different user ID
    it('should handle different user IDs', async () => {
      req.user.id = 999;
      const mockCoach = {
        user_id: 999,
        full_name: 'Coach 999',
        email: 'coach999@example.com',
        coach_id: 999,
        specialization: 'CrossFit',
        bio: 'Coach 999 bio',
        experience_years: 8,
        coach_status: 'active',
        google_meet_link: 'https://meet.google.com/coach999'
      };

      mockRequest.query.mockResolvedValue({
        recordset: [mockCoach]
      });

      await coachController.getCurrentCoach(req, res);

      expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', 999);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCoach
      });
    });

    // Test console.error is called on error
    it('should log error to console on database error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test database error');
      
      sql.connect.mockRejectedValue(testError);

      await coachController.getCurrentCoach(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Lỗi khi lấy thông tin coach hiện tại:', testError);
      
      consoleSpy.mockRestore();
    });

    // Test empty recordset length check
    it('should check recordset length correctly', async () => {
      // Test with empty recordset
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      await coachController.getCurrentCoach(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      // Clear mocks for next assertion
      jest.clearAllMocks();
      sql.connect.mockResolvedValue(mockPool);

      // Test with recordset containing data
      mockRequest.query.mockResolvedValue({
        recordset: [{ user_id: 1, full_name: 'Test Coach' }]
      });

      await coachController.getCurrentCoach(req, res);

      expect(res.status).not.toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { user_id: 1, full_name: 'Test Coach' }
      });
    });

    // Test recordset[0] access
    it('should access first record correctly', async () => {
      const mockCoaches = [
        { user_id: 1, full_name: 'First Coach' },
        { user_id: 2, full_name: 'Second Coach' }
      ];

      mockRequest.query.mockResolvedValue({
        recordset: mockCoaches
      });

      await coachController.getCurrentCoach(req, res);

      // Should return only the first record
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCoaches[0]
      });
    });
  });

  // Test error handling in all methods with different error types
  describe('Error Handling Edge Cases', () => {
    it('should handle timeout errors in updateMeetLink', async () => {
      req.body = { meet_link: 'https://meet.google.com/test' };
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ETIMEOUT';
      
      sql.connect.mockRejectedValue(timeoutError);

      await coachController.updateMeetLink(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle connection errors in getAllCoaches', async () => {
      const connectionError = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';
      
      sql.connect.mockRejectedValue(connectionError);

      await coachController.getAllCoaches(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle authentication errors in getCurrentCoach', async () => {
      const authError = new Error('Authentication failed');
      authError.code = 'EAUTH';
      
      sql.connect.mockRejectedValue(authError);

      await coachController.getCurrentCoach(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // Test req.user edge cases
  describe('Request User Edge Cases', () => {
   

    it('should handle missing req.user.id in getCurrentCoach', async () => {
      req.user = {};
      
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      await coachController.getCurrentCoach(req, res);

      expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', undefined);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle null req.user.id', async () => {
      req.user = { id: null };
      req.body = { meet_link: 'https://meet.google.com/test' };
      
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      await coachController.updateMeetLink(req, res);

      expect(mockRequest.input).toHaveBeenCalledWith('user_id', 'Int', null);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // Cleanup after all tests to prevent Jest hanging
  afterAll(async () => {
    // Close any database connections if they exist
    if (sql && sql.close) {
      try {
        await sql.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clear all timers
    jest.clearAllTimers();
    
    // Clear all mocks
    jest.clearAllMocks();
  });
});