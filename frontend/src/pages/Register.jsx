import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import { Camera, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({ name: '', prn: '', batch: 'A' });
  const [status, setStatus] = useState('Loading AI Models...');
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [faceQuality, setFaceQuality] = useState(null);
  const [capturedFace, setCapturedFace] = useState(false);

  // Load Models & Start Webcam
  useEffect(() => {
    const init = async () => {
      try {
        setStatus('📦 Loading AI Models...');
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setStatus('🎥 Starting Camera...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatus('✅ Ready for Registration');
        setIsReady(true);
      } catch (error) {
        setStatus('❌ Error loading camera or models');
      }
    };
    init();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Monitor face quality in real-time
  const monitorFaceQuality = async () => {
    if (!videoRef.current) return;

    const interval = setInterval(async () => {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const box = detection.detection.box;
        const videoWidth = videoRef.current.offsetWidth;
        const videoHeight = videoRef.current.offsetHeight;

        // Calculate face position quality (centered = better)
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        const distFromCenterX = Math.abs(centerX - videoWidth / 2);
        const distFromCenterY = Math.abs(centerY - videoHeight / 2);
        const quality = Math.max(
          0,
          100 - (distFromCenterX + distFromCenterY) / (videoWidth + videoHeight) * 200
        );

        setFaceQuality(Math.round(quality));
      } else {
        setFaceQuality(0);
      }
    }, 500);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (currentStep === 2 && isReady) {
      return monitorFaceQuality();
    }
  }, [currentStep, isReady]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.prn.trim()) newErrors.prn = 'PRN is required';
    if (formData.prn.trim().length < 5) newErrors.prn = 'PRN must be at least 5 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateForm()) {
      setCurrentStep(2);
    }
  };

  const handleCaptureFace = async () => {
    if (!videoRef.current) return;

    setLoading(true);
    setStatus('📸 Scanning face...');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('❌ No face detected. Look straight at the camera');
        setStatus('❌ No face detected');
        setLoading(false);
        return;
      }

      // Draw face to canvas for preview
      const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
      faceapi.matchDimensions(canvasRef.current, displaySize);
      const resizedDetection = faceapi.resizeResults(detection, displaySize);

      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      faceapi.draw.drawDetections(canvasRef.current, resizedDetection);

      setCapturedFace(true);
      const descriptorArray = Array.from(detection.descriptor);

      setStatus('💾 Registering student...');

      const token = localStorage.getItem('teacherToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const response = await axios.post(
        'http://localhost:5000/api/students/register',
        {
          name: formData.name,
          prn: formData.prn.toUpperCase(),
          batch: formData.batch,
          faceDescriptor: descriptorArray,
        },
        config
      );

      toast.success(`✅ ${response.data.student.name} registered successfully!`);
      setStatus(`✅ Success! ${response.data.student.name} is registered.`);
      setFormData({ name: '', prn: '', batch: 'A' });
      setCurrentStep(3);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`❌ ${errorMsg}`);
      setStatus(`❌ Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFormData({ name: '', prn: '', batch: 'A' });
    setCapturedFace(false);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="container-max max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-gradient-primary rounded-full px-6 py-3">
            <Camera className="text-white" size={24} />
            <h1 className="text-3xl font-bold text-white">Student Registration</h1>
          </div>
          <p className="text-slate-600">Add new students with face recognition</p>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-4 mb-12">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex-1">
              <div
                className={`flex items-center justify-center h-12 rounded-lg font-semibold transition-all ${
                  step === currentStep
                    ? 'bg-primary-600 text-white shadow-lg'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step < currentStep ? <CheckCircle size={20} /> : `Step ${step}`}
              </div>
              <p className="text-center text-sm mt-2 text-slate-600">
                {step === 1 ? 'Student Info' : step === 2 ? 'Face Scan' : 'Complete'}
              </p>
            </div>
          ))}
        </div>

        {/* Step 1: Form */}
        {currentStep === 1 && (
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Student Information</h2>

            <div className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`input ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle size={16} />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* PRN Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  PRN (Permanent Registration Number)
                </label>
                <input
                  type="text"
                  placeholder="PRN12345"
                  value={formData.prn}
                  onChange={(e) => {
                    setFormData({ ...formData, prn: e.target.value.toUpperCase() });
                    if (errors.prn) setErrors({ ...errors, prn: '' });
                  }}
                  className={`input ${errors.prn ? 'input-error' : ''}`}
                />
                {errors.prn && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle size={16} />
                    {errors.prn}
                  </p>
                )}
              </div>

              {/* Batch Select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Batch
                </label>
                <select
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="input"
                >
                  <option value="A">Batch A</option>
                  <option value="B">Batch B</option>
                  <option value="C">Batch C</option>
                  <option value="D">Batch D</option>
                </select>
              </div>

              {/* Next Button */}
              <button onClick={handleNextStep} className="btn btn-primary btn-lg w-full">
                Next: Capture Face
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Face Capture */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Feed */}
              <div className="card">
                <p className="text-sm font-medium text-slate-600 mb-3">Camera Feed</p>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-square object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                  />

                  {/* Face Quality Indicator */}
                  {faceQuality !== null && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-3">
                      <p className="text-white text-sm mb-2">Face Quality: {faceQuality}%</p>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            faceQuality > 70
                              ? 'bg-green-500'
                              : faceQuality > 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${faceQuality}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <p className="mt-4 text-center text-sm font-medium text-slate-600">{status}</p>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="card border-2 border-primary-200 bg-primary-50">
                  <h3 className="font-semibold text-primary-900 mb-3">📋 Tips for Best Results</h3>
                  <ul className="space-y-2 text-sm text-primary-800">
                    <li className="flex gap-2">
                      <span>✓</span>
                      <span>Position your face in the center of the frame</span>
                    </li>
                    <li className="flex gap-2">
                      <span>✓</span>
                      <span>Ensure good lighting on your face</span>
                    </li>
                    <li className="flex gap-2">
                      <span>✓</span>
                      <span>Look directly at the camera</span>
                    </li>
                    <li className="flex gap-2">
                      <span>✓</span>
                      <span>Keep your face clearly visible (no obstructions)</span>
                    </li>
                    <li className="flex gap-2">
                      <span>✓</span>
                      <span>Get quality score above 70% for best recognition</span>
                    </li>
                  </ul>
                </div>

                {/* Student Info Summary */}
                <div className="card bg-slate-50">
                  <h3 className="font-semibold mb-3">Student Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-600">Name:</span>
                      <span className="font-medium ml-2">{formData.name}</span>
                    </p>
                    <p>
                      <span className="text-slate-600">PRN:</span>
                      <span className="font-medium ml-2">{formData.prn}</span>
                    </p>
                    <p>
                      <span className="text-slate-600">Batch:</span>
                      <span className="font-medium ml-2">{formData.batch}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="btn btn-outline btn-lg flex-1"
              >
                Back
              </button>
              <button
                onClick={handleCaptureFace}
                disabled={loading || !isReady || faceQuality === null || faceQuality < 40}
                className="btn btn-primary btn-lg flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    <span>Capture & Register</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && (
          <div className="card max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
            <p className="text-slate-600 mb-6">
              {formData.name} has been registered with face recognition enabled
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <p className="text-green-800 font-medium">
                ✓ Student can now use the Kiosk for attendance marking
              </p>
            </div>

            <button onClick={handleReset} className="btn btn-primary btn-lg w-full">
              Register Another Student
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;