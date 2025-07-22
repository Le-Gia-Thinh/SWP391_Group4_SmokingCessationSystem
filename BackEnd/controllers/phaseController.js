const { sql, dbConfig } = require("../config/database");

// Lấy tất cả phases
const getPhases = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const query = `
      SELECT id, phase_name, range_start, range_end, goal
      FROM phases 
      ORDER BY id ASC
    `;

    const result = await pool.request().query(query);

    // Chuyển đổi format để match với frontend
    const phases = result.recordset.map((row) => ({
      phase: row.phase_name,
      range: [row.range_start, row.range_end],
      goal: row.goal,
    }));

    res.json({
      success: true,
      data: phases,
    });
  } catch (error) {
    console.error("Error fetching phases:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin giai đoạn",
    });
  }
};

// Lấy tất cả behavior phases với tasks
const getBehaviorPhases = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const query = `
      SELECT 
        bp.id,
        bp.phase_code,
        bp.phase_name,
        bt.time_slot,
        bt.task_id,
        bt.task_description
      FROM behavior_phases bp
      LEFT JOIN behavior_tasks bt ON bp.phase_code = bt.phase_code
      ORDER BY bp.id ASC, bt.time_slot ASC, bt.task_id ASC
    `;

    const result = await pool.request().query(query);

    // Group by phase and organize tasks by time slot
    const phasesMap = {};

    result.recordset.forEach((row) => {
      if (!phasesMap[row.id]) {
        phasesMap[row.id] = {
          phase: row.phase_code,
          name: row.phase_name,
          tasks: {},
        };
      }

      if (row.time_slot && row.task_id) {
        if (!phasesMap[row.id].tasks[row.time_slot]) {
          phasesMap[row.id].tasks[row.time_slot] = [];
        }

        phasesMap[row.id].tasks[row.time_slot].push({
          task_id: row.task_id,
          task: row.task_description,
        });
      }
    });

    // Convert to array format expected by frontend
    const behaviorPhases = Object.values(phasesMap).map((phase) => [phase]);

    res.json({
      success: true,
      data: behaviorPhases,
    });
  } catch (error) {
    console.error("Error fetching behavior phases:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin kế hoạch hành vi",
    });
  }
};

// Lấy tasks cho một giai đoạn cụ thể
const getTasksByPhase = async (req, res) => {
  try {
    const { phaseId } = req.params;
    const pool = await sql.connect(dbConfig);

    const query = `
      SELECT 
        bp.phase_code,
        bp.phase_name,
        bt.time_slot,
        bt.task_id,
        bt.task_description
      FROM behavior_phases bp
      LEFT JOIN behavior_tasks bt ON bp.phase_code = bt.phase_code
      WHERE bp.id = @phaseId
      ORDER BY bt.time_slot ASC, bt.task_id ASC
    `;

    const result = await pool
      .request()
      .input("phaseId", sql.Int, phaseId)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giai đoạn",
      });
    }

    const phase = {
      phase: result.recordset[0].phase_code,
      name: result.recordset[0].phase_name,
      tasks: {},
    };

    result.recordset.forEach((row) => {
      if (row.time_slot && row.task_id) {
        if (!phase.tasks[row.time_slot]) {
          phase.tasks[row.time_slot] = [];
        }

        phase.tasks[row.time_slot].push({
          task_id: row.task_id,
          task: row.task_description,
        });
      }
    });

    res.json({
      success: true,
      data: phase,
    });
  } catch (error) {
    console.error("Error fetching tasks by phase:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin nhiệm vụ",
    });
  }
};

module.exports = {
  getPhases,
  getBehaviorPhases,
  getTasksByPhase,
};
