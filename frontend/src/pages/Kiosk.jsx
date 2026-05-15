import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';

const Kiosk = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // THE NEW MEMORY VAULT: Remembers who has already been scanned this session
  const scannedPRNs = useRef(new Set()); 
  
  const [status, setStatus] = useState('Initializing System...');
  const [scanMessage, setScanMessage] = useState(''); 
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
      <h2>📸 Smart Kiosk Scanner</h2>
      
      <h3 style={{ color: status.includes('Ready') ? 'green' : '#ff9800' }}>{status}</h3>
      
      <h2 style={{ height: '30px', color: scanMessage.includes('✅') ? 'green' : scanMessage.includes('❌') ? 'red' : 'blue' }}>
        {scanMessage}
      </h2>

      <div style={{ position: 'relative', marginTop: '10px' }}>
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          onPlay={handleVideoPlay}
          style={{ borderRadius: '10px', backgroundColor: '#000', boxShadow: '0px 10px 30px rgba(0,0,0,0.3)' }}
          width="720"
          height="560"
        />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      </div>
    </div>
  );
};

export default Kiosk;