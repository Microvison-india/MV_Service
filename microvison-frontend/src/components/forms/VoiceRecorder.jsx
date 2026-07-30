import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';

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
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);
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

