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

    try {
      const { data } = await api.post('/api/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const newUrls = data.images.map((img) => img.url);
      onUpload([...uploadedUrls, ...newUrls]);
    } catch (err) {
      console.error('Upload Error:', err);
      setError(err.response?.data?.message || 'Failed to upload images. Please try again.');
    } finally {
      setLoading(false);
      e.target.value = null; // reset input
    }
  };

  const removeImage = (indexToRemove) => {
    onUpload(uploadedUrls.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-4">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={loading || uploadedUrls.length >= maxFiles}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || uploadedUrls.length >= maxFiles}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {loading ? 'Uploading...' : 'Click to Upload Images'}
        </button>
        <span className="text-sm text-muted-foreground">
          {uploadedUrls.length} / {maxFiles} uploaded
        </span>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Thumbnail Grid */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {uploadedUrls.map((url, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted">
              <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-700"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
