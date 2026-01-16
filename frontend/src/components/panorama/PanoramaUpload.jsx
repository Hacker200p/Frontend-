import React, { useState } from 'react';

const PanoramaUpload = ({ 
  roomId, 
  currentPanorama = null, 
  onUploadSuccess, 
  onDelete 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, JPG, or PNG)');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('panorama', selectedFile);

      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3000/api/owner/rooms/${roomId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setProgress(100);
      setSelectedFile(null);
      setPreview(null);
      
      if (onUploadSuccess) {
        onUploadSuccess(data.data);
      }

      // Show success message
      setTimeout(() => {
        setProgress(0);
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload panorama');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPanorama || !window.confirm('Are you sure you want to delete this panorama?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3000/api/owner/rooms/${roomId}/panorama`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Delete failed');
      }

      if (onDelete) {
        onDelete();
      }

    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete panorama');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          360° Panorama Photo
        </label>
        {currentPanorama && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Delete Current
          </button>
        )}
      </div>

      {/* Current Panorama Display */}
      {currentPanorama && (
        <div className="relative bg-gray-100 rounded-lg p-4 border border-gray-300">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {currentPanorama.originalFilename || 'Panorama Image'}
              </p>
              <p className="text-xs text-gray-500">
                {currentPanorama.dimensions?.width}x{currentPanorama.dimensions?.height} • 
                Uploaded {new Date(currentPanorama.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <a
              href={currentPanorama.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View
            </a>
          </div>
        </div>
      )}

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          id={`panorama-${roomId}`}
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        {preview ? (
          <div className="space-y-3">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-40 mx-auto rounded-lg"
            />
            <p className="text-sm text-gray-600">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600">
              Drop your panorama photo here or
            </p>
          </div>
        )}

        <label
          htmlFor={`panorama-${roomId}`}
          className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
        >
          {preview ? 'Change File' : 'Select File'}
        </label>

        <p className="mt-2 text-xs text-gray-500">
          Supports fisheye, cubemap, or equirectangular formats (JPEG, PNG) • Max 50MB
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Converting & Uploading...
            </span>
          ) : (
            'Upload Panorama'
          )}
        </button>
      )}

      {/* Progress Bar */}
      {uploading && progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Panoramic Photos</p>
            <ul className="text-xs space-y-1 text-blue-700">
              <li>• Images are automatically converted to equirectangular format (2:1 ratio)</li>
              <li>• Perfect for immersive 360° virtual room tours</li>
              <li>• Works with fisheye, cubemap, or standard panorama formats</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanoramaUpload;
