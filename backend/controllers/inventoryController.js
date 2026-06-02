const pool = require('../config/db');

exports.getInventory = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [items] = await connection.query('SELECT * FROM inventory_items ORDER BY name');
    connection.release();
    res.status(200).json({ message: 'Inventory retrieved', items });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [items] = await connection.query('SELECT * FROM inventory_items WHERE id = ?', [id]);
    connection.release();
    if (items.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.status(200).json({ message: 'Inventory item retrieved', item: items[0] });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.addInventoryItem = async (req, res) => {
  try {
    const { name, category, unitType, quantity, lowStockThreshold, unitPrice } = req.body;
    if (!name || !category || !unitType || quantity == null || lowStockThreshold == null || unitPrice == null) {
      return res.status(400).json({ error: 'Missing required inventory fields' });
    }
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO inventory_items
        (name, category, unit_type, quantity, low_stock_threshold, unit_price, last_updated, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [name, category, unitType, quantity, lowStockThreshold, unitPrice]
    );
    connection.release();
    res.status(201).json({ message: 'Inventory item added', itemId: result.insertId });
  } catch (error) {
    console.error('Add inventory item error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unitType, quantity, lowStockThreshold, unitPrice } = req.body;
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `UPDATE inventory_items SET
        name = ?,
        category = ?,
        unit_type = ?,
        quantity = ?,
        low_stock_threshold = ?,
        unit_price = ?,
        last_updated = NOW(),
        updated_at = NOW()
      WHERE id = ?`,
      [name, category, unitType, quantity, lowStockThreshold, unitPrice, id]
    );
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.status(200).json({ message: 'Inventory item updated' });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM inventory_items WHERE id = ?', [id]);
    connection.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.status(200).json({ message: 'Inventory item deleted' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ error: error.message });
  }
};
