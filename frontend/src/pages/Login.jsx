import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      localStorage.setItem('teacherToken', response.data.token);
      localStorage.setItem('teacherEmail', response.data.email);

      // Force a hard reload so the Navigation bar immediately updates to show the Teacher buttons
      window.location.href = '/dashboard';

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      
      {/* THE NEW BACK BUTTON */}
      <div style={{ width: '300px', marginBottom: '20px', textAlign: 'left' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#555', fontWeight: 'bold', fontSize: '16px', display: 'inline-block', padding: '8px 12px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          ← Back to Kiosk
        </Link>
      </div>

      <h2>🔒 Teacher Login</h2>
      
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>❌ {error}</p>}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px', marginTop: '10px' }}>
        <input 
          type="email" 
          placeholder="Teacher Email" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          style={{ padding: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background 0.3s' }}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;