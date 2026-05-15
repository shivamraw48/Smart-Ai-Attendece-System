import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import { Camera, CheckCircle, User, Clock } from 'lucide-react';

const Kiosk = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // THE NEW MEMORY VAULT: Remembers who has already been scanned this session
  const scannedPRNs = useRef(new Set()); 
  
  const [status, setStatus] = useState('Initializing System...');
  const [scanMessage, setScanMessage] = useState(''); 
  const [recentScans, setRecentScans] = useState([]); // Holds the list of students marked today
  const [faceMatcher, setFaceMatcher] = useState(null);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        setStatus('Loading AI Models...');
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        setStatus('Downloading Student Database...');
        const response = await axios.get('http://localhost:5000/api/students');
        
        // Bulletproof logic to ignore corrupted data
        const validStudents = response.data.filter(
          student => student.faceDescriptor && student.faceDescriptor.length === 128
        );

        if (validStudents.length === 0) {
          setStatus('No valid face data found. Please register a real face.');
          return;
        }

        const labeledDescriptors = validStudents.map(student => {
          const floatArray = new Float32Array(student.faceDescriptor);
          return new faceapi.LabeledFaceDescriptors(student.prn, [floatArray]);
        });

        const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        setFaceMatcher(matcher);

        setStatus('Starting Camera...');
        startWebcam();

      } catch (error) {
        console.error('Initialization error:', error);
        setStatus('Error starting Kiosk. Is the backend running?');
      }
    };

    initializeSystem();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 720, height: 560 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('Ready! Step in front of the camera.');
      }
    } catch (err) {
      setStatus("Camera access denied.");
    }
  };

  const handleVideoPlay = () => {
    if (!faceMatcher) return; 

    setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const detection = await faceapi.detectSingleFace(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptor();

        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (detection) {
          const resizedDetection = faceapi.resizeResults(detection, displaySize);
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
          
          const box = new faceapi.draw.DrawBox(resizedDetection.detection.box, { label: bestMatch.toString() });
          box.draw(canvasRef.current);

          // --- THE NEW STABILIZED LOGIC ---
          // 1. Is it a real student?
          // 2. Have we NOT scanned them yet?
          if (bestMatch.label !== 'unknown' && !scannedPRNs.current.has(bestMatch.label)) {
            
            // Add them to our Memory Vault immediately so we don't scan them again
            scannedPRNs.current.add(bestMatch.label); 
            
            setScanMessage(`Recognized ${bestMatch.label}. Checking timetable...`);

            try {
              const res = await axios.post('http://localhost:5000/api/attendance/scan', {
                prn: bestMatch.label
              });
              setScanMessage(`✅ ${res.data.message}`);
              
              // Add the newly recognized student to our UI list
              if (res.status === 201) {
                setRecentScans(prev => [{
                  prn: bestMatch.label,
                  name: res.data.studentName || 'Student',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  subject: res.data.subject
                }, ...prev]);
              }
              
            } catch (err) {
              setScanMessage(`❌ ${err.response?.data?.message || 'Error marking attendance'}`);
            }

            // Clear the text message from the screen after 4 seconds 
            // BUT their PRN stays in the Memory Vault forever!
            setTimeout(() => {
              setScanMessage('');
            }, 4000);
          }
        }
      }
    }, 200); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary-600 p-3 rounded-xl shadow-sm">
            <Camera className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Smart Kiosk Scanner</h1>
            <p className="text-slate-600">Walk up to the camera to mark your attendance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Camera Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center">
              
              {/* Status Indicator */}
              <div className="w-full flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.includes('Ready') ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${status.includes('Ready') ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  </span>
                  {status}
                </h2>
              </div>
              
              <div className="relative inline-block mt-2">
                <video 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  onPlay={handleVideoPlay}
                  width="720"
                  height="560"
                  className="rounded-2xl bg-black shadow-xl border border-slate-200"
                />
                <canvas ref={canvasRef} className="absolute top-0 left-0" />
                
                {/* Pop-up Alert over the video */}
                {scanMessage && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-10">
                    <div className={`backdrop-blur-md px-6 py-4 rounded-xl border shadow-2xl text-center transition-all ${scanMessage.includes('✅') ? 'bg-green-500/90 border-green-400 text-white' : scanMessage.includes('❌') ? 'bg-red-500/90 border-red-400 text-white' : 'bg-blue-500/90 border-blue-400 text-white'}`}>
                      <p className="text-lg font-bold drop-shadow-sm">{scanMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Scanned List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full max-h-[700px] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={24} />
                  Marked Present
                </h2>
                <p className="text-sm text-slate-500 mt-1">Students detected this session</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {recentScans.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-12">
                    <User size={48} className="opacity-20" />
                    <p>Waiting for students...</p>
                  </div>
                ) : (
                  recentScans.map((scan, index) => (
                    <div key={`${scan.prn}-${index}`} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm-soft transition-all hover:shadow-md">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-900 truncate pr-2">{scan.name}</div>
                        <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-md flex items-center gap-1 shrink-0">
                          <CheckCircle size={12} /> Present
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span className="font-mono font-medium bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700">{scan.prn}</span>
                        <span className="flex items-center gap-1 text-xs font-medium">
                          <Clock size={12} /> {scan.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kiosk;