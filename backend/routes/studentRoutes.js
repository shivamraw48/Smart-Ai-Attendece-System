const express = require('express');
const router = express.Router();
const { registerStudent, getAllStudents } = require('../controllers/studentController'); 
const { protect } = require('../middleware/authMiddleware'); // 1. Import the Bouncer

// Route to get all students (The Kiosk needs this to be open!)
router.get('/', getAllStudents);

// Route to register a student (LOCKED! Only logged-in teachers can add students)
router.post('/register', protect, registerStudent);

module.exports = router;