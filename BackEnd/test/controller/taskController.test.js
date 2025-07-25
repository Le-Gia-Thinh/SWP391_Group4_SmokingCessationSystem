// Mock the database module
jest.mock('../../config/database', () => {
    return {
        sql: {
            ConnectionPool: jest.fn(),
            connect: jest.fn(),
            Int: 'Int',
            VarChar: 'VarChar',
            NVarChar: 'NVarChar',
        },
        dbConfig: {},
    };
});

describe('Task Controller', () => {
    let taskController;
    let sql;
    let mockReq, mockRes;
    let mockPoolInstance;
    let mockRequestInstances = [];
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();
        ({ sql } = require('../../config/database'));
        taskController = require('../../controllers/taskController');

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
            query: {},
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
    // getAllTasks
    // =========================================================================
    describe('getAllTasks', () => {
        it('should get all tasks successfully without phase_code', async () => {
            const mockTasks = [{ id: 1, task_description: 'Task 1' }];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockTasks });

            await taskController.getAllTasks(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).not.toHaveBeenCalled(); // No input for phase_code
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+id,\s+phase_code,\s+time_slot,\s+task_id,\s+task_description,\s+task_order,\s+created_at\s+FROM\s+behavior_tasks\s+ORDER\s+BY\s+phase_code,\s+time_slot,\s+task_order/i)
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockTasks });
        });

        it('should get tasks filtered by phase_code successfully', async () => {
            mockReq.query.phase_code = 'P1';
            const mockTasks = [{ id: 1, phase_code: 'P1', task_description: 'Task 1' }];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockTasks });

            await taskController.getAllTasks(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('phase_code', sql.VarChar, 'P1');
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+id,\s+phase_code,\s+time_slot,\s+task_id,\s+task_description,\s+task_order,\s+created_at\s+FROM\s+behavior_tasks\s+WHERE\s+phase_code\s*=\s*@phase_code\s+ORDER\s+BY\s+phase_code,\s+time_slot,\s+task_order/i)
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockTasks });
        });

        it('should handle database error during task retrieval', async () => {
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await taskController.getAllTasks(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi lấy danh sách nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[getAllTasks] Error:', expect.any(Error));
        });

        it('should handle database connection error for getAllTasks', async () => {
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await taskController.getAllTasks(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi lấy danh sách nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[getAllTasks] Error:', expect.any(Error));
        });
    });

    // =========================================================================
    // createTask
    // =========================================================================
    describe('createTask', () => {
        it('should create a task successfully', async () => {
            mockReq.body = { phase_code: 'P1', time_slot: '08:00', task_description: 'New Task' };

            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ count: 0 }] }); // Count for task_order
            mockRequestInstances[1].query.mockResolvedValueOnce({}); // Task insertion

            await taskController.createTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2); // One for count, one for insert
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('phase_code', sql.VarChar, 'P1');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('time_slot', sql.VarChar, '08:00');
            // Updated to use regex for robust matching
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+COUNT\(\*\)\s+AS\s+count\s+FROM\s+behavior_tasks\s+WHERE\s+phase_code\s*=\s*@phase_code\s+AND\s+time_slot\s*=\s*@time_slot/i)
            );

            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('phase_code', sql.VarChar, 'P1');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('time_slot', sql.VarChar, '08:00');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('task_id', sql.VarChar, 'P1_08_1'); // Calculated task_id
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('task_description', sql.NVarChar, 'New Task');
            expect(mockRequestInstances[1].input).toHaveBeenCalledWith('task_order', sql.Int, 1);
            expect(mockRequestInstances[1].query).toHaveBeenCalledWith(
                expect.stringMatching(/INSERT\s+INTO\s+behavior_tasks\s+\(phase_code,\s+time_slot,\s+task_id,\s+task_description,\s+task_order,\s+created_at,\s+updated_at\)\s+VALUES\s+\(@phase_code,\s+@time_slot,\s+@task_id,\s+@task_description,\s+@task_order,\s+GETDATE\(\),\s+GETDATE\(\)\)/i)
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Tạo nhiệm vụ thành công' });
        });

        it('should return 400 if missing input data', async () => {
            mockReq.body = { phase_code: 'P1', time_slot: '08:00' }; // Missing task_description

            await taskController.createTask(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: "Thiếu dữ liệu đầu vào" });
            expect(sql.connect).not.toHaveBeenCalled(); // Should not attempt DB connection
        });

        it('should handle database error during count lookup', async () => {
            mockReq.body = { phase_code: 'P1', time_slot: '08:00', task_description: 'New Task' };
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('Count DB Error'));

            await taskController.createTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi tạo nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[createTask] Error:', expect.any(Error));
        });

        it('should handle database error during task insertion', async () => {
            mockReq.body = { phase_code: 'P1', time_slot: '08:00', task_description: 'New Task' };
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: [{ count: 0 }] });
            mockRequestInstances[1].query.mockRejectedValueOnce(new Error('Insert DB Error'));

            await taskController.createTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi tạo nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[createTask] Error:', expect.any(Error));
        });

        it('should handle database connection error for createTask', async () => {
            mockReq.body = { phase_code: 'P1', time_slot: '08:00', task_description: 'New Task' };
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await taskController.createTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi tạo nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[createTask] Error:', expect.any(Error));
        });
    });

    // =========================================================================
    // updateTask
    // =========================================================================
    describe('updateTask', () => {
        it('should update a task successfully', async () => {
            mockReq.params.id = 1;
            mockReq.body = {
                phase_code: 'P1',
                time_slot: '09:00',
                task_id: 'P1_09_1',
                task_description: 'Updated Task',
                task_order: 1,
            };

            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Successful update

            await taskController.updateTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('phase_code', sql.VarChar, 'P1');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('time_slot', sql.VarChar, '09:00');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('task_id', sql.VarChar, 'P1_09_1');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('task_description', sql.NVarChar, 'Updated Task');
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('task_order', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE\s+behavior_tasks\s+SET\s+phase_code\s*=\s*@phase_code,\s+time_slot\s*=\s*@time_slot,\s+task_id\s*=\s*@task_id,\s+task_description\s*=\s*@task_description,\s+task_order\s*=\s*@task_order,\s+updated_at\s*=\s*GETDATE\(\)\s+WHERE\s+id\s*=\s*@id/i)
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Cập nhật nhiệm vụ thành công' });
        });

        it('should return 400 if missing input data for update', async () => {
            mockReq.params.id = 1;
            mockReq.body = {
                phase_code: 'P1',
                time_slot: '09:00',
                task_id: 'P1_09_1',
                task_description: 'Updated Task',
                // Missing task_order
            };

            await taskController.updateTask(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: "Thiếu dữ liệu đầu vào" });
            expect(sql.connect).not.toHaveBeenCalled();
        });

        it('should handle database error during task update', async () => {
            mockReq.params.id = 1;
            mockReq.body = {
                phase_code: 'P1',
                time_slot: '09:00',
                task_id: 'P1_09_1',
                task_description: 'Updated Task',
                task_order: 1,
            };
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('Update DB Error'));

            await taskController.updateTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi cập nhật nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[updateTask] Error:', expect.any(Error));
        });

        it('should handle database connection error for updateTask', async () => {
            mockReq.params.id = 1;
            mockReq.body = {
                phase_code: 'P1',
                time_slot: '09:00',
                task_id: 'P1_09_1',
                task_description: 'Updated Task',
                task_order: 1,
            };
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await taskController.updateTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi cập nhật nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[updateTask] Error:', expect.any(Error));
        });
    });

    // =========================================================================
    // deleteTask
    // =========================================================================
    describe('deleteTask', () => {
        it('should delete a task successfully', async () => {
            mockReq.params.id = 1;
            mockRequestInstances[0].query.mockResolvedValueOnce({}); // Successful delete

            await taskController.deleteTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].input).toHaveBeenCalledWith('id', sql.Int, 1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith('DELETE FROM behavior_tasks WHERE id = @id');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Xóa nhiệm vụ thành công' });
        });

        it('should return 400 if missing task ID for delete', async () => {
            mockReq.params.id = undefined; // Missing ID

            await taskController.deleteTask(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: "Thiếu ID nhiệm vụ" });
            expect(sql.connect).not.toHaveBeenCalled();
        });

        it('should handle database error during task deletion', async () => {
            mockReq.params.id = 1;
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('Delete DB Error'));

            await taskController.deleteTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi xóa nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[deleteTask] Error:', expect.any(Error));
        });

        it('should handle database connection error for deleteTask', async () => {
            mockReq.params.id = 1;
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await taskController.deleteTask(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi xóa nhiệm vụ' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[deleteTask] Error:', expect.any(Error));
        });
    });

    // =========================================================================
    // getBehaviorPhaseList
    // =========================================================================
    describe('getBehaviorPhaseList', () => {
        it('should get behavior phase list successfully', async () => {
            const mockPhases = [{ phase_code: 'P1', phase_name: 'Phase 1' }];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockPhases });

            await taskController.getBehaviorPhaseList(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+phase_code,\s+phase_name\s+FROM\s+behavior_phases\s+ORDER\s+BY\s+id\s+ASC/i)
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockPhases });
        });

        it('should handle database error during behavior phase list retrieval', async () => {
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await taskController.getBehaviorPhaseList(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi lấy danh sách giai đoạn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[getBehaviorPhaseList] Error:', expect.any(Error));
        });

        it('should handle database connection error for getBehaviorPhaseList', async () => {
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await taskController.getBehaviorPhaseList(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi lấy danh sách giai đoạn' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[getBehaviorPhaseList] Error:', expect.any(Error));
        });
    });

    // =========================================================================
    // getPhases
    // =========================================================================
    describe('getPhases', () => {
        it('should get main phases successfully and format data', async () => {
            const mockRawPhases = [
                { id: 1, phase: 'Phase One', phase_code: 'P1', range_start: 1, range_end: 10, goal: 'Goal 1', phase_order: 1 }
            ];
            const expectedFormattedPhases = [
                { phase: 'Phase One', phase_code: 'P1', range: [1, 10], goal: 'Goal 1', order: 1 }
            ];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockRawPhases });

            await taskController.getPhases(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+id,\s+phase_name\s+as\s+phase,\s+phase_code,\s+range_start,\s+range_end,\s+goal,\s+phase_order\s+FROM\s+phases\s+ORDER\s+BY\s+phase_order\s+ASC/i)
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: expectedFormattedPhases });
        });

        it('should handle database error during main phases retrieval', async () => {
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await taskController.getPhases(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi lấy danh sách phases' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[getPhases] Error:', expect.any(Error));
        });

        it('should handle database connection error for getPhases', async () => {
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await taskController.getPhases(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi lấy danh sách phases' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[getPhases] Error:', expect.any(Error));
        });
    });

    // =========================================================================
    // getBehaviorPhasesWithTasks
    // =========================================================================
    describe('getBehaviorPhasesWithTasks', () => {
        it('should get behavior phases with tasks successfully and group data', async () => {
            const mockRawData = [
                { phase_code: 'P1', phase_name: 'Phase 1', phase_order: 1, time_slot: '08:00', task_description: 'Task A', task_order: 1 },
                { phase_code: 'P1', phase_name: 'Phase 1', phase_order: 1, time_slot: '08:00', task_description: 'Task B', task_order: 2 },
                { phase_code: 'P2', phase_name: 'Phase 2', phase_order: 2, time_slot: '09:00', task_description: 'Task C', task_order: 1 },
                { phase_code: 'P3', phase_name: 'Phase 3', phase_order: 3, time_slot: null, task_description: null, task_order: null }, // Phase with no tasks
            ];
            const expectedFormattedData = [
                {
                    title: 'Phase 1',
                    phase_code: 'P1',
                    phase_order: 1,
                    tasks: {
                        '08:00': ['Task A', 'Task B'],
                    },
                },
                {
                    title: 'Phase 2',
                    phase_code: 'P2',
                    phase_order: 2,
                    tasks: {
                        '09:00': ['Task C'],
                    },
                },
                {
                    title: 'Phase 3',
                    phase_code: 'P3',
                    phase_order: 3,
                    tasks: {}, // Empty tasks object for phases without tasks
                },
            ];
            mockRequestInstances[0].query.mockResolvedValueOnce({ recordset: mockRawData });

            await taskController.getBehaviorPhasesWithTasks(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRequestInstances[0].query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT\s+bp\.phase_code,\s+bp\.phase_name,\s+bp\.phase_order,\s+bt\.time_slot,\s+bt\.task_description,\s+bt\.task_order\s+FROM\s+behavior_phases\s+bp\s+LEFT\s+JOIN\s+behavior_tasks\s+bt\s+ON\s+bp\.phase_code\s*=\s*bt\.phase_code\s+ORDER\s+BY\s+bp\.phase_order,\s+bt\.time_slot,\s+bt\.task_order/i)
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: expectedFormattedData });
        });

        it('should handle database error during behavior phases with tasks retrieval', async () => {
            mockRequestInstances[0].query.mockRejectedValueOnce(new Error('DB Select Error'));

            await taskController.getBehaviorPhasesWithTasks(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi lấy behavior phases với tasks' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[getBehaviorPhasesWithTasks] Error:', expect.any(Error));
        });

        it('should handle database connection error for getBehaviorPhasesWithTasks', async () => {
            sql.connect.mockRejectedValueOnce(new Error('Connection failed'));

            await taskController.getBehaviorPhasesWithTasks(mockReq, mockRes);

            expect(sql.connect).toHaveBeenCalledTimes(1);
            expect(mockPoolInstance.request).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Lỗi khi lấy behavior phases với tasks' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[getBehaviorPhasesWithTasks] Error:', expect.any(Error));
        });
    });
});
