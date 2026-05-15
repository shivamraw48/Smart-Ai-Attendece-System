const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceByBatch } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware'); // Import the bouncer
// CRITICAL: The Kiosk scanner does NOT require a login to mark attendance
router.post('/scan', markAttendance);

// Only logged-in teachers can view the attendance data
router.get('/batch/:batch', protect, getAttendanceByBatch);

module.exports = router;