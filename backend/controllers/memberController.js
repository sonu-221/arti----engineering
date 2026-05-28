const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// ==================== GET ALL MEMBERS ====================
exports.getMembers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [members] = await connection.query(
      'SELECT id, name, email, role, status, created_at FROM users WHERE role = "MEMBER" ORDER BY created_at DESC',
      []
    );
    
    connection.release();
    
    res.status(200).json({
      message: 'Members retrieved',
      members: members || []
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== GET PENDING MEMBERS ====================
exports.getPendingMembers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [members] = await connection.query(
      'SELECT id, name, email, role, status, created_at FROM users WHERE role = "MEMBER" AND status = "PENDING" ORDER BY created_at DESC',
      []
    );
    
    connection.release();
    
    res.status(200).json({
      message: 'Pending members retrieved',
      members: members || []
    });
  } catch (error) {
    console.error('Get pending members error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== APPROVE MEMBER ====================
exports.approveMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }
    
    const connection = await pool.getConnection();
    
    // Update member status to APPROVED
    await connection.query(
      'UPDATE users SET status = "APPROVED" WHERE id = ? AND role = "MEMBER"',
      [memberId]
    );
    
    // Get updated member
    const [updated] = await connection.query(
      'SELECT id, name, email, status FROM users WHERE id = ?',
      [memberId]
    );
    
    connection.release();
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.status(200).json({
      message: 'Member approved successfully',
      member: updated[0]
    });
  } catch (error) {
    console.error('Approve member error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== REJECT MEMBER ====================
exports.rejectMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }
    
    const connection = await pool.getConnection();
    
    // Update member status to REJECTED
    await connection.query(
      'UPDATE users SET status = "REJECTED" WHERE id = ? AND role = "MEMBER"',
      [memberId]
    );
    
    // Get updated member
    const [updated] = await connection.query(
      'SELECT id, name, email, status FROM users WHERE id = ?',
      [memberId]
    );
    
    connection.release();
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.status(200).json({
      message: 'Member rejected',
      member: updated[0]
    });
  } catch (error) {
    console.error('Reject member error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== CLEAR PENDING MEMBERS ====================
exports.clearPendingMembers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Delete all PENDING members
    const [result] = await connection.query(
      'DELETE FROM users WHERE role = "MEMBER" AND status = "PENDING"'
    );
    connection.release();
    res.status(200).json({
      message: 'All pending members cleared successfully',
      deletedCount: result.affectedRows || 0
    });
  } catch (error) {
    console.error('Clear pending members error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== DELETE ALL MEMBERS ====================
exports.deleteAllMembers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Delete all users with role MEMBER
    const [result] = await connection.query(
      'DELETE FROM users WHERE role = "MEMBER"'
    );
    connection.release();
    res.status(200).json({
      message: 'All members deleted successfully',
      deletedCount: result.affectedRows || 0
    });
  } catch (error) {
    console.error('Delete all members error:', error);
    res.status(500).json({ error: error.message });
  }
};
