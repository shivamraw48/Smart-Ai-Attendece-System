import Kiosk from './pages/Kiosk';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Login from './pages/Login';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, X, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

// --- THE FRONTEND BOUNCER ---
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('teacherToken');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// --- MODERN NAVIGATION BAR ---
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('teacherToken');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const teacherEmail = localStorage.getItem('teacherEmail');

  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherEmail');
    navigate('/');
    window.location.reload();
  };

  const navLinks = [
    { path: '/register', label: '+ Register Student', icon: '📝' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-primary-700 to-secondary-700 shadow-lg-soft">
      <div className="container-max">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 text-white font-bold text-xl hover:opacity-90 transition-opacity"
          >
            <div className="bg-white rounded-lg p-2">
              <span className="text-2xl">📸</span>
            </div>
            <span>Smart Attendance</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isLoggedIn ? (
              location.pathname !== '/login' && (
                <Link
                  to="/login"
                  className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200"
                >
                  🔒 Teacher Login
                </Link>
              )
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      location.pathname === link.path
                        ? 'bg-white text-primary-700 font-semibold'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}

                {/* User Profile Dropdown */}
                <div className="flex items-center gap-4 pl-4 border-l border-white/30">
                  <div className="text-right">
                    <p className="text-sm text-white/80">Teacher</p>
                    <p className="text-sm font-medium text-white truncate max-w-xs">{teacherEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-all duration-200 text-white"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/20 mt-4 pt-4 space-y-2">
            {!isLoggedIn ? (
              location.pathname !== '/login' && (
                <Link
                  to="/login"
                  className="block text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🔒 Teacher Login
                </Link>
              )
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      location.pathname === link.path
                        ? 'bg-white text-primary-700 font-semibold'
                        : 'text-white hover:bg-white/20'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-red-500/20 transition-all flex items-center gap-2"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

// --- MAIN ROUTER ---
function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Navigation />

      <Routes>
        <Route path="/" element={<Kiosk />} />
        <Route path="/login" element={<Login />} />

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