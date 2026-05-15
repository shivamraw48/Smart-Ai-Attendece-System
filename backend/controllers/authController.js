const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');

// A helper function to generate the VIP Wristband (JWT)
// It takes the Teacher's database ID and signs it with a secret key
const generateToken = (id) => {
    return jwt.sign({ id }, 'my_super_secret_jwt_key_123', {
        expiresIn: '30d', // The wristband expires in 30 days
    });
};

// @desc    Register a new teacher account
// @route   POST /api/auth/register
const registerTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;
       
        // Check if teacher already exists
        const teacherExists = await Teacher.findOne({ email });
        if (teacherExists) {
            return res.status(400).json({ message: 'Teacher already exists' });
        }

        // Create the teacher (the password scrambler runs automatically!)
        const teacher = await Teacher.create({ email, password });

        if (teacher) {
            res.status(201).json({
                _id: teacher._id,
                email: teacher.email,
                token: generateToken(teacher._id) // Hand them the wristband
            });
        }
    } catch (error) {
        console.error('🔥 CRITICAL ERROR IN REGISTER:', error); // This prints to your VS Code terminal
        res.status(500).json({ message: 'Server error', details: error.message }); // This sends it to Postman
    }
};

// @desc    Authenticate teacher & get token
// @route   POST /api/auth/login
const loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the teacher by email
        const teacher = await Teacher.findOne({ email });

        // 2. Check if teacher exists AND if the passwords match
        if (teacher && (await teacher.matchPassword(password))) {
            res.json({
                _id: teacher._id,
                email: teacher.email,
                token: generateToken(teacher._id) // Hand them the wristband!
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerTeacher, loginTeacher };