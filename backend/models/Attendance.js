const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student',                       
        required: true
    },
    subject: {               // <-- NEW ADDITION
        type: String,
        required: true
    },
    
    date: {
        type: Date,
        default: Date.now 
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'], 
        default: 'Present'
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema);