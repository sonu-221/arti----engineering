const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const router = express.Router();

router.get('/', inventoryController.getInventory);
router.get('/:id', inventoryController.getInventoryItem);
router.post('/', inventoryController.addInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);

module.exports = router;
