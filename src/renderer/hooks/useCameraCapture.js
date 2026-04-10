import { useState, useCallback, useRef } from 'react';

export function useCameraCapture() {
  const [capturing, setCapturing] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      setImageData(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCapturing(true);
    } catch (err) {
      setError(err.message || 'Camera not available');
      setCapturing(false);
    }
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current) {
      setError('No video element');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Get base64 without the data:image/... prefix
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1] || '';
    setImageData(base64);
    return base64;
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setImageData(null);
    setError(null);
  }, [stop]);

  return { capturing, imageData, error, videoRef, start, capture, stop, reset };
}
