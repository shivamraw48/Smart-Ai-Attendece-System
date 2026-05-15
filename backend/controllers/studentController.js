const Student = require('../models/Student'); // Import our Student blueprint

// @desc    Register a new student
// @route   POST /api/students/register
const registerStudent = async (req, res) => {
    try {
        // 1. Extract data from the incoming request body
        const { name, prn, batch, faceDescriptor } = req.body;

        // 2. Basic Validation: Check if all fields were provided
        if (!name || !prn || !batch || !faceDescriptor) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // 3. Check if a student with this PRN already exists
        const studentExists = await Student.findOne({ prn: prn.toUpperCase() });
        if (studentExists) {
            return res.status(400).json({ message: 'A student with this PRN is already registered' });
        }

        // 4. Create and save the new student in MongoDB
        const newStudent = await Student.create({
            name,
            prn,
            batch,
            faceDescriptor
        });

        // 5. Send a success response back to the frontend
        res.status(201).json({
            message: 'Student registered successfully',
            student: {
                _id: newStudent._id,
                name: newStudent.name,
                prn: newStudent.prn,
                batch: newStudent.batch
            }
        });

    } catch (error) {
        console.error('Error in registerStudent:', error);
        res.status(500).json({ message: 'Server Error. Could not register student.' });
    }
};

// @desc    Get all registered students (used by Kiosk for facial matching)
// @route   GET /api/students
const getAllStudents = async (req, res) => {
    try {
        // Fetch all students. We specifically need the name, prn, and faceDescriptor
        const students = await Student.find({}).select('name prn faceDescriptor');
        
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update the exports to include the new function!
module.exports = { registerStudent, getAllStudents };

