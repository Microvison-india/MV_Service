import { useState, useRef, useEffect } from 'react';
import api from '../../../api/axios';

export default function VoiceRecorder({ onUpload, uploadedUrl = '' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError('');
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mimeType (Fallback for iOS Safari)
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (!MediaRecorder.isTypeSupported('audio/webm')) {
        // Very old safari fallback
        mimeType = ''; 
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/mp4' });
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimeLeft(60);

      // Start 60s countdown
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            mediaRecorder.stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Mic access error:', err);
      setError('Could not access microphone. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const uploadAudio = async (blob) => {
    setIsUploading(true);
    const formData = new FormData();
    // Use .webm or .mp4 extension so backend multer accepts it
    const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('audio', blob, `voice-note.${extension}`);

    try {
      const { data } = await api.post('/api/upload/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpload(data.audio.url);
    } catch (err) {
      console.error('Upload Error:', err);
      setError('Failed to upload voice note. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteRecording = () => {
    onUpload(''); // Clear the URL in parent state
  };

  if (uploadedUrl) {
    return (
      <div className="w-full bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
        <audio src={uploadedUrl} controls className="flex-1 w-full" />
        <button
          type="button"
          onClick={deleteRecording}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isUploading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isUploading ? 'Uploading...' : '🎤 Start Recording'}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition flex items-center gap-2 animate-pulse"
          >
            ⏹ Stop Recording
          </button>
        )}
        
        {isRecording && (
          <span className="text-sm font-semibold text-red-600">
            {timeLeft}s remaining
          </span>
        )}
      </div>
      
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      
      <p className="text-xs text-muted-foreground mt-2">
        Maximum 60 seconds. Make sure your browser has microphone permissions.
      </p>
    </div>
  );
}
