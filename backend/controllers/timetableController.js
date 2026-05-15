const Timetable = require('../models/Timetable');

// @desc    Add a new class to the schedule
// @route   POST /api/timetable
const addClass = async (req, res) => {
    try {
        const { batch, day, subject, start, end } = req.body; // Add 'day' here

        if (!batch || !day || !subject || !start || !end) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        const newClass = await Timetable.create({
            batch: batch.toUpperCase(),
            day, // Add 'day' here
            subject,
            start,
            end
        });

        res.status(201).json({ message: 'Class added successfully', data: newClass });
    } catch (error) {
        console.error('Error adding class:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get the timetable for a specific batch
// @route   GET /api/timetable/:batch
const getTimetableByBatch = async (req, res) => {
    try {
        const { batch } = req.params;
        
        // Find all classes for this batch, sorted by start time
        const schedule = await Timetable.find({ batch: batch.toUpperCase() }).sort({ start: 1 });
        
        res.status(200).json(schedule);
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { addClass, getTimetableByBatch };