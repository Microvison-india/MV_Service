import { useState, useRef } from 'react';
import api from '../../api/axios';

export default function ImageUploader({ maxFiles = 2, onUpload, uploadedUrls = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (uploadedUrls.length + files.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} images.`);
      e.target.value = null; // reset input
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
