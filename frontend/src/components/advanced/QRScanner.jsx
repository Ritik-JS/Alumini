import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, Maximize2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setScanning(true);

      // Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by your browser');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message || 'Failed to access camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const simulateScan = () => {
    // For demo purposes - simulate scanning a QR code
    // In production, this would use a real QR code scanning library
    setScanSuccess(true);
    setTimeout(() => {
      const mockQRData = "ALM-2019-00287"; // Mock card number
      onScan(mockQRData);
      stopCamera();
    }, 1000);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" data-testid="qr-scanner-modal">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Camera className="h-6 w-6" />
              Scan QR Code
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="close-scanner-button"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Scanner Area */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
            {!scanning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera className="h-16 w-16 mb-4 text-blue-400" />
                <p className="text-lg mb-4">Position QR code in front of camera</p>
                <Button onClick={startCamera} variant="default" data-testid="start-camera-button">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              </div>
            ) : scanSuccess ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-green-600/90">
                <CheckCircle className="h-16 w-16 mb-4 animate-bounce" />
                <p className="text-xl font-bold">Scan Successful!</p>
                <p className="text-sm">Verifying card...</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="w-full h-0.5 bg-blue-500 animate-scan-line" />
                    </div>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full inline-block">
                    Align QR code within the frame
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="cancel-scan-button"
            >
              Cancel
            </Button>
            
            {scanning && !scanSuccess && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  data-testid="stop-camera-button"
                >
                  Stop Camera
                </Button>
                <Button
                  variant="default"
                  onClick={simulateScan}
                  data-testid="simulate-scan-button"
                >
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Simulate Scan (Demo)
                </Button>
              </div>
            )}
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            Allow camera access when prompted. Make sure the QR code is well-lit and in focus.
          </p>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes scan-line {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(16rem);
          }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
