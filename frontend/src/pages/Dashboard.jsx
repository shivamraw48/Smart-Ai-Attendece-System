import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [teacherEmail, setTeacherEmail] = useState('');

  // --- ATTENDANCE STATE ---
  const [batch, setBatch] = useState('A');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- TIMETABLE STATE ---
  const [schedule, setSchedule] = useState([]);
  const [timetableMsg, setTimetableMsg] = useState('');
  const [newClass, setNewClass] = useState({ subject: '', batch: 'A', day: 'Monday', start: '', end: '' });

  // --- SECURITY CHECK ON LOAD ---
  useEffect(() => {
    const token = localStorage.getItem('teacherToken');
    if (!token) {
      // If no wristband, kick them to the login page!
      navigate('/login');
    } else {
      setTeacherEmail(localStorage.getItem('teacherEmail'));
    }
  }, [navigate]);

  // --- HELPER TO GET THE WRISTBAND ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('teacherToken');
    return {
      headers: {
        Authorization: `Bearer ${token}` // Show the wristband to the Bouncer
      }
    };
  };

  // Fetch Attendance (Secured)
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/attendance/batch/${batch}`, getAuthHeaders());
      setAttendanceRecords(response.data.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) handleLogout(); // Token expired!
      setError('Failed to fetch attendance data. ' + (err.response?.data?.message || ''));
    }
    setLoading(false);
  };

  // Fetch Timetable (Secured)
  const fetchTimetable = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/timetable/${batch}`, getAuthHeaders());
      setSchedule(response.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      console.error("Error fetching schedule", err);
    }
  };

  // Run fetches when tab or batch changes
  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'timetable') fetchTimetable();
  }, [batch, activeTab]);

  // Handle Adding a Class (Secured)
  const handleAddClass = async (e) => {
    e.preventDefault();
    setTimetableMsg('Saving...');
    try {
      await axios.post('http://localhost:5000/api/timetable', newClass, getAuthHeaders());
      setTimetableMsg('✅ Class added successfully!');
      setNewClass({ ...newClass, subject: '', start: '', end: '' }); 
      fetchTimetable(); 
      setTimeout(() => setTimetableMsg(''), 3000);
    } catch (err) {
      setTimetableMsg('❌ Error adding class.');
    }
  };

  // Logout Logic
  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherEmail');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      
      {/* Top Header with Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px 20px', backgroundColor: '#e3f2fd', borderRadius: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>👨‍🏫 Teacher Dashboard</h1>
          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>Logged in as: <strong>{teacherEmail}</strong></p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
        <button onClick={() => setActiveTab('attendance')} style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', backgroundColor: activeTab === 'attendance' ? '#4CAF50' : '#ddd', color: activeTab === 'attendance' ? 'white' : 'black', border: 'none' }}>📋 View Attendance</button>
        <button onClick={() => setActiveTab('timetable')} style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', backgroundColor: activeTab === 'timetable' ? '#2196F3' : '#ddd', color: activeTab === 'timetable' ? 'white' : 'black', border: 'none' }}>📅 Manage Timetable</button>
      </div>

      {/* Batch Selector (Used for both tabs) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', justifyContent: 'center' }}>
        <label style={{ fontSize: '18px', fontWeight: 'bold' }}>Select Target Batch:</label>
        <select value={batch} onChange={(e) => setBatch(e.target.value)} style={{ padding: '10px', fontSize: '16px', borderRadius: '5px' }}>
          <option value="A">Batch A</option>
          <option value="B">Batch B</option>
          <option value="C">Batch C</option>
          <option value="D">Batch D</option>
        </select>
      </div>

      {/* --- TAB 1: ATTENDANCE VIEWER --- */}
      {activeTab === 'attendance' && (
        <div>
          {loading ? <p style={{textAlign: 'center'}}>Loading...</p> : error ? <p style={{color:'red', textAlign:'center'}}>{error}</p> : attendanceRecords.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '10px' }}>
              <h3>No attendance records found for Batch {batch} today.</h3>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#282c34', color: 'white', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>PRN</th>
                  <th style={{ padding: '12px' }}>Subject</th>
                  <th style={{ padding: '12px' }}>Date</th> {/* NEW COLUMN */}
                  <th style={{ padding: '12px' }}>Time Marked</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{record.name}</td>
                    <td style={{ padding: '12px' }}>{record.prn}</td>
                    <td style={{ padding: '12px' }}>{record.subject}</td>
                    {/* Display the actual Date alongside the time */}
                    <td style={{ padding: '12px' }}>{new Date().toLocaleDateString()}</td> 
                    <td style={{ padding: '12px', color: 'green', fontWeight: 'bold' }}>{record.timeMarked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- TAB 2: TIMETABLE MANAGER --- */}
      {activeTab === 'timetable' && (
        <div style={{ padding: '20px', backgroundColor: '#f4f4f4', borderRadius: '10px' }}>
          <h2>Add New Class</h2>
          <form onSubmit={handleAddClass} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '15px' }}>
            <input type="text" placeholder="Subject Name" required value={newClass.subject} onChange={(e) => setNewClass({...newClass, subject: e.target.value})} style={{ padding: '10px', flex: '1' }} />
            
            <select value={newClass.batch} onChange={(e) => setNewClass({...newClass, batch: e.target.value})} style={{ padding: '10px' }}>
              <option value="A">Batch A</option>
              <option value="B">Batch B</option>
              <option value="C">Batch C</option>
              <option value="D">Batch D</option>
            </select>

            {/* NEW DAY DROPDOWN */}
            <select value={newClass.day} onChange={(e) => setNewClass({...newClass, day: e.target.value})} style={{ padding: '10px' }}>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>

            <input type="time" required value={newClass.start} onChange={(e) => setNewClass({...newClass, start: e.target.value})} style={{ padding: '10px' }} title="Start Time" />
            <input type="time" required value={newClass.end} onChange={(e) => setNewClass({...newClass, end: e.target.value})} style={{ padding: '10px' }} title="End Time" />
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Save Class</button>
          </form>
          <p style={{ color: timetableMsg.includes('✅') ? 'green' : 'red', fontWeight: 'bold', height: '20px' }}>{timetableMsg}</p>

          <h3 style={{ marginTop: '30px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Live Schedule for Batch {batch}</h3>
          {schedule.length === 0 ? <p>No classes scheduled.</p> : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
             {schedule.map((cls, idx) => (
                <li key={idx} style={{ padding: '15px', backgroundColor: 'white', marginBottom: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', boxShadow: '0px 2px 5px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{cls.subject}</span>
                  {/* Now showing the Day next to the time! */}
                  <span style={{ color: '#555' }}>📅 {cls.day} | 🕒 {cls.start} - {cls.end}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;