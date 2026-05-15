import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, AlertCircle, Download, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('attendance');
  const [teacherEmail, setTeacherEmail] = useState('');

  // --- ATTENDANCE STATE ---
  const [batch, setBatch] = useState('A');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });

  // --- TIMETABLE STATE ---
  const [schedule, setSchedule] = useState([]);
  const [timetableMsg, setTimetableMsg] = useState('');
  const [newClass, setNewClass] = useState({ subject: '', batch: 'A', day: 'Monday', start: '', end: '' });
  const [classToDelete, setClassToDelete] = useState(null);

  // --- SECURITY CHECK ON LOAD ---
  useEffect(() => {
    const token = localStorage.getItem('teacherToken');
    if (!token) {
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
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Fetch Attendance (Secured)
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/attendance/batch/${batch}`,
        getAuthHeaders()
      );
      setAttendanceRecords(response.data.data);

      // Calculate stats
      const total = response.data.data.length;
      const present = response.data.data.length;
      const absent = Math.max(0, total - present);

      setStats({ total, present, absent });
      setError('');
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      setError('Failed to fetch attendance data');
    }
    setLoading(false);
  };

  // Fetch Timetable (Secured)
  const fetchTimetable = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/timetable/${batch}`,
        getAuthHeaders()
      );
      setSchedule(response.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      console.error('Error fetching schedule', err);
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
      toast.success('✅ Class added successfully!');
      setTimetableMsg('');
      setNewClass({ subject: '', batch: 'A', day: 'Monday', start: '', end: '' });
      fetchTimetable();
    } catch (err) {
      toast.error('❌ Error adding class');
      setTimetableMsg('');
    }
  };

  // Handle Deleting a Class (Secured)
  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/timetable/${classToDelete}`, getAuthHeaders());
      toast.success('✅ Class deleted successfully!');
      fetchTimetable(); // Refresh the list after deleting
    } catch (err) {
      toast.error('❌ Error deleting class');
      console.error('Error deleting class', err);
    } finally {
      setClassToDelete(null);
    }
  };

  // Logout Logic
  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherEmail');
    navigate('/login');
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container-max py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <div className="bg-gradient-primary rounded-lg p-2">
                <Users className="text-white" size={32} />
              </div>
              Teacher Dashboard
            </h1>
            <p className="text-slate-600">
              Logged in as: <span className="font-semibold text-primary-600">{teacherEmail}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          {[
            { id: 'attendance', label: '📋 Attendance', icon: '📋' },
            { id: 'timetable', label: '📅 Timetable', icon: '📅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- ATTENDANCE TAB --- */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Batch Selector */}
            <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm-soft">
              <label className="font-semibold text-slate-900">Select Batch:</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="input w-48"
              >
                <option value="A">Batch A</option>
                <option value="B">Batch B</option>
                <option value="C">Batch C</option>
                <option value="D">Batch D</option>
              </select>

              <button className="ml-auto btn btn-primary flex items-center gap-2">
                <Download size={18} />
                Export as CSV
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card bg-green-50 border-0">
                <p className="text-sm text-slate-600 mb-1">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="card bg-red-50 border-0">
                <p className="text-sm text-slate-600 mb-1">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="card bg-blue-50 border-0">
                <p className="text-sm text-slate-600 mb-1">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Attendance Table */}
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-slate-600">Loading attendance records...</p>
              </div>
            ) : error ? (
              <div className="card bg-red-50 border border-red-200">
                <p className="text-red-600">{error}</p>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="card text-center py-12">
                <AlertCircle className="mx-auto mb-4 text-slate-400" size={40} />
                <p className="text-slate-600">No attendance records found for Batch {batch} today</p>
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">PRN</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Subject</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Date & Day</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Time Marked</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{record.name}</td>
                        <td className="px-4 py-3 text-slate-600">{record.prn}</td>
                        <td className="px-4 py-3 text-slate-600">{record.subject}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-medium text-slate-900">{record.dateMarked}</div>
                          <div className="text-xs text-slate-500">{record.dayMarked}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 flex items-center gap-2">
                          <Clock size={16} className="text-primary-600" />
                          {record.timeMarked}
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge badge-success">✓ Present</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TIMETABLE TAB --- */}
        {activeTab === 'timetable' && (
          <div className="space-y-6">
            {/* Batch Selector */}
            <div className="flex items-center gap-4">
              <label className="font-semibold text-slate-900">Select Batch:</label>
              <select
                value={newClass.batch}
                onChange={(e) => setNewClass({ ...newClass, batch: e.target.value })}
                className="input w-48"
              >
                <option value="A">Batch A</option>
                <option value="B">Batch B</option>
                <option value="C">Batch C</option>
                <option value="D">Batch D</option>
              </select>
            </div>

            {/* Add Class Form */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-6 text-slate-900 flex items-center gap-2">
                <Plus size={24} className="text-primary-600" />
                Add New Class
              </h3>

              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Mathematics"
                      required
                      value={newClass.subject}
                      onChange={(e) =>
                        setNewClass({ ...newClass, subject: e.target.value })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Day
                    </label>
                    <select
                      value={newClass.day}
                      onChange={(e) => setNewClass({ ...newClass, day: e.target.value })}
                      className="input"
                    >
                      {days.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newClass.start}
                      onChange={(e) =>
                        setNewClass({ ...newClass, start: e.target.value })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newClass.end}
                      onChange={(e) => setNewClass({ ...newClass, end: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  Save Class
                </button>
              </form>

              {timetableMsg && (
                <p
                  className={`mt-4 text-center font-medium ${
                    timetableMsg.includes('✅') ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {timetableMsg}
                </p>
              )}
            </div>

            {/* Schedule Display */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900">Schedule for Batch {batch}</h3>

              {schedule.length === 0 ? (
                <div className="card text-center py-12">
                  <Calendar className="mx-auto mb-4 text-slate-400" size={40} />
                  <p className="text-slate-600">No classes scheduled</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schedule.map((cls, idx) => (
                    <div key={idx} className="card border-l-4 border-l-primary-600 hover:shadow-md-soft transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-slate-900">{cls.subject}</h4>
                          <p className="text-sm text-slate-600">{cls.day}</p>
                        </div>
                      <button 
                        onClick={() => setClassToDelete(cls._id)}
                        title="Delete Class"
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-primary-600 font-semibold">
                        <Clock size={18} />
                        <span>
                          {cls.start} - {cls.end}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Class</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this class? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setClassToDelete(null)} 
                className="btn btn-outline text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteClass} 
                className="btn bg-red-600 hover:bg-red-700 text-white border-0"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;