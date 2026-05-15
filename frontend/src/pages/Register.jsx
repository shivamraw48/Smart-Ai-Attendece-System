import { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import { UserPlus, Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const Register = () => {
  const videoRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', prn: '', batch: 'A' });
  const [status, setStatus] = useState('Loading AI Models...');
  const [isReady, setIsReady] = useState(false);

  // 1. Load AI Models and Start Camera
  useEffect(() => {
    const loadModelsAndStartCamera = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setStatus('Models loaded. Starting camera...');
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 720, height: 560 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
          setStatus('Ready to register. Look at the camera and fill out the form.');
        }
      } catch (err) {
        setStatus('❌ Error loading models or accessing camera.');
        console.error(err);
      }
    };

    loadModelsAndStartCamera();

    // Cleanup function to stop the camera when leaving the page
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Handle the Registration Process
  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus('Scanning face...');

    if (!videoRef.current) return;

    // Detect the face and get the 128-point descriptor
    const detection = await faceapi.detectSingleFace(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceDescriptor();

    if (!detection) {
      setStatus('❌ No face detected. Please look directly at the camera.');
      return;
    }

    // Convert Float32Array to standard array for MongoDB
    const descriptorArray = Array.from(detection.descriptor);

    try {
      // --- SECURE API CALL ---
      const token = localStorage.getItem('teacherToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post('http://localhost:5000/api/students/register', {
        name: formData.name,
        prn: formData.prn,
        batch: formData.batch,
        faceDescriptor: descriptorArray
      }, config);

      setStatus(`✅ Success! ${response.data.student.name} is registered.`);
      setFormData({ name: '', prn: '', batch: 'A' }); // Reset form

    } catch (error) {
      setStatus('❌ Error: ' + (error.response?.data?.message || 'Failed to register student.'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-3 rounded-xl shadow-sm">
            <UserPlus className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Student Registration</h1>
            <p className="text-slate-600">Register new students with facial recognition</p>
          </div>
        </div>

        {/* Status Alert */}
        {status && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm-soft ${
            status.includes('❌') ? 'bg-red-50 border-red-200 text-red-700' :
            status.includes('✅') ? 'bg-green-50 border-green-200 text-green-700' :
            'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            {status.includes('❌') ? <AlertCircle size={24} /> :
             status.includes('✅') ? <CheckCircle size={24} /> :
             <Loader2 className="animate-spin" size={24} />}
            <span className="font-medium">{status.replace(/[❌✅]/g, '').trim()}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="card flex flex-col items-center justify-center min-h-[450px]">
            <div className="w-full flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Camera className="text-primary-600" size={20} />
                Live Camera Feed
              </h3>
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isReady ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isReady ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              </span>
            </div>
            
            <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center aspect-[4/3]">
              {!isReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="animate-spin" size={32} />
                  <p>Initializing Camera...</p>
                </div>
              )}
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                width="720"
                height="560"
                className={`w-full h-full object-cover transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          </div>

          {/* Form Section */}
          <div className="card">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Student Details</h3>
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Jane Doe" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">PRN (Registration Number)</label>
                <input 
                  type="text" 
                  placeholder="e.g., PRN12345" 
                  required 
                  value={formData.prn}
                  onChange={(e) => setFormData({ ...formData, prn: e.target.value.toUpperCase() })}
                  className="input w-full font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Batch</label>
                <select 
                  value={formData.batch} 
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="input w-full bg-white"
                >
                  <option value="A">Batch A</option>
                  <option value="B">Batch B</option>
                  <option value="C">Batch C</option>
                  <option value="D">Batch D</option>
                </select>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={!isReady || status.includes('Scanning')}
                  className={`btn btn-lg w-full flex items-center justify-center gap-2 ${
                    (!isReady || status.includes('Scanning'))
                      ? 'bg-slate-300 border-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300 hover:border-slate-300'
                      : 'btn-primary'
                  }`}
                >
                  {status.includes('Scanning') ? (
                    <><Loader2 className="animate-spin" size={20} /> Processing...</>
                  ) : (
                    <><UserPlus size={20} /> Capture & Register</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;