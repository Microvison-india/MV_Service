import { useState } from 'react';
import api from '../../api/axios';

// GRD Section 8 — ReopenBanner
// Shown when the admin enters a phone number that matches an eligible complaint.
// Admin chooses: Reopen (fill notes + photos) OR Dismiss and create a brand new complaint.

export default function ReopenBanner({ existingComplaint, onReopen, onDismiss }) {
  const [reopenNotes, setReopenNotes] = useState('');
  const [reopenPhotos, setReopenPhotos] = useState([]); // Array of Cloudinary URLs
  const [uploading, setUploading] = useState(false);
  const [choosing, setChoosing] = useState(true); // true = show choice, false = show reopen form

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (reopenPhotos.length + files.length > 5) {
      alert('Maximum 5 reopen photos allowed.');
      e.target.value = null;
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    try {
      const { data } = await api.post('/api/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReopenPhotos((prev) => [...prev, ...data.images.map((img) => img.url)]);
    } catch {
      alert('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleReopenSubmit = () => {
    if (!reopenNotes.trim()) {
      alert('Reopen notes are required.');
      return;
    }
    onReopen({ reopenNotes, reopenPhotos });
  };

  return (
    <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 p-5 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-yellow-600 text-xl mt-0.5">⚠️</span>
        <div className="flex-1">
          <p className="font-semibold text-yellow-800">Reopen Eligible Complaint Found</p>
          <p className="text-sm text-yellow-700 mt-1">
            Complaint <strong>{existingComplaint.complaintId}</strong> for{' '}
            <strong>{existingComplaint.customerName}</strong> in{' '}
            <strong>{existingComplaint.city}</strong> was marked{' '}
            <strong>{existingComplaint.status}</strong> within the last 30 days.
          </p>

          {choosing ? (
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setChoosing(false)}
                className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition"
              >
                Reopen This Complaint
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="px-4 py-2 bg-white border border-yellow-400 text-yellow-800 text-sm font-medium rounded-lg hover:bg-yellow-100 transition"
              >
                Create New Complaint Instead
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-yellow-800 mb-1">
                  Reopen Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reopenNotes}
                  onChange={(e) => setReopenNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe why this complaint is being reopened..."
                  className="w-full rounded-lg border border-yellow-300 bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-yellow-800 mb-1">
                  Reopen Photos (optional, max 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploading || reopenPhotos.length >= 5}
                  className="text-sm text-yellow-800"
                />
                {uploading && <p className="text-xs text-yellow-700 mt-1">Uploading...</p>}
                {reopenPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {reopenPhotos.map((url, i) => (
                      <img key={i} src={url} alt={`reopen-${i}`} className="w-14 h-14 rounded object-cover border border-yellow-300" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReopenSubmit}
                  className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition"
                >
                  Confirm Reopen & Proceed
                </button>
                <button
                  type="button"
                  onClick={() => setChoosing(true)}
                  className="px-4 py-2 bg-white border border-yellow-400 text-yellow-800 text-sm font-medium rounded-lg hover:bg-yellow-100 transition"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
