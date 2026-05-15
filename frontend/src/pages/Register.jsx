import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';

const Register = () => {
  const videoRef = useRef(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', prn: '', batch: 'A' });
  const [status, setStatus] = useState('Loading AI Models...');
  const [isReady, setIsReady] = useState(false);

  // 1. Load Models & Start Webcam
  useEffect(() => {
    const init = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setStatus('Ready for Registration');
        setIsReady(true);
      } catch (error) {
        setStatus('Error loading camera or models.');
      }
    };
    init();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. The Registration Logic
  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus('Scanning face...');

    if (videoRef.current) {
      // Run the AI ONCE to get the face descriptor
      const detection = await faceapi.detectSingleFace(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setStatus('❌ No face detected. Please look straight into the camera.');
        return;
      }

      // CRITICAL STEP: face-api returns a Float32Array. 
      // We must convert it to a standard JavaScript Array for MongoDB to accept it.
      const descriptorArray = Array.from(detection.descriptor);

      setStatus('Saving to database...');

      try {
        // --- NEW SECURITY LOGIC ---
        // Get the token from local storage
        const token = localStorage.getItem('teacherToken');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Send the data AND the token to our Node.js Backend!
        const response = await axios.post('http://localhost:5000/api/students/register', {
          name: formData.name,
          prn: formData.prn,
          batch: formData.batch,
          faceDescriptor: descriptorArray
        }, config); // <-- Don't forget to add 'config' here!
        // --------------------------

        setStatus(`✅ Success! ${response.data.student.name} is registered.`);
        setFormData({ name: '', prn: '', batch: 'A' }); // Clear the form
        
      } catch (error) {
        // Show the exact error message from our backend (e.g., "PRN already exists")
        setStatus(`❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
      <h2>📝 Student Registration</h2>
      <p style={{ fontWeight: 'bold', color: status.includes('❌') ? 'red' : status.includes('✅') ? 'green' : 'black' }}>
        {status}
      </p>

      <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
        {/* Left Side: Webcam */}
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          style={{ borderRadius: '10px', backgroundColor: '#000' }}
          width="400"
          height="300"
        />

        {/* Right Side: Form */}
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Full Name" 
            required 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ padding: '10px' }}
          />
          <input 
            type="text" 
            placeholder="PRN Number" 
            required 
            value={formData.prn}
            onChange={(e) => setFormData({ ...formData, prn: e.target.value })}
            style={{ padding: '10px', textTransform: 'uppercase' }}
          />
          <select 
            value={formData.batch}
            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
            style={{ padding: '10px' }}
          >
            <option value="A">Batch A</option>
            <option value="B">Batch B</option>
            <option value="C">Batch C</option>
            <option value="D">Batch D</option>
          </select>
          
          <button 
            type="submit" 
            disabled={!isReady}
            style={{ padding: '15px', backgroundColor: isReady ? '#4CAF50' : '#ccc', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Capture Face & Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;