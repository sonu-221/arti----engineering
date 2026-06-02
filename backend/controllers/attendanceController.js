const pool = require('../config/db');

exports.getAllAttendance = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [records] = await connection.query(
      `SELECT * FROM attendance_records ORDER BY date DESC, id DESC`
    );
    connection.release();
    res.status(200).json({ message: 'Attendance records retrieved', records });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const connection = await pool.getConnection();
    const [records] = await connection.query(
      'SELECT * FROM attendance_records WHERE date = ? ORDER BY user_id, id DESC',
      [date]
    );
    connection.release();
    res.status(200).json({ message: 'Attendance by date retrieved', records });
  } catch (error) {
    console.error('Get attendance by date error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAttendanceByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    const [records] = await connection.query(
      'SELECT * FROM attendance_records WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    connection.release();
    res.status(200).json({ message: 'Attendance by user retrieved', records });
  } catch (error) {
    console.error('Get attendance by user error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.saveAttendance = async (req, res) => {
  try {
    const {
      userId,
      date,
      status,
      dutyStatus,
      dutyOnTime,
      dutyOffTime,
      overtimeHours,
      punchInPhoto,
      punchOutPhoto,
      dailySalarySnapshot,
      workTypeSnapshot,
    } = req.body;

    if (!userId || !date || !status || !dutyStatus) {
      return res.status(400).json({ error: 'Missing required attendance fields' });
    }

    const connection = await pool.getConnection();
    const [existing] = await connection.query(
      'SELECT id FROM attendance_records WHERE user_id = ? AND date = ?',
      [userId, date]
    );

    if (existing.length > 0) {
      await connection.query(
        `UPDATE attendance_records SET
          status = ?,
          duty_status = ?,
          duty_on_time = ?,
          duty_off_time = ?,
          overtime_hours = ?,
          punch_in_photo = ?,
          punch_out_photo = ?,
          daily_salary_snapshot = ?,
          work_type_snapshot = ?,
          updated_at = NOW()
        WHERE user_id = ? AND date = ?`,
        [
          status,
          dutyStatus,
          dutyOnTime || null,
          dutyOffTime || null,
          overtimeHours || 0,
          punchInPhoto || null,
          punchOutPhoto || null,
          dailySalarySnapshot || 0,
          workTypeSnapshot || null,
          userId,
          date,
        ]
      );
    } else {
      await connection.query(
        `INSERT INTO attendance_records
          (user_id, date, status, duty_status, duty_on_time, duty_off_time, overtime_hours, punch_in_photo, punch_out_photo, daily_salary_snapshot, work_type_snapshot, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          date,
          status,
          dutyStatus,
          dutyOnTime || null,
          dutyOffTime || null,
          overtimeHours || 0,
          punchInPhoto || null,
          punchOutPhoto || null,
          dailySalarySnapshot || 0,
          workTypeSnapshot || null,
        ]
      );
    }

    connection.release();
    res.status(200).json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('Save attendance error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.bulkSaveAttendance = async (req, res) => {
  try {
    const records = req.body.records;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records must be a non-empty array' });
    }

    const connection = await pool.getConnection();
    const queries = [];
    const params = [];

    for (const record of records) {
      const {
        userId,
        date,
        status,
        dutyStatus,
        dutyOnTime,
        dutyOffTime,
        overtimeHours,
        punchInPhoto,
        punchOutPhoto,
        dailySalarySnapshot,
        workTypeSnapshot,
      } = record;

      if (!userId || !date || !status || !dutyStatus) continue;

      queries.push(`
        INSERT INTO attendance_records
          (user_id, date, status, duty_status, duty_on_time, duty_off_time, overtime_hours, punch_in_photo, punch_out_photo, daily_salary_snapshot, work_type_snapshot, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          duty_status = VALUES(duty_status),
          duty_on_time = VALUES(duty_on_time),
          duty_off_time = VALUES(duty_off_time),
          overtime_hours = VALUES(overtime_hours),
          punch_in_photo = VALUES(punch_in_photo),
          punch_out_photo = VALUES(punch_out_photo),
          daily_salary_snapshot = VALUES(daily_salary_snapshot),
          work_type_snapshot = VALUES(work_type_snapshot),
          updated_at = NOW();
      `);

      params.push(
        userId,
        date,
        status,
        dutyStatus,
        dutyOnTime || null,
        dutyOffTime || null,
        overtimeHours || 0,
        punchInPhoto || null,
        punchOutPhoto || null,
        dailySalarySnapshot || 0,
        workTypeSnapshot || null
      );
    }

    if (queries.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No valid attendance records found' });
    }

    for (let i = 0; i < queries.length; i += 1) {
      await connection.query(queries[i], params.slice(i * 11, i * 11 + 11));
    }

    connection.release();
    res.status(200).json({ message: 'Bulk attendance saved successfully' });
  } catch (error) {
    console.error('Bulk save attendance error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM attendance_records WHERE id = ?', [id]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.status(200).json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: error.message });
  }
};
