const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const router = express.Router();

router.get('/', attendanceController.getAllAttendance);
router.get('/date/:date', attendanceController.getAttendanceByDate);
router.get('/user/:userId', attendanceController.getAttendanceByUser);
router.post('/', attendanceController.saveAttendance);
router.post('/bulk', attendanceController.bulkSaveAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
