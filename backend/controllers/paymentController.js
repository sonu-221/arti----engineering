const pool = require('../config/db');

exports.getPayments = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [payments] = await connection.query('SELECT * FROM salary_payments ORDER BY date DESC, id DESC');
    connection.release();
    res.status(200).json({ message: 'Payments retrieved', payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    const [payments] = await connection.query('SELECT * FROM salary_payments WHERE user_id = ? ORDER BY date DESC', [userId]);
    connection.release();
    res.status(200).json({ message: 'Payments retrieved for user', payments });
  } catch (error) {
    console.error('Get payments by user error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { userId, amount, date, month, notes } = req.body;
    if (!userId || amount == null || !date || !month) {
      return res.status(400).json({ error: 'Missing required payment fields' });
    }
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO salary_payments
        (user_id, amount, date, month, notes, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, amount, date, month, notes || null]
    );
    connection.release();
    res.status(201).json({ message: 'Salary payment recorded', paymentId: result.insertId });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM salary_payments WHERE id = ?', [id]);
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.status(200).json({ message: 'Salary payment deleted' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: error.message });
  }
};
