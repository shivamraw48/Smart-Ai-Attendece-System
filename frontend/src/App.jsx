import Kiosk from './pages/Kiosk';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';

// --- THE FRONTEND BOUNCER ---
// This wrapper prevents unauthorized access to specific pages
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('teacherToken');
  
  // If they have the token, render the page. If not, kick them to /login!
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// --- DYNAMIC NAVIGATION BAR ---
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const isLoggedIn = !!localStorage.getItem('teacherToken');

  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherEmail');
    navigate('/'); 
    window.location.reload(); 
  };

  return (
    <nav style={{ padding: '15px 30px', background: '#282c34', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <Link to="/" style={{ color: 'white', marginRight: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>📸 Smart Kiosk</Link>
      </div>
      
      <div>
        {!isLoggedIn ? (
          // Public View (Only show the login button if we are NOT on the login page!)
          location.pathname !== '/login' && (
            <Link to="/login" style={{ color: '#61dafb', textDecoration: 'none', fontWeight: 'bold' }}>Teacher Login</Link>
          )
        ) : (
          // Private View
          <>
            <Link to="/register" style={{ color: 'white', marginRight: '20px', textDecoration: 'none', borderBottom: location.pathname === '/register' ? '2px solid white' : 'none' }}>+ Register Student</Link>
            <Link to="/dashboard" style={{ color: 'white', marginRight: '20px', textDecoration: 'none', borderBottom: location.pathname === '/dashboard' ? '2px solid white' : 'none' }}>Dashboard</Link>
            <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

// --- MAIN ROUTER ---
function App() {
  return (
    <BrowserRouter>
      <Navigation />
      
      <Routes>
        {/* KIOSK IS NOW THE FIRST PAGE */}
        <Route path="/" element={<Kiosk />} />
        
        <Route path="/login" element={<Login />} />
        
        {/* --- LOCKED ROUTES --- */}
        <Route 
          path="/register" 
          element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;