const { sql, dbConfig } = require('../config/database');

// 1. Lấy danh sách tất cả nhiệm vụ (tùy chọn lọc theo phase_code)
exports.getAllTasks = async (req, res) => {
  const { phase_code } = req.query;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    let query = `
      SELECT id, phase_code, time_slot, task_id, task_description, task_order, created_at 
      FROM behavior_tasks
    `;

    if (phase_code) {
      query += ` WHERE phase_code = @phase_code`;
      request.input('phase_code', sql.VarChar, phase_code);
    }

    query += ` ORDER BY phase_code, time_slot, task_order`;

    const result = await request.query(query);
    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[getAllTasks] Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách nhiệm vụ' });
  }
};

// 2. Tạo nhiệm vụ mới
exports.createTask = async (req, res) => {
  const { phase_code, time_slot, task_description } = req.body;

  if (!phase_code || !time_slot || !task_description) {
    return res.status(400).json({ success: false, message: 'Thiếu dữ liệu đầu vào' });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const countResult = await pool.request()
      .input('phase_code', sql.VarChar, phase_code)
      .input('time_slot', sql.VarChar, time_slot)
      .query(`
        SELECT COUNT(*) AS count 
        FROM behavior_tasks 
        WHERE phase_code = @phase_code AND time_slot = @time_slot
      `);

    const order = countResult.recordset[0].count + 1;
    const hour = time_slot.split(':')[0]; // e.g., "08"
    const phaseNumber = phase_code.replace(/^P/i, '');
    const task_id = `P${phaseNumber}_${hour}_${order}`;

    await pool.request()
      .input('phase_code', sql.VarChar, phase_code)
      .input('time_slot', sql.VarChar, time_slot)
      .input('task_id', sql.VarChar, task_id)
      .input('task_description', sql.NVarChar, task_description)
      .input('task_order', sql.Int, order)
      .query(`
        INSERT INTO behavior_tasks 
        (phase_code, time_slot, task_id, task_description, task_order, created_at, updated_at)
        VALUES (@phase_code, @time_slot, @task_id, @task_description, @task_order, GETDATE(), GETDATE())
      `);

    res.status(201).json({ success: true, message: 'Tạo nhiệm vụ thành công' });
  } catch (error) {
    console.error('[createTask] Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo nhiệm vụ' });
  }
};

// 3. Cập nhật nhiệm vụ
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { phase_code, time_slot, task_id, task_description, task_order } = req.body;

  if (!id || !phase_code || !time_slot || !task_id || !task_description || !task_order) {
    return res.status(400).json({ success: false, message: 'Thiếu dữ liệu đầu vào' });
  }

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('id', sql.Int, id)
      .input('phase_code', sql.VarChar, phase_code)
      .input('time_slot', sql.VarChar, time_slot)
      .input('task_id', sql.VarChar, task_id)
      .input('task_description', sql.NVarChar, task_description)
      .input('task_order', sql.Int, task_order)
      .query(`
        UPDATE behavior_tasks
        SET phase_code = @phase_code,
            time_slot = @time_slot,
            task_id = @task_id,
            task_description = @task_description,
            task_order = @task_order,
            updated_at = GETDATE()
        WHERE id = @id
      `);

    res.status(200).json({ success: true, message: 'Cập nhật nhiệm vụ thành công' });
  } catch (error) {
    console.error('[updateTask] Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật nhiệm vụ' });
  }
};

// 4. Xóa nhiệm vụ
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Thiếu ID nhiệm vụ' });
  }

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM behavior_tasks WHERE id = @id`);

    res.status(200).json({ success: true, message: 'Xóa nhiệm vụ thành công' });
  } catch (error) {
    console.error('[deleteTask] Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa nhiệm vụ' });
  }
};

// 5. Lấy danh sách phase cho dropdown (behavior phase)
exports.getBehaviorPhaseList = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT phase_code, phase_name 
      FROM behavior_phases 
      ORDER BY id ASC
    `);

    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[getBehaviorPhaseList] Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách giai đoạn' });
  }
};
