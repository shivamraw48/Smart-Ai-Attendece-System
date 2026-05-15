const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    batch: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D'],
        uppercase: true
    },
    // --- NEW FIELD ---
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    // -----------------
    subject: {
        type: String,
        required: true,
        trim: true
    },
    start: {
        type: String,
        required: true, 
    },
    end: {
        type: String,
        required: true, 
    },
    isCancelled: {
        type: Boolean,
        default: false 
    }
});

module.exports = mongoose.model('Timetable', timetableSchema);