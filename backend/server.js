const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const connectDB = require('./config/db'); // 1. Import our new connection function

// 2. Execute the database connection
connectDB();

const app = express();

app.use(cors()); 
app.use(express.json()); 
const studentRoutes = require('./routes/studentRoutes'); // Import the routes file
app.use('/api/students', studentRoutes);

const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
    res.send('Smart Attendance Backend is running!');
});
const timetableRoutes = require('./routes/timetableRoutes');
app.use('/api/timetable', timetableRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running beautifully on port ${PORT}`);
});