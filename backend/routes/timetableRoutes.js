const express = require('express');
const router = express.Router();
const { addClass, getTimetableByBatch } = require('../controllers/timetableController');
const { protect } = require('../middleware/authMiddleware'); // Import the bouncer

// Put 'protect' as the middle argument to lock these routes!
router.post('/', protect, addClass);
router.get('/:batch', protect, getTimetableByBatch);

module.exports = router;