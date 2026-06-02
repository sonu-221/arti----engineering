const pool = require('../config/db');

exports.getProjects = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [projects] = await connection.query('SELECT * FROM projects ORDER BY created_at DESC');
    connection.release();
    res.status(200).json({ message: 'Projects retrieved', projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [projects] = await connection.query('SELECT * FROM projects WHERE id = ?', [id]);
    connection.release();
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(200).json({ message: 'Project retrieved', project: projects[0] });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, location, budget, startDate, endDate, status, progress, image } = req.body;

    if (!name || !location || budget == null || !startDate || !endDate || !status || progress == null) {
      return res.status(400).json({ error: 'Missing required project fields' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO projects
        (name, location, budget, start_date, end_date, status, progress, image, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, location, budget, startDate, endDate, status, progress, image || null]
    );
    connection.release();
    res.status(201).json({ message: 'Project created', projectId: result.insertId });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, budget, startDate, endDate, status, progress, image } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `UPDATE projects SET
        name = ?,
        location = ?,
        budget = ?,
        start_date = ?,
        end_date = ?,
        status = ?,
        progress = ?,
        image = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [name, location, budget, startDate, endDate, status, progress, image || null, id]
    );
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(200).json({ message: 'Project updated' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM projects WHERE id = ?', [id]);
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(200).json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: error.message });
  }
};
