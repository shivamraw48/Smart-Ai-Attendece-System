const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    prn: { 
        type: String,
        required: true,
        unique: true,   // Crucial: The PRN is the ultimate unique identifier
        trim: true,
        uppercase: true // Smart addition: Standardizes PRNs (e.g., 'prn123' becomes 'PRN123')
    },
    batch: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D'], // Restricts input to valid batches. Adjust these as needed!
        uppercase: true
    },
    faceDescriptor: {
        type: [Number], 
        required: true
    }
}, { 
    timestamps: true    
});

module.exports = mongoose.model('Student', studentSchema);