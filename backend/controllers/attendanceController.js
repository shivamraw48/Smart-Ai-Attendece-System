const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Timetable = require('../models/Timetable'); // 1. Import the live Timetable model

// @desc    Helper function to query the live MongoDB timetable
// @desc    Helper function to query the live MongoDB timetable
const getCurrentClassFromDB = async (batch) => {
    const now = new Date();
    
    // 1. Figure out what day of the week it is right now!
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = daysOfWeek[now.getDay()]; 

    // 2. Format current time exactly as "HH:MM" 
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    // 3. Query MongoDB for TODAY'S specific class!
    const activeClass = await Timetable.findOne({
        batch: batch.toUpperCase(),
        day: currentDay,              // <-- NEW: Only look for classes happening today!
        start: { $lte: currentTime }, 
        end: { $gte: currentTime }    
    });

    return activeClass; 
};

// @desc    Mark attendance via Kiosk face scan
// @route   POST /api/attendance/scan
const markAttendance = async (req, res) => {
    try {
        const { prn } = req.body;

        if (!prn) {
            return res.status(400).json({ message: 'PRN is required from the scanner' });
        }

        // 1. Find the student in the database
        const student = await Student.findOne({ prn: prn.toUpperCase() });
        if (!student) {
            return res.status(404).json({ message: 'Student not found. Please register first.' });
        }

        // 2. LIVE TIMETABLE CHECK
        // We now await the live database query instead of the hardcoded object
        const currentClass = await getCurrentClassFromDB(student.batch);
        
        // If there is no class right now in the database
        if (!currentClass) {
            return res.status(400).json({ 
                message: `No active classes right now for Batch ${student.batch}.` 
            });
        }

        // 3. THE CANCELLED CLASS INTERCEPTION
        // The database document has an 'isCancelled' boolean!
        if (currentClass.isCancelled) {
            return res.status(200).json({
                message: `${currentClass.subject} is cancelled today. Enjoy your free time!`
            });
        }

        const currentSubject = currentClass.subject; 

        // 4. Prevent Double-Marking! 
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0); 

        const alreadyMarked = await Attendance.findOne({
            studentId: student._id,
            subject: currentSubject,
            date: { $gte: startOfDay } 
        });

        if (alreadyMarked) {
            return res.status(200).json({ 
                message: `Attendance already marked for ${currentSubject} today.` 
            });
        }

        // 5. Save the attendance record!
        const newAttendance = await Attendance.create({
            studentId: student._id,
            subject: currentSubject,
            status: 'Present'
        });

        res.status(201).json({
            message: `Success! Marked present for ${currentSubject}.`,
            studentName: student.name,
            subject: currentSubject
        });

    } catch (error) {
        console.error('Error in markAttendance:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get today's attendance for a specific batch
// @route   GET /api/attendance/batch/:batch
const getAttendanceByBatch = async (req, res) => {
    try {
        const { batch } = req.params; 

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const attendanceRecords = await Attendance.find({
            date: { $gte: startOfDay }
        })
        .populate({
            path: 'studentId',           
            match: { batch: batch.toUpperCase() }, 
            select: 'name prn batch'     
        });

        const filteredRecords = attendanceRecords.filter(record => record.studentId !== null);

        const responseData = filteredRecords.map(record => ({
            name: record.studentId.name,
            prn: record.studentId.prn,
            subject: record.subject,
            timeMarked: record.date.toLocaleTimeString(),
            status: record.status
        }));

        res.status(200).json({
            count: responseData.length,
            batch: batch.toUpperCase(),
            data: responseData
        });

    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { markAttendance, getAttendanceByBatch };