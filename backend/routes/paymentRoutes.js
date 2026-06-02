const express = require('express');
const paymentController = require('../controllers/paymentController');
const router = express.Router();

router.get('/', paymentController.getPayments);
router.get('/user/:userId', paymentController.getPaymentsByUser);
router.post('/', paymentController.recordPayment);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
